"""Persistent video queue. Run exactly one worker: python -m app.core.banner_video."""
import json
import logging
import math
import shutil
import subprocess
import time
from fractions import Fraction
from pathlib import Path

from app.core.config import settings
from app.db.session import SessionLocal
from app.models.config import SiteConfig

logger = logging.getLogger(__name__)


def folders():
    root = Path(settings.VIDEOS_DIR)
    jobs, public = root / "jobs", root / "published"
    jobs.mkdir(parents=True, exist_ok=True)
    public.mkdir(parents=True, exist_ok=True)
    return jobs, public


def save_job(job):
    jobs, _ = folders()
    path = jobs / f"{job['id']}.json"
    temporary = path.with_suffix(".tmp")
    temporary.write_text(json.dumps(job), encoding="utf-8")
    temporary.replace(path)


def read_job(path):
    return json.loads(path.read_text(encoding="utf-8"))


def put_config(db, key, value):
    row = db.query(SiteConfig).filter_by(clave=key).first()
    if row is None:
        db.add(SiteConfig(clave=key, valor=value))
    else:
        row.valor = value


def command(args, timeout):
    return subprocess.run(args, check=True, capture_output=True, text=True, timeout=timeout)


def inspect_video(source):
    result = command([
        settings.FFPROBE_PATH, "-v", "error", "-protocol_whitelist", "file,pipe",
        "-select_streams", "v:0", "-show_entries",
        "stream=width,height,avg_frame_rate:format=duration", "-of", "json", str(source),
    ], 30)
    data = json.loads(result.stdout)
    stream = data["streams"][0]
    duration = float(data["format"]["duration"])
    fps = Fraction(stream["avg_frame_rate"])
    if not math.isfinite(duration) or not 0 < duration <= settings.VIDEO_MAX_DURATION_SECONDS:
        raise ValueError("Duración fuera del límite permitido.")
    if fps <= 0 or not 0 < stream["width"] <= 7680 or not 0 < stream["height"] <= 7680:
        raise ValueError("Dimensiones o cuadros por segundo no válidos.")
    return duration, min(fps, Fraction(60))


def process_job(job):
    jobs, public = folders()
    source = jobs / f"{job['id']}.source"
    outputs = []
    published = False
    try:
        job.update(status="processing", message="Optimizando el video…")
        save_job(job)
        duration, fps = inspect_video(source)
        for name, width, height, rate, buffer in [
            ("desktop", 1920, 1080, "6M", "12M"),
            ("mobile", 1280, 720, "3M", "6M"),
        ]:
            output = jobs / f"{job['id']}-{name}.mp4"
            outputs.append(output)
            # Bound both axes, never upscale; H.264 requires even dimensions.
            scale = f"scale=w='min(iw,{width})':h='min(ih,{height})':force_original_aspect_ratio=decrease:force_divisible_by=2,setsar=1"
            command([
                settings.FFMPEG_PATH, "-y", "-nostdin", "-v", "error",
                "-filter_threads", "2", "-threads", "2", "-protocol_whitelist", "file,pipe",
                "-i", str(source), "-map", "0:v:0", "-an", "-sn", "-dn",
                "-vf", f"{scale},fps={fps}", "-c:v", "libx264", "-preset", "medium",
                "-crf", "21", "-maxrate", rate, "-bufsize", buffer,
                "-pix_fmt", "yuv420p", "-threads", "4", "-movflags", "+faststart",
                str(output),
            ], settings.VIDEO_PROCESS_TIMEOUT_SECONDS)
        poster = jobs / f"{job['id']}-poster.jpg"
        outputs.append(poster)
        command([
            settings.FFMPEG_PATH, "-y", "-nostdin", "-v", "error", "-threads", "2",
            "-i", str(outputs[0]), "-frames:v", "1", "-q:v", "3", str(poster),
        ], 60)
        # Never expose partial encodes, including retries after a restart.
        for output in outputs:
            output.replace(public / output.name)
        base = settings.VIDEOS_BASE_URL.rstrip("/")
        values = dict(zip(
            ["home_banner_video_url", "home_banner_mobile_video_url", "home_banner_poster_url"],
            [f"{base}/{path.name}" for path in outputs],
        ))
        with SessionLocal() as db:
            for key, value in values.items():
                put_config(db, key, value)
            db.commit()  # All URLs become active together, only after successful encoding.
        published = True
        job.update(status="ready", message="Video publicado correctamente.", duration=duration, fps=float(fps))
    except Exception:
        logger.exception("Banner processing failed: %s", job["id"])
        job.update(status="error", message="No se pudo procesar el video. Revisá el formato y los límites e intentá nuevamente.")
    finally:
        if not published:
            for output in outputs:
                output.unlink(missing_ok=True)
        save_job(job)
        source.unlink(missing_ok=True)


def run_worker():
    logging.basicConfig(level=logging.INFO)
    if not shutil.which(settings.FFMPEG_PATH) or not shutil.which(settings.FFPROBE_PATH):
        raise RuntimeError("FFmpeg y FFprobe son obligatorios para procesar videos.")
    jobs, _ = folders()
    while True:
        try:
            # Processing jobs are retried after a worker/container restart.
            for path in sorted(jobs.glob("*.json"), key=lambda p: p.stat().st_mtime):
                job = read_job(path)
                if job["status"] in ("queued", "processing"):
                    process_job(job)
        except Exception:
            logger.exception("Video queue unavailable; retrying")
        time.sleep(3)


if __name__ == "__main__":
    run_worker()
