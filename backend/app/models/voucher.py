from sqlalchemy import Column, Integer, String, Date, DateTime, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.session import Base


class Voucher(Base):
    __tablename__ = "vouchers"

    id = Column(Integer, primary_key=True, index=True)
    reserva_id = Column(Integer, ForeignKey("reservas.id", ondelete="CASCADE"), unique=True, nullable=False)

    # ── Transporte ────────────────────────────────────────────────────────────
    incluye_transporte = Column(Boolean, default=True, nullable=False)
    transporte_numero = Column(String(50), nullable=True) # Ej: "33104"
    transporte_proveedor = Column(String(255), nullable=True) # Empresa de transporte ej: "A CONFIRMAR OK"
    transporte_direccion = Column(String(255), nullable=True)
    transporte_servicio = Column(String(100), nullable=True) # Ej: "Bus Semicama"
    transporte_tramo = Column(String(150), nullable=True) # Ej: "BUE/MDQ/BUE"
    transporte_coordinador = Column(String(255), nullable=True) # Nombre coordinador
    transporte_coordinador_telefono = Column(String(100), nullable=True) # Tel coordinador
    transporte_lugar_ascenso = Column(String(255), nullable=True)
    transporte_horario_salida = Column(String(100), nullable=True)
    transporte_fecha_salida = Column(Date, nullable=True)
    transporte_fecha_regreso = Column(Date, nullable=True)
    transporte_observaciones = Column(Text, nullable=True)

    # ── Hotelería ─────────────────────────────────────────────────────────────
    incluye_hoteleria = Column(Boolean, default=True, nullable=False)
    hoteleria_numero = Column(String(50), nullable=True) # Ej: "33042"
    hoteleria_hotel_nombre = Column(String(255), nullable=True)
    hoteleria_direccion = Column(String(255), nullable=True)
    hoteleria_telefono = Column(String(100), nullable=True)
    hoteleria_noches = Column(Integer, nullable=True)
    hoteleria_regimen = Column(String(100), nullable=True) # Ej: "Media Pensión"
    hoteleria_detalle_habitaciones = Column(String(255), nullable=True) # Ej: "HABITACION DOBLE MAT STANDARD"
    hoteleria_fecha_ingreso = Column(Date, nullable=True)
    hoteleria_fecha_egreso = Column(Date, nullable=True)
    hoteleria_observaciones = Column(Text, nullable=True)

    # ── General ───────────────────────────────────────────────────────────────
    pasajero_titular = Column(String(255), nullable=True) # Ej: "GRUPO OUTON" o "JUAN PEREZ"
    cant_pax_detalle = Column(String(100), nullable=True) # Ej: "30 ADL - 0 CHD - 0 INF"

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    reserva = relationship("Reserva", back_populates="voucher")
