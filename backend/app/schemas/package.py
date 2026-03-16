from pydantic import BaseModel
from typing import Optional, List
from datetime import date
from app.schemas.config import Destino, Categoria, Hotel, Transporte, Servicio, PuntoAscenso

class PaqueteBase(BaseModel):
    destino_id: int
    categoria_id: int
    titulo_subtitulo: str
    fecha_salida: date
    fecha_regreso: date
    duracion_dias: int
    duracion_noches: int
    precio_base: float
    estado: bool = True

class PaqueteCreate(PaqueteBase):
    hotel_ids: List[int] = []
    transporte_ids: List[int] = []
    servicio_ids: List[int] = []
    punto_ascenso_ids: List[int] = []

class PaqueteUpdate(BaseModel):
    destino_id: Optional[int] = None
    categoria_id: Optional[int] = None
    titulo_subtitulo: Optional[str] = None
    fecha_salida: Optional[date] = None
    fecha_regreso: Optional[date] = None
    duracion_dias: Optional[int] = None
    duracion_noches: Optional[int] = None
    precio_base: Optional[float] = None
    estado: Optional[bool] = None
    hotel_ids: Optional[List[int]] = None
    transporte_ids: Optional[List[int]] = None
    servicio_ids: Optional[List[int]] = None
    punto_ascenso_ids: Optional[List[int]] = None

class PaqueteInDBBase(PaqueteBase):
    id: int
    destino: Optional[Destino] = None
    categoria: Optional[Categoria] = None
    hoteles: List[Hotel] = []
    transportes: List[Transporte] = []
    servicios: List[Servicio] = []
    puntos_ascenso: List[PuntoAscenso] = []

    class Config:
        from_attributes = True

class Paquete(PaqueteInDBBase):
    pass
