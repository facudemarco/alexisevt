"""Reservation closure tested against an isolated database and HTTP endpoints."""
import os
import sys
from pathlib import Path

os.environ["DATABASE_URL"] = "sqlite://"
os.environ["SECRET_KEY"] = "package-test-only"
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.api.routers import bookings, packages
from app.api.deps import get_db
from app.api.deps_security import get_current_admin_user
from app.models import Base
from app.models.config import Categoria, Destino
from app.models.user import User, UserRole
from app.models.booking import Reserva


@pytest.fixture
def api():
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    sessions = sessionmaker(bind=engine)
    with sessions() as db:
        db.add_all([Destino(id=1, nombre="Destino"), Categoria(id=1, nombre="Categoría", slug="categoria"),
                    User(id=1, nombre="Admin", email="admin@example.com", password_hash="test", rol=UserRole.ADMIN)])
        db.commit()
    app = FastAPI()
    app.include_router(packages.router, prefix="/packages")
    app.include_router(bookings.router, prefix="/bookings")

    def database():
        with sessions() as db:
            yield db

    user = User(id=1, nombre="Admin", rol=UserRole.ADMIN)
    app.dependency_overrides[get_db] = database
    app.dependency_overrides[get_current_admin_user] = lambda: user
    app.dependency_overrides[bookings.get_current_user] = lambda: user
    with TestClient(app) as client:
        yield client, sessions, user
    engine.dispose()


def create_package(client, completo=False):
    response = client.post("/packages/", json={"destino_id": 1, "categoria_id": 1,
        "titulo_subtitulo": "Salida", "duracion_dias": 2, "duracion_noches": 1,
        "precio_base": 100, "completo": completo})
    assert response.status_code == 200, response.text
    return response.json()["id"]


@pytest.mark.parametrize("role", [UserRole.ADMIN, UserRole.VENDEDOR])
def test_complete_visible_but_booking_rejected_for_all_roles(api, role):
    client, sessions, user = api
    package = create_package(client, True)
    user.rol = role
    assert client.get(f"/packages/{package}").json()["completo"] is True
    assert client.get("/packages/").json()[0]["completo"] is True
    result = client.post("/bookings/", json={"paquete_id": package, "precio_total": 100})
    assert result.status_code == 409
    assert "completo" in result.json()["detail"]
    with sessions() as db:
        assert db.query(Reserva).count() == 0


def test_closing_preserves_existing_bookings_and_reopening_allows_new(api):
    client, sessions, _ = api
    package = create_package(client)
    body = {"paquete_id": package, "precio_total": 100}
    reservation = client.post("/bookings/", json=body)
    assert reservation.status_code == 200, reservation.text
    assert client.put(f"/packages/{package}", json={"completo": True}).status_code == 200
    # An unrelated partial update must not clear the flag.
    assert client.put(f"/packages/{package}", json={"titulo_subtitulo": "Nuevo título"}).json()["completo"] is True
    assert client.post("/bookings/", json=body).status_code == 409
    existing_id = reservation.json()["id"]
    assert client.put(f"/bookings/{existing_id}", json={"paquete_id": package, "cliente_nombre": "Corregido"}).status_code == 200
    with sessions() as db:
        assert db.query(Reserva).count() == 1
    assert client.put(f"/packages/{package}", json={"completo": False}).status_code == 200
    assert client.post("/bookings/", json=body).status_code == 200


def test_cannot_transfer_booking_into_full_package(api):
    client, _, _ = api
    available = create_package(client)
    full = create_package(client, True)
    reservation = client.post("/bookings/", json={"paquete_id": available, "precio_total": 100}).json()
    response = client.put(f"/bookings/{reservation['id']}", json={"paquete_id": full})
    assert response.status_code == 409


def test_null_flag_is_rejected(api):
    client, _, _ = api
    package = create_package(client)
    assert client.put(f"/packages/{package}", json={"completo": None}).status_code == 422


def test_migration_defaults_existing_packages_to_available(monkeypatch):
    from sqlalchemy import text
    import update_db_v6
    engine = create_engine("sqlite://")
    with engine.begin() as connection:
        connection.execute(text("CREATE TABLE paquetes (id INTEGER PRIMARY KEY)"))
        connection.execute(text("INSERT INTO paquetes (id) VALUES (1)"))
    monkeypatch.setattr(update_db_v6, "engine", engine)
    update_db_v6.update_schema()
    update_db_v6.update_schema()  # Safe to rerun on a migrated database.
    with engine.connect() as connection:
        assert connection.execute(text("SELECT completo FROM paquetes WHERE id=1")).scalar_one() == 0
    engine.dispose()
