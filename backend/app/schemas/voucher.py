from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import date, datetime


class VoucherBase(BaseModel):
    # Transporte
    incluye_transporte: bool = True
    transporte_numero: Optional[str] = None
    transporte_proveedor: Optional[str] = None
    transporte_direccion: Optional[str] = None
    transporte_servicio: Optional[str] = None
    transporte_tramo: Optional[str] = None
    transporte_coordinador: Optional[str] = None
    transporte_coordinador_telefono: Optional[str] = None
    transporte_lugar_ascenso: Optional[str] = None
    transporte_horario_salida: Optional[str] = None
    transporte_fecha_salida: Optional[date] = None
    transporte_fecha_regreso: Optional[date] = None
    transporte_observaciones: Optional[str] = None

    # Hotelería
    incluye_hoteleria: bool = True
    hoteleria_numero: Optional[str] = None
    hoteleria_hotel_nombre: Optional[str] = None
    hoteleria_direccion: Optional[str] = None
    hoteleria_telefono: Optional[str] = None
    hoteleria_noches: Optional[int] = None
    hoteleria_regimen: Optional[str] = None
    hoteleria_detalle_habitaciones: Optional[str] = None
    hoteleria_fecha_ingreso: Optional[date] = None
    hoteleria_fecha_egreso: Optional[date] = None
    hoteleria_observaciones: Optional[str] = None

    # General
    pasajero_titular: Optional[str] = None
    cant_pax_detalle: Optional[str] = None


class VoucherCreate(VoucherBase):
    reserva_id: int


class VoucherUpdate(VoucherBase):
    pass


class VoucherResponse(VoucherBase):
    id: int
    reserva_id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
