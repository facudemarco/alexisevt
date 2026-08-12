from sqlalchemy import Column, Integer, String, Float, DateTime, Date, Enum, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.session import Base
import enum

class ReservaStatus(str, enum.Enum):
    PENDIENTE = "Pendiente"
    APROBADA = "Aprobada"
    RECHAZADA = "Rechazada"


class Pasajero(Base):
    __tablename__ = "pasajeros"

    id = Column(Integer, primary_key=True, index=True)
    reserva_id = Column(Integer, ForeignKey("reservas.id", ondelete="CASCADE"))
    nombre = Column(String(255), nullable=False)
    apellido = Column(String(255), nullable=False)
    dni = Column(String(20), nullable=True)
    fecha_nacimiento = Column(Date, nullable=True)
    telefono = Column(String(50), nullable=True)
    punto_ascenso_id = Column(Integer, ForeignKey("puntos_ascenso.id"), nullable=True)

    reserva = relationship("Reserva", back_populates="pasajeros")
    punto_ascenso = relationship("PuntoAscenso")


class Reserva(Base):
    __tablename__ = "reservas"

    id = Column(Integer, primary_key=True, index=True)
    vendedor_id = Column(Integer, ForeignKey("users.id"))
    paquete_id = Column(Integer, ForeignKey("paquetes.id"))

    # Datos del cliente (quien reserva)
    cliente_nombre = Column(String(255), nullable=True)
    cliente_email = Column(String(255), nullable=True)
    cliente_telefono = Column(String(50), nullable=True)

    pasajeros_adultos = Column(Integer, default=1)
    pasajeros_menores = Column(Integer, default=0)

    estado_reserva = Column(
        Enum(ReservaStatus, values_callable=lambda obj: [e.value for e in obj]),
        default=ReservaStatus.PENDIENTE,
    )
    motivo_rechazo = Column(Text, nullable=True)
    precio_total = Column(Float, nullable=False)
    fecha_salida = Column(Date, nullable=True) # Para salidas diarias o específicas
    fecha_regreso = Column(Date, nullable=True)
    duracion_dias = Column(Integer, nullable=True)
    duracion_noches = Column(Integer, nullable=True)
    es_bloqueo = Column(Boolean, default=False)
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now())

    hotel_id = Column(Integer, ForeignKey("hoteles.id"), nullable=True)

    # Relationships
    vendedor = relationship("User")
    paquete = relationship("Paquete", back_populates="reservas")
    hotel = relationship("Hotel")
    pasajeros = relationship("Pasajero", back_populates="reserva", cascade="all, delete-orphan")
    liquidacion = relationship("Liquidacion", back_populates="reserva", uselist=False)
    voucher = relationship("Voucher", back_populates="reserva", uselist=False, cascade="all, delete-orphan")
