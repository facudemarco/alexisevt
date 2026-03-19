"""add package fields

Revision ID: 001
Revises:
Create Date: 2026-03-18

Agrega campos necesarios para la página de detalle de paquete y el CRUD admin:
- paquetes: imagen_url, moneda, precio_adicional, tipo_salidas, adicionales (JSON),
            sobre_el_destino, include_transfer, include_asistencia_medica, es_borrador
            + fecha_salida / fecha_regreso ahora nullable
- hoteles: direccion, descripcion, imagenes (JSON)
- transportes: tipo, horario_salida_desde, horario_salida_hasta, horario_regreso
- paquete_hotel: regimen, cantidad_noches
"""
from alembic import op
import sqlalchemy as sa

revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── paquetes ──────────────────────────────────────────────────────────────
    op.add_column("paquetes", sa.Column("imagen_url", sa.String(500), nullable=True))
    op.add_column("paquetes", sa.Column("moneda", sa.String(10), server_default="ARS", nullable=True))
    op.add_column("paquetes", sa.Column("precio_adicional", sa.Float(), server_default="0", nullable=True))
    op.add_column("paquetes", sa.Column("tipo_salidas", sa.String(20), server_default="FECHA_ESPECIFICA", nullable=True))
    op.add_column("paquetes", sa.Column("adicionales", sa.JSON(), nullable=True))
    op.add_column("paquetes", sa.Column("sobre_el_destino", sa.Text(), nullable=True))
    op.add_column("paquetes", sa.Column("include_transfer", sa.Boolean(), server_default="1", nullable=True))
    op.add_column("paquetes", sa.Column("include_asistencia_medica", sa.Boolean(), server_default="1", nullable=True))
    op.add_column("paquetes", sa.Column("es_borrador", sa.Boolean(), server_default="0", nullable=True))
    # fecha_salida y fecha_regreso ahora son nullable (para paquetes de salidas diarias)
    op.alter_column("paquetes", "fecha_salida", nullable=True)
    op.alter_column("paquetes", "fecha_regreso", nullable=True)

    # ── hoteles ───────────────────────────────────────────────────────────────
    op.add_column("hoteles", sa.Column("direccion", sa.String(500), nullable=True))
    op.add_column("hoteles", sa.Column("descripcion", sa.Text(), nullable=True))
    op.add_column("hoteles", sa.Column("imagenes", sa.JSON(), nullable=True))

    # ── transportes ───────────────────────────────────────────────────────────
    op.add_column("transportes", sa.Column("tipo", sa.String(100), nullable=True))
    op.add_column("transportes", sa.Column("horario_salida_desde", sa.String(10), nullable=True))
    op.add_column("transportes", sa.Column("horario_salida_hasta", sa.String(10), nullable=True))
    op.add_column("transportes", sa.Column("horario_regreso", sa.String(10), nullable=True))

    # ── paquete_hotel (junction) ──────────────────────────────────────────────
    op.add_column("paquete_hotel", sa.Column("regimen", sa.String(100), nullable=True))
    op.add_column("paquete_hotel", sa.Column("cantidad_noches", sa.Integer(), nullable=True))


def downgrade() -> None:
    op.drop_column("paquete_hotel", "cantidad_noches")
    op.drop_column("paquete_hotel", "regimen")

    op.drop_column("transportes", "horario_regreso")
    op.drop_column("transportes", "horario_salida_hasta")
    op.drop_column("transportes", "horario_salida_desde")
    op.drop_column("transportes", "tipo")

    op.drop_column("hoteles", "imagenes")
    op.drop_column("hoteles", "descripcion")
    op.drop_column("hoteles", "direccion")

    op.drop_column("paquetes", "es_borrador")
    op.drop_column("paquetes", "include_asistencia_medica")
    op.drop_column("paquetes", "include_transfer")
    op.drop_column("paquetes", "sobre_el_destino")
    op.drop_column("paquetes", "adicionales")
    op.drop_column("paquetes", "tipo_salidas")
    op.drop_column("paquetes", "precio_adicional")
    op.drop_column("paquetes", "moneda")
    op.drop_column("paquetes", "imagen_url")
