from pydantic import BaseModel
from typing import Optional, List
from datetime import date
from app.schemas.config import Destino, Categoria, Hotel, Transporte, Servicio, PuntoAscenso


# --- PaqueteHotel (junction con atributos) ---

class PaqueteHotelDetalleCreate(BaseModel):
    hotel_id: int
    regimen: Optional[str] = None
    cantidad_noches: Optional[int] = None

class PaqueteHotelDetalle(BaseModel):
    hotel_id: int
    hotel: Optional[Hotel] = None
    regimen: Optional[str] = None
    cantidad_noches: Optional[int] = None

    class Config:
        from_attributes = True


# --- Paquete ---

class PaqueteBase(BaseModel):
    destino_id: int
    categoria_id: int
    titulo_subtitulo: str
    fecha_salida: Optional[date] = None
    fecha_regreso: Optional[date] = None
    duracion_dias: int
    duracion_noches: int
    precio_base: float
    precio_adicional: float = 0
    moneda: str = "ARS"
    tipo_salidas: str = "FECHA_ESPECIFICA"   # DIARIAS | FECHA_ESPECIFICA
    imagen_url: Optional[str] = None
    adicionales: List[str] = []
    sobre_el_destino: Optional[str] = None
    include_transfer: bool = True
    include_asistencia_medica: bool = True
    es_borrador: bool = False
    estado: bool = True
    imagen_url: Optional[str] = None
    regimen: Optional[str] = None
    gastos_reserva: float = 0
    salidas_diarias: bool = False
    # Additional detail fields
    periodo: Optional[str] = None
    moneda: Optional[str] = None
    adicionales_json: Optional[Dict[str, Any]] = None
    transporte_incluido: Optional[bool] = None
    transporte_empresa: Optional[str] = None
    transporte_tipo: Optional[str] = None
    horario_salida: Optional[time] = None
    horario_regreso: Optional[time] = None
    alojamiento_incluido: Optional[bool] = None
    alojamiento_noches: Optional[int] = None


class PaqueteCreate(PaqueteBase):
    hotel_detalles: List[PaqueteHotelDetalleCreate] = []
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
    precio_adicional: Optional[float] = None
    moneda: Optional[str] = None
    tipo_salidas: Optional[str] = None
    imagen_url: Optional[str] = None
    adicionales: Optional[List[str]] = None
    sobre_el_destino: Optional[str] = None
    include_transfer: Optional[bool] = None
    include_asistencia_medica: Optional[bool] = None
    es_borrador: Optional[bool] = None
    estado: Optional[bool] = None
<<<<<<< HEAD
    imagen_url: Optional[str] = None
    regimen: Optional[str] = None
    gastos_reserva: Optional[float] = None
    salidas_diarias: Optional[bool] = None
    # Additional detail fields for update
    periodo: Optional[str] = None
    moneda: Optional[str] = None
    adicionales_json: Optional[Dict[str, Any]] = None
    transporte_incluido: Optional[bool] = None
    transporte_empresa: Optional[str] = None
    transporte_tipo: Optional[str] = None
    horario_salida: Optional[time] = None
    horario_regreso: Optional[time] = None
    alojamiento_incluido: Optional[bool] = None
    alojamiento_noches: Optional[int] = None
    hotel_ids: Optional[List[int]] = None
=======
    hotel_detalles: Optional[List[PaqueteHotelDetalleCreate]] = None
>>>>>>> 2ceb188 (Add cards)
    transporte_ids: Optional[List[int]] = None
    servicio_ids: Optional[List[int]] = None
    punto_ascenso_ids: Optional[List[int]] = None


class PaqueteInDBBase(PaqueteBase):
    id: int
    destino: Optional[Destino] = None
    categoria: Optional[Categoria] = None
    hotel_detalles: List[PaqueteHotelDetalle] = []
    transportes: List[Transporte] = []
    servicios: List[Servicio] = []
    puntos_ascenso: List[PuntoAscenso] = []

    class Config:
        from_attributes = True


class Paquete(PaqueteInDBBase):
    pass

