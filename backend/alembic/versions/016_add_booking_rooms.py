"""Add rooms and optional passenger assignments."""
from alembic import op
import sqlalchemy as sa

revision = "016"
down_revision = "015"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "habitaciones_reserva",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("reserva_id", sa.Integer(), sa.ForeignKey("reservas.id", ondelete="CASCADE"), nullable=False),
        sa.Column("identificacion", sa.String(255), nullable=False),
        sa.Column("tipo", sa.String(100), nullable=False),
        sa.Column("capacidad", sa.Integer(), nullable=False),
        sa.Column("observaciones", sa.Text(), nullable=True),
    )
    op.create_index("ix_habitaciones_reserva_reserva_id", "habitaciones_reserva", ["reserva_id"])
    with op.batch_alter_table("pasajeros") as batch:
        batch.add_column(sa.Column("habitacion_id", sa.Integer(), nullable=True))
        batch.create_index("ix_pasajeros_habitacion_id", ["habitacion_id"])
        batch.create_foreign_key("fk_pasajeros_habitacion_id", "habitaciones_reserva", ["habitacion_id"], ["id"], ondelete="SET NULL")


def downgrade():
    with op.batch_alter_table("pasajeros") as batch:
        batch.drop_constraint("fk_pasajeros_habitacion_id", type_="foreignkey")
        batch.drop_index("ix_pasajeros_habitacion_id")
        batch.drop_column("habitacion_id")
    op.drop_index("ix_habitaciones_reserva_reserva_id", table_name="habitaciones_reserva")
    op.drop_table("habitaciones_reserva")
