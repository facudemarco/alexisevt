from sqlalchemy import Column, Integer, String, Float, DateTime, Enum, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.session import Base
import enum

class ReservaStatus(str, enum.Enum):
    PENDIENTE = "Pendiente"
    APROBADA = "Aprobada"
    RECHAZADA = "Rechazada"

class Reserva(Base):
    __tablename__ = "reservas"

    id = Column(Integer, primary_key=True, index=True)
    vendedor_id = Column(Integer, ForeignKey("users.id"))
    paquete_id = Column(Integer, ForeignKey("paquetes.id"))
    
    pasajeros_adultos = Column(Integer, default=1)
    pasajeros_menores = Column(Integer, default=0)
    
    estado_reserva = Column(Enum(ReservaStatus), default=ReservaStatus.PENDIENTE)
    precio_total = Column(Float, nullable=False)
    
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    vendedor = relationship("User")
    paquete = relationship("Paquete", back_populates="reservas")
