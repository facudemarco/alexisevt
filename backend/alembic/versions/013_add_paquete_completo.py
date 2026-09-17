"""Add the package reservation closure flag.

Revision ID: 013
Revises: 012
"""
from alembic import op
import sqlalchemy as sa

revision = "013"
down_revision = "012"
branch_labels = None
depends_on = None


def upgrade():
    if "completo" not in {c["name"] for c in sa.inspect(op.get_bind()).get_columns("paquetes")}:
        op.add_column("paquetes", sa.Column("completo", sa.Boolean(), nullable=False, server_default=sa.false()))


def downgrade():
    op.drop_column("paquetes", "completo")
