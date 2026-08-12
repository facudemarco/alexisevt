from sqlalchemy import text, inspect
from app.db.session import engine, Base
import app.models # noqa: F401

def update_schema():
    inspector = inspect(engine)
    dialect = engine.dialect.name
    print(f"Dialecto de base de datos detectado: {dialect}")

    with engine.begin() as conn:
        # 1. Crear tablas que no existan (ej: vouchers)
        Base.metadata.create_all(bind=conn)
        print("Tablas verificadas / creadas con Base.metadata.create_all.")

        # 2. Verificar columnas en tabla 'reservas'
        reserva_cols = [c['name'] for c in inspect(conn).get_columns('reservas')]
        print(f"Columnas actuales en 'reservas': {reserva_cols}")

        new_cols = [
            ("fecha_regreso", "DATE"),
            ("duracion_dias", "INTEGER"),
            ("duracion_noches", "INTEGER"),
            ("es_bloqueo", "BOOLEAN DEFAULT FALSE"),
        ]

        for col_name, col_type in new_cols:
            if col_name not in reserva_cols:
                sql = f"ALTER TABLE reservas ADD COLUMN {col_name} {col_type}"
                try:
                    conn.execute(text(sql))
                    print(f"Columna '{col_name}' añadida a 'reservas'.")
                except Exception as e:
                    print(f"Aviso al añadir '{col_name}': {e}")
            else:
                print(f"Columna '{col_name}' ya existe en 'reservas'.")

if __name__ == "__main__":
    update_schema()
