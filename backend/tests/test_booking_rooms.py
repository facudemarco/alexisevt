"""End-to-end booking-room behavior using an isolated SQLite database."""
import os
import sys
import importlib.util
from pathlib import Path

os.environ["DATABASE_URL"] = "sqlite://"
os.environ["SECRET_KEY"] = "rooms-test-only"
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy import text, inspect
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from alembic.migration import MigrationContext
from alembic.operations import Operations

from app.api.routers import bookings, packages, vouchers, liquidaciones
from app.api.deps import get_db
from app.api.deps_security import get_current_admin_user, get_current_user
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
    for router, prefix in [(bookings.router, "/bookings"), (packages.router, "/packages"),
                           (vouchers.router, "/vouchers"), (liquidaciones.router, "/liquidaciones")]:
        app.include_router(router, prefix=prefix)

    def database():
        with sessions() as db:
            try:
                yield db
            except Exception:
                db.rollback()
                raise

    user = User(id=1, nombre="Admin", rol=UserRole.ADMIN)
    app.dependency_overrides[get_db] = database
    app.dependency_overrides[get_current_admin_user] = lambda: user
    app.dependency_overrides[get_current_user] = lambda: user
    with TestClient(app) as client:
        yield client, sessions
    engine.dispose()


def group(package_id=None):
    return {"paquete_id": package_id, "cliente_nombre": "Grupo", "precio_total": 600,
            "pasajeros_adultos": 6,
            "habitaciones": [{"clave": f"r{i}", "identificacion": f"Hab {i}", "tipo": "Doble", "capacidad": 2} for i in range(3)],
            "pasajeros": [{"nombre": f"Nombre{i}", "apellido": "Apellido", "dni": str(i + 100), "habitacion_clave": f"r{i // 2}"} for i in range(6)]}


@pytest.mark.parametrize("manual", [True, False])
def test_six_people_three_rooms_edit_reassign_and_price(api, manual):
    client, _ = api
    package_id = None
    if not manual:
        package = client.post("/packages/", json={"destino_id": 1, "categoria_id": 1, "titulo_subtitulo": "Viaje", "duracion_dias": 2, "duracion_noches": 1, "precio_base": 100})
        assert package.status_code == 200, package.text
        package_id = package.json()["id"]
    response = client.post("/bookings/", json=group(package_id))
    assert response.status_code == 200, response.text
    booking = response.json()
    assert booking["precio_total"] == 600
    assert sorted(sum(p["habitacion_id"] == r["id"] for p in booking["pasajeros"]) for r in booking["habitaciones"]) == [2, 2, 2]
    passengers = booking["pasajeros"]
    before_ids = [p["id"] for p in passengers]
    passengers[0]["habitacion_id"], passengers[2]["habitacion_id"] = passengers[2]["habitacion_id"], passengers[0]["habitacion_id"]
    updated = client.put(f"/bookings/{booking['id']}", json={"pasajeros": passengers})
    assert updated.status_code == 200, updated.text
    assert [p["id"] for p in updated.json()["pasajeros"]] == before_ids
    assert updated.json()["precio_total"] == 600
    liq = client.post("/liquidaciones/", json={"reserva_id": booking["id"], "fecha": "2027-01-01", "items": [{"descripcion": "Total", "precio": 600, "cant_pax": 1}]})
    assert liq.status_code == 201, liq.text
    assert float(liq.json()["subtotal"]) == 600


def test_invalid_assignment_duplicate_and_capacity_are_atomic(api):
    client, sessions = api
    booking = client.post("/bookings/", json=group()).json()
    other = client.post("/bookings/", json=group()).json()
    people = booking["pasajeros"]
    people[0]["habitacion_id"] = other["habitaciones"][0]["id"]
    assert client.put(f"/bookings/{booking['id']}", json={"precio_total": 999, "pasajeros": people}).status_code == 422
    assert client.get(f"/bookings/{booking['id']}").json()["precio_total"] == 600
    people = booking["pasajeros"]
    people[0]["habitacion_id"] = people[2]["habitacion_id"]
    assert client.put(f"/bookings/{booking['id']}", json={"pasajeros": people}).status_code == 422
    assert client.put(f"/bookings/{booking['id']}", json={"pasajeros": [people[0], people[0]]}).status_code == 422
    bad = group()
    bad["pasajeros"][1]["dni"] = bad["pasajeros"][0]["dni"]
    assert client.post("/bookings/", json=bad).status_code == 422
    with sessions() as db:
        assert db.query(Reserva).count() == 2
    current = client.get(f"/bookings/{booking['id']}").json()
    assert len(current["pasajeros"]) == 6
    assert client.put(f"/bookings/{booking['id']}", json={"habitaciones": current["habitaciones"][1:]}).status_code == 422


def test_edit_room_snapshot_with_keys_and_explicit_unassignment(api):
    client, _ = api
    booking = client.post("/bookings/", json=group()).json()
    rooms = [{**room, "clave": f"room-{room['id']}"} for room in booking["habitaciones"]]
    people = [{**person, "habitacion_clave": f"room-{person['habitacion_id']}"} for person in booking["pasajeros"]]
    for person in people:
        person.pop("habitacion_id")
    people[0]["habitacion_clave"] = ""
    people[0]["habitacion_id"] = None
    removed = rooms.pop(0)
    for person in people:
        if person.get("habitacion_clave") == removed["clave"]:
            person["habitacion_clave"] = ""
            person["habitacion_id"] = None
    response = client.put(f"/bookings/{booking['id']}", json={"habitaciones": rooms, "pasajeros": people})
    assert response.status_code == 200, response.text
    result = response.json()
    assert len(result["habitaciones"]) == 2
    assert len([p for p in result["pasajeros"] if p["habitacion_id"] is None]) == 2
    assert {p["id"] for p in result["pasajeros"]} == {p["id"] for p in booking["pasajeros"]}


def test_block_legacy_and_voucher_preservation(api):
    client, _ = api
    body = group()
    body.update(es_bloqueo=True, pasajeros=[])
    response = client.post("/bookings/", json=body)
    assert response.status_code == 200, response.text
    assert len(response.json()["habitaciones"]) == 3
    legacy = client.post("/bookings/", json={"precio_total": 125, "pasajeros": [{"nombre": "Ana", "apellido": "A", "dni": "1"}]}).json()
    assert legacy["habitaciones"] == [] and legacy["pasajeros"][0]["habitacion_id"] is None
    pax_id = legacy["pasajeros"][0]["id"]
    edit = client.put(f"/bookings/{legacy['id']}", json={"pasajeros": [{"nombre": "Ana", "apellido": "B", "dni": "1"}]})
    assert edit.json()["pasajeros"][0]["id"] == pax_id
    voucher = client.get(f"/vouchers/by-reserva/{legacy['id']}").json()
    changed = client.put(f"/vouchers/{voucher['id']}", json={"hoteleria_hotel_nombre": "A CONFIRMAR", "hoteleria_detalle_habitaciones": "Texto manual"})
    assert changed.status_code == 200
    client.put(f"/bookings/{legacy['id']}", json={"hotel_manual": "Hotel nuevo"})
    again = client.get(f"/vouchers/by-reserva/{legacy['id']}").json()
    assert again["hoteleria_hotel_nombre"] == "A CONFIRMAR" and again["hoteleria_detalle_habitaciones"] == "Texto manual"
    assert client.post(f"/vouchers/by-reserva/{legacy['id']}/reset").status_code == 422
    regenerated = client.post(f"/vouchers/by-reserva/{legacy['id']}/reset", json={"confirmar": True})
    assert regenerated.status_code == 200 and regenerated.json()["id"] == voucher["id"]


def test_migration_preserves_existing_passengers_and_downgrades():
    engine = create_engine("sqlite://")
    path = Path(__file__).resolve().parents[1] / "alembic/versions/016_add_booking_rooms.py"
    spec = importlib.util.spec_from_file_location("migration_016", path)
    migration = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(migration)
    assert migration.down_revision == "015"
    with engine.begin() as connection:
        connection.execute(text("CREATE TABLE reservas (id INTEGER PRIMARY KEY)"))
        connection.execute(text("CREATE TABLE pasajeros (id INTEGER PRIMARY KEY, reserva_id INTEGER, nombre VARCHAR(255) NOT NULL, FOREIGN KEY(reserva_id) REFERENCES reservas(id))"))
        connection.execute(text("INSERT INTO reservas (id) VALUES (1)"))
        connection.execute(text("INSERT INTO pasajeros (id, reserva_id, nombre) VALUES (1, 1, 'Ana')"))
        with Operations.context(MigrationContext.configure(connection)):
            migration.upgrade()
            row = connection.execute(text("SELECT id, nombre, habitacion_id FROM pasajeros")).one()
            assert tuple(row) == (1, "Ana", None)
            assert "habitaciones_reserva" in inspect(connection).get_table_names()
            migration.downgrade()
            assert connection.execute(text("SELECT nombre FROM pasajeros WHERE id=1")).scalar() == "Ana"
            assert "habitacion_id" not in {c["name"] for c in inspect(connection).get_columns("pasajeros")}
    engine.dispose()
