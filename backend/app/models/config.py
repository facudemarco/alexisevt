from sqlalchemy import Column, Integer, String, Text, JSON, Boolean
from app.db.session import Base

class Destino(Base):
    __tablename__ = "destinos"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(255), nullable=False)
    sigla = Column(String(20), nullable=True)
    descripcion = Column(Text, nullable=True)
    es_combinado = Column(Boolean, default=False, nullable=False)
    destino_ids = Column(JSON, nullable=True)  # IDs de destinos simples que lo componen

class Categoria(Base):
    __tablename__ = "categorias"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(255), unique=True, nullable=False)
    slug = Column(String(100), unique=True, nullable=True)
    imagen_url = Column(String(500), nullable=True)

class Hotel(Base):
    __tablename__ = "hoteles"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(255), nullable=False)
    telefono = Column(String(50), nullable=True)
    destino_id = Column(Integer, nullable=True)
    direccion = Column(String(500), nullable=True)
    descripcion = Column(Text, nullable=True)
    imagenes = Column(JSON, nullable=True)  # lista de URLs de imágenes

class Transporte(Base):
    __tablename__ = "transportes"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(255), nullable=False)  # nombre de la empresa
    razon_social = Column(String(255), nullable=True)  # Ej: DINAMAR SERVICIOS TURISTICOS S.R.L.
    tipo = Column(String(100), nullable=True)  # "Bus Semicama", "Bus Cama", "Aéreo"
    horario_salida_desde = Column(String(10), nullable=True)  # "00:00"
    horario_salida_hasta = Column(String(10), nullable=True)  # "04:30"
    horario_regreso = Column(String(10), nullable=True)  # "10:00"

class Servicio(Base):
    __tablename__ = "servicios"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(255), nullable=False)

class PuntoAscenso(Base):
    __tablename__ = "puntos_ascenso"
    id = Column(Integer, primary_key=True, index=True)
    nombre_lugar = Column(String(150), nullable=False)
    direccion_maps = Column(String(255), nullable=False, default="")
    horario_default = Column(String(50), nullable=False, default="00:00")


class Aerolinea(Base):
    __tablename__ = "aerolineas"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(255), nullable=False)


class SiteConfig(Base):
    __tablename__ = "site_config"
    id = Column(Integer, primary_key=True, index=True)
    clave = Column(String(100), unique=True, index=True, nullable=False)
    valor = Column(Text, nullable=True)


