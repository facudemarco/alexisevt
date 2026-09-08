"""Isolated banner tests; never connect to the configured production database."""
import io
import json
import os
import subprocess
import sys
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import Mock

os.environ["DATABASE_URL"] = "sqlite://"
os.environ["SECRET_KEY"] = "banner-test-only"
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import pytest
from fastapi import FastAPI, HTTPException, UploadFile
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core import banner_video as video
from app.api.routers import config
from app.models.config import SiteConfig


@pytest.fixture
def setup(tmp_path, monkeypatch):
    monkeypatch.setattr(video.settings, "VIDEOS_DIR", str(tmp_path))
    monkeypatch.setattr(video.settings, "VIDEOS_BASE_URL", "/media/videos")
    engine = create_engine("sqlite://")
    SiteConfig.__table__.create(engine)
    session = sessionmaker(bind=engine)
    monkeypatch.setattr(video, "SessionLocal", session)
    with session() as db:
        db.add(SiteConfig(clave="home_banner_video_url", valor="old.mp4"))
        db.commit()
    yield session
    engine.dispose()


def fake_encoder(args, timeout):
    if "-show_entries" in args:
        return SimpleNamespace(stdout=json.dumps({"streams": [{"width": 1920, "height": 1080, "avg_frame_rate": "60000/1001"}], "format": {"duration": "10"}}))
    Path(args[-1]).write_bytes(b"encoded")
    return SimpleNamespace(stdout="")


def test_success_publishes_all_urls_and_cleans_source(setup, monkeypatch):
    monkeypatch.setattr(video, "command", fake_encoder)
    job = config.upload_home_banner_video(UploadFile(filename="clip.mp4", file=io.BytesIO(b"input")))
    video.process_job(job)
    jobs, public = video.folders()
    assert video.read_job(jobs / f"{job['id']}.json")["status"] == "ready"
    assert job["fps"] == pytest.approx(59.94006)
    assert not list(jobs.glob("*.source"))
    assert len(list(public.iterdir())) == 3
    with setup() as db:
        banner = config.get_home_banner(db)
        assert banner.video_url.endswith("desktop.mp4")
        assert banner.mobile_video_url.endswith("mobile.mp4")
        assert banner.poster_url.endswith("poster.jpg")


def test_failed_encoding_preserves_active_banner(setup, monkeypatch):
    def fail_mobile(args, timeout):
        if str(args[-1]).endswith("mobile.mp4"):
            raise subprocess.CalledProcessError(1, args)
        return fake_encoder(args, timeout)
    monkeypatch.setattr(video, "command", fail_mobile)
    job = config.upload_home_banner_video(UploadFile(filename="clip.mov", file=io.BytesIO(b"input")))
    video.process_job(job)
    assert job["status"] == "error"
    assert not list(video.folders()[1].iterdir())
    with setup() as db:
        assert config.get_home_banner(db).video_url == "old.mp4"


@pytest.mark.parametrize("filename,content,code", [("bad.exe", b"x", 400), ("empty.mp4", b"", 400), ("large.mp4", b"x" * (1024 * 1024 + 1), 413)], ids=["invalid-format", "empty", "oversize"])
def test_reject_upload_and_cleanup(setup, monkeypatch, filename, content, code):
    monkeypatch.setattr(video.settings, "VIDEO_MAX_UPLOAD_MB", 1)
    with pytest.raises(HTTPException) as exc:
        config.upload_home_banner_video(UploadFile(filename=filename, file=io.BytesIO(content)))
    assert exc.value.status_code == code
    assert not list(video.folders()[0].iterdir())


def test_reject_second_job_and_persist_status(setup):
    job = config.upload_home_banner_video(UploadFile(filename="clip.mp4", file=io.BytesIO(b"input")))
    with pytest.raises(HTTPException) as exc:
        config.upload_home_banner_video(UploadFile(filename="next.mp4", file=io.BytesIO(b"input")))
    assert exc.value.status_code == 409
    assert config.banner_upload_status()["job"]["id"] == job["id"]


@pytest.mark.parametrize("rate,expected", [("30/1", 30), ("120/1", 60), ("60000/1001", 60000/1001)])
def test_frame_rate_preserved_or_capped(setup, monkeypatch, rate, expected):
    result = {"streams": [{"width": 1920, "height": 1080, "avg_frame_rate": rate}], "format": {"duration": "10"}}
    monkeypatch.setattr(video, "command", Mock(return_value=SimpleNamespace(stdout=json.dumps(result))))
    assert float(video.inspect_video(Path("clip"))[1]) == pytest.approx(expected)


def test_admin_routes_require_authentication(setup):
    app = FastAPI()
    app.include_router(config.router)
    with TestClient(app) as client:
        assert client.post("/home-banner/upload-video", files={"file": ("x.mp4", b"x")}).status_code == 401
        assert client.get("/home-banner/upload-status").status_code == 401


def test_interrupted_job_retries_without_exposing_partial_outputs(setup, monkeypatch):
    job = config.upload_home_banner_video(UploadFile(filename="clip.mp4", file=io.BytesIO(b"input")))
    job["status"] = "processing"
    video.save_job(job)

    def verify_private(args, timeout):
        assert not list(video.folders()[1].iterdir())
        with setup() as db:
            assert config.get_home_banner(db).video_url == "old.mp4"
        return fake_encoder(args, timeout)

    monkeypatch.setattr(video, "command", verify_private)
    video.process_job(video.read_job(video.folders()[0] / f"{job['id']}.json"))
    assert config.banner_upload_status()["job"]["status"] == "ready"


def test_overlong_video_is_rejected_before_encoding(setup, monkeypatch):
    monkeypatch.setattr(video.settings, "VIDEO_MAX_DURATION_SECONDS", 5)
    encode = Mock(side_effect=fake_encoder)
    monkeypatch.setattr(video, "command", encode)
    job = config.upload_home_banner_video(UploadFile(filename="clip.mp4", file=io.BytesIO(b"input")))
    video.process_job(job)
    assert job["status"] == "error"
    assert encode.call_count == 1  # FFprobe only; no encoding or publication.
    with setup() as db:
        assert config.get_home_banner(db).video_url == "old.mp4"
