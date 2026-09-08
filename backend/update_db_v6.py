"""Idempotent migration for deployments maintained with update_db scripts."""
from sqlalchemy import inspect, text
from app.db.session import engine


def update_schema():
    with engine.begin() as connection:
        columns = {column["name"] for column in inspect(connection).get_columns("paquetes")}
        if "completo" not in columns:
            connection.execute(text("ALTER TABLE paquetes ADD COLUMN completo BOOLEAN NOT NULL DEFAULT 0"))
            print("Columna paquetes.completo creada; los paquetes existentes siguen disponibles.")
        else:
            print("La columna paquetes.completo ya existe.")


if __name__ == "__main__":
    update_schema()
