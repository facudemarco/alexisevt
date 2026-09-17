"""Run from backend: python -m unittest discover -s tests -v."""
import importlib.util
import os
from datetime import date
from pathlib import Path
import unittest

os.environ["DATABASE_URL"] = "sqlite:///:memory:"
os.environ["SECRET_KEY"] = "test-only-key"

from alembic.migration import MigrationContext
from alembic.operations import Operations
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session
from pydantic import ValidationError
from app.models import Base
from app.models.config import Categoria, Destino
from app.models.package import PaqueteFechaSalida
from app.crud.crud_package import create_paquete, update_paquete, get_paquete, delete_paquete
from app.schemas.package import PaqueteCreate, PaqueteUpdate, PaqueteFechaSalidaCreate, Paquete


class PackageFeaturesTest(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine("sqlite:///:memory:")
        Base.metadata.create_all(self.engine)
        self.db = Session(self.engine)
        self.db.add_all([Destino(id=1, nombre="Destino"), Categoria(id=1, nombre="Categoria")])
        self.db.commit()

    def tearDown(self):
        self.db.close()
        self.engine.dispose()

    def create(self, **kwargs):
        return create_paquete(self.db, PaqueteCreate(
            destino_id=1, categoria_id=1, titulo_subtitulo="Viaje",
            duracion_dias=3, duracion_noches=2, precio_base=100, **kwargs,
        ))

    def test_departures_roundtrip_replace_clear_and_cascade(self):
        package = self.create(fechas_salida=[
            {"fecha_salida": "2027-01-14"},
            {"fecha_salida": "2027-01-03", "fecha_regreso": "2027-01-06"},
            {"fecha_salida": "2027-01-07"},
        ])
        package_id = package.id
        self.db.expire_all()
        result = Paquete.model_validate(get_paquete(self.db, package_id))
        self.assertEqual(len(result.fechas_salida), 3)
        self.assertEqual(result.fecha_salida, date(2027, 1, 3))
        self.assertEqual(result.fecha_regreso, date(2027, 1, 6))
        update_paquete(self.db, package_id, PaqueteUpdate(titulo_subtitulo="Nuevo"))
        self.assertEqual(self.db.query(PaqueteFechaSalida).count(), 3)
        update_paquete(self.db, package_id, PaqueteUpdate(fechas_salida=[{"fecha_salida": "2027-02-01"}]))
        self.assertEqual(self.db.query(PaqueteFechaSalida).count(), 1)
        update_paquete(self.db, package_id, PaqueteUpdate(fechas_salida=[]))
        self.assertIsNone(get_paquete(self.db, package_id).fecha_salida)
        self.assertEqual(self.db.query(PaqueteFechaSalida).count(), 0)
        update_paquete(self.db, package_id, PaqueteUpdate(fechas_salida=[{"fecha_salida": "2027-02-01"}]))
        delete_paquete(self.db, package_id)
        self.assertEqual(self.db.query(PaqueteFechaSalida).count(), 0)

    def test_legacy_and_daily_packages(self):
        package = self.create(fecha_salida="2027-01-03")
        self.assertEqual(package.fecha_salida, date(2027, 1, 3))
        update_paquete(self.db, package.id, PaqueteUpdate(
            tipo_salidas="DIARIAS", fechas_salida=[{"fecha_salida": "2027-02-01"}],
        ))
        self.assertIsNone(package.fecha_salida)
        self.assertEqual(package.fechas_salida, [])

    def test_additional_commission_flags_persist(self):
        entries = [{"nombre": "Bus cama", "valor": "20", "aplica_comision": True},
                   {"nombre": "Gastos", "valor": "10", "aplica_comision": False}]
        package = self.create(precio_adicional=30, adicionales_json={"adicionales_precio": entries})
        self.db.expire_all()
        self.assertEqual(get_paquete(self.db, package.id).adicionales_json["adicionales_precio"], entries)
        update_paquete(self.db, package.id, PaqueteUpdate(adicionales_json={"adicionales_precio": entries[1:]}, precio_adicional=10))
        self.db.expire_all()
        self.assertFalse(get_paquete(self.db, package.id).adicionales_json["adicionales_precio"][0]["aplica_comision"])

    def test_return_before_departure_rejected(self):
        with self.assertRaises(ValidationError):
            PaqueteFechaSalidaCreate(fecha_salida="2027-01-05", fecha_regreso="2027-01-04")

    def test_migration_backfills_without_duplicates(self):
        self.create(fecha_salida="2027-01-03")
        module_path = Path(__file__).parents[1] / "alembic/versions/013_add_paquete_fechas_salida.py"
        spec = importlib.util.spec_from_file_location("migration_013", module_path)
        migration = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(migration)
        with self.engine.begin() as connection:
            connection.execute(text("DROP TABLE paquete_fechas_salida"))
            with Operations.context(MigrationContext.configure(connection)):
                migration.upgrade()
                migration.upgrade()
                self.assertEqual(connection.execute(text("SELECT COUNT(*) FROM paquete_fechas_salida")).scalar(), 1)
                migration.downgrade()


if __name__ == "__main__":
    unittest.main()
