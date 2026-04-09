from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import date, time
from app.schemas.config import Destino, Categoria, Hotel, Transporte, Servicio, PuntoAscenso, Aerolinea


# --- PaqueteHotel (junction con atributos) ---

class PaqueteHotelDetalleCreate(BaseModel):
    hotel_id: int
    regimen: Optional[str] = None
    cantidad_noches: Optional[int] = None
    precio: Optional[float] = None

class PaqueteHotelDetalle(BaseModel):
    hotel_id: int
    hotel: Optional[Hotel] = None
    regimen: Optional[str] = None
    cantidad_noches: Optional[int] = None
    precio: Optional[float] = None

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
    moneda: Optional[str] = "ARS"
    tipo_salidas: str = "FECHA_ESPECIFICA"
    imagen_url: Optional[str] = None
    imagen_posicion: Optional[str] = "center"
    adicionales: List[str] = []
    sobre_el_destino: Optional[str] = None
    include_transfer: bool = True
    include_asistencia_medica: bool = True
    es_borrador: bool = False
    estado: bool = True
    regimen: Optional[str] = None
    gastos_reserva: float = 0
    salidas_diarias: bool = False
    periodo: Optional[str] = None
    adicionales_json: Optional[Dict[str, Any]] = None
    transporte_incluido: Optional[bool] = None
    transporte_empresa: Optional[str] = None
    transporte_tipo: Optional[str] = None
    horario_salida: Optional[str] = None
    horario_regreso: Optional[str] = None
    alojamiento_incluido: Optional[bool] = None
    alojamiento_noches: Optional[int] = None

    aereo_incluido: bool = False
    aereo_aerolinea_id: Optional[int] = None
    aereo_tipo_servicio: Optional[str] = None
    aereo_horario_salida: Optional[str] = None
    aereo_horario_salida_hasta: Optional[str] = None
    aereo_horario_regreso: Optional[str] = None


class PaqueteCreate(PaqueteBase):
    hotel_detalles: List[PaqueteHotelDetalleCreate] = []
    transporte_ids: List[int] = []
    servicio_ids: List[int] = []
    punto_ascenso_ids: List[int] = []
    aereo_punto_ascenso_ids: List[int] = []


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
    imagen_posicion: Optional[str] = None
    adicionales: Optional[List[str]] = None
    sobre_el_destino: Optional[str] = None
    include_transfer: Optional[bool] = None
    include_asistencia_medica: Optional[bool] = None
    es_borrador: Optional[bool] = None
    estado: Optional[bool] = None
    regimen: Optional[str] = None
    gastos_reserva: Optional[float] = None
    salidas_diarias: Optional[bool] = None
    periodo: Optional[str] = None
    adicionales_json: Optional[Dict[str, Any]] = None
    transporte_incluido: Optional[bool] = None
    transporte_empresa: Optional[str] = None
    transporte_tipo: Optional[str] = None
    horario_salida: Optional[str] = None
    horario_regreso: Optional[str] = None
    alojamiento_incluido: Optional[bool] = None
    alojamiento_noches: Optional[int] = None
    aereo_incluido: Optional[bool] = None
    aereo_aerolinea_id: Optional[int] = None
    aereo_tipo_servicio: Optional[str] = None
    aereo_horario_salida: Optional[str] = None
    aereo_horario_salida_hasta: Optional[str] = None
    aereo_horario_regreso: Optional[str] = None
    hotel_detalles: Optional[List[PaqueteHotelDetalleCreate]] = None
    transporte_ids: Optional[List[int]] = None
    servicio_ids: Optional[List[int]] = None
    punto_ascenso_ids: Optional[List[int]] = None
    aereo_punto_ascenso_ids: Optional[List[int]] = None


class PaqueteInDBBase(PaqueteBase):
    id: int
    destino: Optional[Destino] = None
    categoria: Optional[Categoria] = None
    hotel_detalles: List[PaqueteHotelDetalle] = []
    transportes: List[Transporte] = []
    servicios: List[Servicio] = []
    puntos_ascenso: List[PuntoAscenso] = []
    aereo_puntos_ascenso: List[PuntoAscenso] = []
    aerolinea: Optional[Aerolinea] = None

    class Config:
        from_attributes = True


class Paquete(PaqueteInDBBase):
    pass
