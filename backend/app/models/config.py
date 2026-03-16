from sqlalchemy import Column, Integer, String
from app.db.session import Base

class Destino(Base):
    __tablename__ = "destinos"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(255), unique=True, nullable=False)

class Categoria(Base):
    __tablename__ = "categorias"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(255), unique=True, nullable=False)

class Hotel(Base):
    __tablename__ = "hoteles"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(255), nullable=False)

class Transporte(Base):
    __tablename__ = "transportes"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(255), nullable=False)

class Servicio(Base):
    __tablename__ = "servicios"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(255), nullable=False)

class PuntoAscenso(Base):
    __tablename__ = "puntos_ascenso"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(255), nullable=False)
