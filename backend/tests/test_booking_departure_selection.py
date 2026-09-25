"""Run from backend: python -m unittest discover -s tests -v."""
import os
import unittest
from datetime import date

os.environ["DATABASE_URL"] = "sqlite:///:memory:"
os.environ["SECRET_KEY"] = "test-only-key"

from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.models import Base
from app.models.config import Categoria, Destino
from app.models.user import User
from app.models.booking import Reserva
from app.schemas.booking import ReservaCreate, ReservaFullUpdate
from app.schemas.package import PaqueteCreate
from app.crud.crud_booking import create_reserva, update_reserva_full
from app.crud.crud_package import create_paquete


class BookingDepartureSelectionTest(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine("sqlite:///:memory:")
        Base.metadata.create_all(self.engine)
        self.db = Session(self.engine)
        self.db.add_all([
            Destino(id=1, nombre="Destino"),
            Categoria(id=1, nombre="Categoria"),
            User(id=1, nombre="Vendedor", email="seller@example.com", password_hash="test"),
        ])
        self.db.commit()

    def tearDown(self):
        self.db.close()
        self.engine.dispose()

    def create_package(self, **kwargs):
        return create_paquete(self.db, PaqueteCreate(
            destino_id=1,
            categoria_id=1,
            titulo_subtitulo="Viaje",
            duracion_dias=4,
            duracion_noches=3,
            precio_base=100,
            **kwargs,
        ))

    def create_booking(self, package, fecha_salida=None, fecha_regreso=None):
        return create_reserva(
            self.db,
            ReservaCreate(
                paquete_id=package.id,
                precio_total=100,
                fecha_salida=fecha_salida,
                fecha_regreso=fecha_regreso,
            ),
            vendedor_id=1,
        )

    def test_creating_booking_persists_selected_departure_and_return(self):
        package = self.create_package(fechas_salida=[
            {"fecha_salida": "2027-01-05", "fecha_regreso": "2027-01-08"},
            {"fecha_salida": "2027-02-05", "fecha_regreso": "2027-02-08"},
        ])

        booking = self.create_booking(package, date(2027, 2, 5))

        self.assertEqual(booking.fecha_salida, date(2027, 2, 5))
        self.assertEqual(booking.fecha_regreso, date(2027, 2, 8))

    def test_fixed_departure_is_required_and_must_belong_to_package(self):
        package = self.create_package(fechas_salida=[{"fecha_salida": "2027-01-05"}])

        with self.assertRaises(HTTPException) as missing:
            self.create_booking(package)
        self.assertEqual(missing.exception.status_code, 422)

        with self.assertRaises(HTTPException) as invalid:
            self.create_booking(package, date(2027, 1, 6))
        self.assertEqual(invalid.exception.status_code, 422)
        self.assertEqual(self.db.query(Reserva).count(), 0)

    def test_edit_rejects_a_departure_not_configured_for_the_package(self):
        package = self.create_package(fechas_salida=[
            {"fecha_salida": "2027-01-05", "fecha_regreso": "2027-01-08"},
        ])
        booking = self.create_booking(package, date(2027, 1, 5))

        with self.assertRaises(HTTPException) as invalid:
            update_reserva_full(self.db, booking.id, ReservaFullUpdate(fecha_salida="2027-01-06"))

        self.assertEqual(invalid.exception.status_code, 422)

    def test_editing_to_another_configured_departure_updates_its_return_date(self):
        package = self.create_package(fechas_salida=[
            {"fecha_salida": "2027-01-05", "fecha_regreso": "2027-01-08"},
            {"fecha_salida": "2027-02-05", "fecha_regreso": "2027-02-09"},
        ])
        booking = self.create_booking(package, date(2027, 1, 5))

        updated = update_reserva_full(
            self.db,
            booking.id,
            ReservaFullUpdate(fecha_salida="2027-02-05", fecha_regreso="2027-02-09"),
        )

        self.assertEqual(updated.fecha_salida, date(2027, 2, 5))
        self.assertEqual(updated.fecha_regreso, date(2027, 2, 9))

    def test_daily_departures_keep_their_selectable_calendar_date(self):
        package = self.create_package(tipo_salidas="DIARIAS")

        booking = self.create_booking(package, date(2027, 1, 6))

        self.assertEqual(booking.fecha_salida, date(2027, 1, 6))


if __name__ == "__main__":
    unittest.main()
