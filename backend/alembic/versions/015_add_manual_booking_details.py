"""Store optional trip details directly on standalone bookings."""
from alembic import op
import sqlalchemy as sa

revision = "015"
down_revision = "014"
branch_labels = None
depends_on = None


def upgrade():
    columns = {column["name"] for column in sa.inspect(op.get_bind()).get_columns("reservas")}
    additions = [
        sa.Column("titulo_viaje", sa.String(length=255), nullable=True),
        sa.Column("destino_manual", sa.String(length=255), nullable=True),
        sa.Column("hotel_manual", sa.String(length=255), nullable=True),
        sa.Column("regimen_manual", sa.String(length=100), nullable=True),
        sa.Column("transporte_manual", sa.String(length=255), nullable=True),
        sa.Column("moneda", sa.String(length=10), nullable=True, server_default="ARS"),
        sa.Column("notas_viaje", sa.Text(), nullable=True),
    ]
    for column in additions:
        if column.name not in columns:
            op.add_column("reservas", column)


def downgrade():
    columns = {column["name"] for column in sa.inspect(op.get_bind()).get_columns("reservas")}
    for name in ("notas_viaje", "moneda", "transporte_manual", "regimen_manual", "hotel_manual", "destino_manual", "titulo_viaje"):
        if name in columns:
            op.drop_column("reservas", name)
