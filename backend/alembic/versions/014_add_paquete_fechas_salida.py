"""Add package departures and preserve existing specific departures."""
from alembic import op
import sqlalchemy as sa

revision = "014"
down_revision = "013"
branch_labels = None
depends_on = None


def upgrade():
    # Some databases applied departures as 013 before the remote 013 was merged.
    # Reconcile that state without changing their Alembic version manually.
    if "completo" not in {c["name"] for c in sa.inspect(op.get_bind()).get_columns("paquetes")}:
        op.add_column("paquetes", sa.Column("completo", sa.Boolean(), nullable=False, server_default=sa.false()))
    # Startup seed may already have created the table through create_all.
    if not sa.inspect(op.get_bind()).has_table("paquete_fechas_salida"):
        op.create_table(
            "paquete_fechas_salida",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("paquete_id", sa.Integer(), sa.ForeignKey("paquetes.id", ondelete="CASCADE"), nullable=False),
            sa.Column("fecha_salida", sa.Date(), nullable=False),
            sa.Column("fecha_regreso", sa.Date(), nullable=True),
        )
        op.create_index("ix_paquete_fechas_salida_id", "paquete_fechas_salida", ["id"])
    op.execute(sa.text("""
        INSERT INTO paquete_fechas_salida (paquete_id, fecha_salida, fecha_regreso)
        SELECT id, fecha_salida, fecha_regreso FROM paquetes
        WHERE tipo_salidas = 'FECHA_ESPECIFICA' AND fecha_salida IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM paquete_fechas_salida WHERE paquete_id = paquetes.id)
    """))


def downgrade():
    op.drop_index("ix_paquete_fechas_salida_id", table_name="paquete_fechas_salida")
    op.drop_table("paquete_fechas_salida")
