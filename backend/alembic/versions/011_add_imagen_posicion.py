"""add imagen_posicion to paquetes

Revision ID: 011
Revises: 010
Create Date: 2026-04-09
"""
from alembic import op
import sqlalchemy as sa

revision = '011'
down_revision = '010'
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    insp = sa.inspect(bind)
    cols = [c["name"] for c in insp.get_columns("paquetes")]
    if "imagen_posicion" not in cols:
        op.add_column("paquetes", sa.Column("imagen_posicion", sa.String(50), nullable=True, server_default="center"))


def downgrade():
    op.drop_column("paquetes", "imagen_posicion")
