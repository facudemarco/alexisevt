<<<<<<< HEAD
from sqlalchemy import Column, Integer, String, Float, Date, Boolean, ForeignKey, Table, SmallInteger, DECIMAL, JSON, Time
from sqlalchemy.orm import relationship
from app.db.session import Base

# Relationship Tables for M2M mappings
paquete_hotel_table = Table(
    "paquetes_hoteles", Base.metadata,
    Column("paquete_id", Integer, ForeignKey("paquetes.id", ondelete="CASCADE"), primary_key=True),
    Column("hotel_id", Integer, ForeignKey("hoteles.id", ondelete="CASCADE"), primary_key=True)
)
=======
from sqlalchemy import Column, Integer, String, Float, Date, Boolean, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.db.session import Base

# M2M simples (sin atributos extra en la junction)
from sqlalchemy import Table
>>>>>>> 2ceb188 (Add cards)

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
    "paquetes_puntoascenso", Base.metadata,
    Column("paquete_id", Integer, ForeignKey("paquetes.id", ondelete="CASCADE"), primary_key=True),
    Column("punto_id", Integer, ForeignKey("puntos_ascenso.id", ondelete="CASCADE"), primary_key=True)
)


class PaqueteHotel(Base):
    """Junction table paquete↔hotel con atributos extra (régimen, noches)."""
    __tablename__ = "paquete_hotel"

    paquete_id = Column(Integer, ForeignKey("paquetes.id", ondelete="CASCADE"), primary_key=True)
    hotel_id = Column(Integer, ForeignKey("hoteles.id", ondelete="CASCADE"), primary_key=True)
    regimen = Column(String(100), nullable=True)       # "Media pensión", "Todo incluido", etc.
    cantidad_noches = Column(Integer, nullable=True)

    hotel = relationship("Hotel")


class Paquete(Base):
    __tablename__ = "paquetes"

    id = Column(Integer, primary_key=True, index=True)
    destino_id = Column(Integer, ForeignKey("destinos.id"))
    categoria_id = Column(Integer, ForeignKey("categorias.id"))

    titulo_subtitulo = Column(String(255), nullable=False)
    fecha_salida = Column(Date, nullable=True)   # nullable para salidas diarias
    fecha_regreso = Column(Date, nullable=True)
    duracion_dias = Column(Integer, nullable=False)
    duracion_noches = Column(Integer, nullable=False)
<<<<<<< HEAD
    precio_base = Column(DECIMAL(10, 2), nullable=False)
    estado = Column(Boolean, default=True)  # Activo / Inactivo

    # New columns
    imagen_url = Column(String(500), nullable=True)
    regimen = Column(String(100), nullable=True)
    gastos_reserva = Column(DECIMAL(10, 2), default=0)
    salidas_diarias = Column(Boolean, default=False)
    # Additional fields for detailed package info
    periodo = Column(String(100), nullable=True)
    moneda = Column(String(10), nullable=True, default='ARS')
    adicionales_json = Column(JSON, nullable=True)
    transporte_incluido = Column(Boolean, default=False)
    transporte_empresa = Column(String(150), nullable=True)
    transporte_tipo = Column(String(100), nullable=True)
    horario_salida = Column(Time, nullable=True)
    horario_regreso = Column(Time, nullable=True)
    alojamiento_incluido = Column(Boolean, default=True)
    alojamiento_noches = Column(Integer, nullable=True)
    created_at = Column(Date, nullable=True)
    deleted_at = Column(Date, nullable=True)

=======

    precio_base = Column(Float, nullable=False)
    precio_adicional = Column(Float, default=0)         # gastos de reserva
    moneda = Column(String(10), default="ARS")

    tipo_salidas = Column(String(20), default="FECHA_ESPECIFICA")  # DIARIAS | FECHA_ESPECIFICA

    imagen_url = Column(String(500), nullable=True)     # imagen principal del paquete

    adicionales = Column(JSON, nullable=True)           # lista de strings con ítems adicionales
    sobre_el_destino = Column(Text, nullable=True)      # descripción del destino

    include_transfer = Column(Boolean, default=True)
    include_asistencia_medica = Column(Boolean, default=True)
    es_borrador = Column(Boolean, default=False)

    estado = Column(Boolean, default=True)              # Activo / Inactivo
>>>>>>> 2ceb188 (Add cards)

    # Relationships
    destino = relationship("Destino")
    categoria = relationship("Categoria")
    hotel_detalles = relationship("PaqueteHotel", cascade="all, delete-orphan")
    transportes = relationship("Transporte", secondary=paquete_transporte_table)
    servicios = relationship("Servicio", secondary=paquete_servicio_table)
    puntos_ascenso = relationship("PuntoAscenso", secondary=paquete_punto_ascenso_table)

    reservas = relationship("Reserva", back_populates="paquete")

