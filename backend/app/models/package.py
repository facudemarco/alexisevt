from sqlalchemy import Column, Integer, String, Float, Date, Boolean, ForeignKey, Table
from sqlalchemy.orm import relationship
from app.db.session import Base

# Relationship Tables for M2M mappings
paquete_hotel_table = Table(
    "paquete_hotel", Base.metadata,
    Column("paquete_id", Integer, ForeignKey("paquetes.id", ondelete="CASCADE"), primary_key=True),
    Column("hotel_id", Integer, ForeignKey("hoteles.id", ondelete="CASCADE"), primary_key=True)
)

paquete_transporte_table = Table(
    "paquete_transporte", Base.metadata,
    Column("paquete_id", Integer, ForeignKey("paquetes.id", ondelete="CASCADE"), primary_key=True),
    Column("transporte_id", Integer, ForeignKey("transportes.id", ondelete="CASCADE"), primary_key=True)
)

paquete_servicio_table = Table(
    "paquete_servicio", Base.metadata,
    Column("paquete_id", Integer, ForeignKey("paquetes.id", ondelete="CASCADE"), primary_key=True),
    Column("servicio_id", Integer, ForeignKey("servicios.id", ondelete="CASCADE"), primary_key=True)
)

paquete_punto_ascenso_table = Table(
    "paquete_punto_ascenso", Base.metadata,
    Column("paquete_id", Integer, ForeignKey("paquetes.id", ondelete="CASCADE"), primary_key=True),
    Column("punto_ascenso_id", Integer, ForeignKey("puntos_ascenso.id", ondelete="CASCADE"), primary_key=True)
)

class Paquete(Base):
    __tablename__ = "paquetes"

    id = Column(Integer, primary_key=True, index=True)
    destino_id = Column(Integer, ForeignKey("destinos.id"))
    categoria_id = Column(Integer, ForeignKey("categorias.id"))
    
    titulo_subtitulo = Column(String(255), nullable=False)
    fecha_salida = Column(Date, nullable=False)
    fecha_regreso = Column(Date, nullable=False)
    duracion_dias = Column(Integer, nullable=False)
    duracion_noches = Column(Integer, nullable=False)
    precio_base = Column(Float, nullable=False)
    estado = Column(Boolean, default=True) # Activo / Inactivo

    # Relationships
    destino = relationship("Destino")
    categoria = relationship("Categoria")
    hoteles = relationship("Hotel", secondary=paquete_hotel_table)
    transportes = relationship("Transporte", secondary=paquete_transporte_table)
    servicios = relationship("Servicio", secondary=paquete_servicio_table)
    puntos_ascenso = relationship("PuntoAscenso", secondary=paquete_punto_ascenso_table)
    
    reservas = relationship("Reserva", back_populates="paquete")
