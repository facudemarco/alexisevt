from sqlalchemy import Column, Integer, String, Date
from app.db.session import Base

class BoardItem(Base):
    __tablename__ = "cartelera"

    id = Column(Integer, primary_key=True, index=True)
    titulo = Column(String(255), nullable=False)
    imagen_url = Column(String(500), nullable=False)
    fecha_expiracion = Column(Date, nullable=False)
