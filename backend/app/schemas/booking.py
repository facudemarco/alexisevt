from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.booking import ReservaStatus
from app.schemas.package import Paquete
from app.schemas.user import User

class ReservaBase(BaseModel):
    paquete_id: int
    pasajeros_adultos: int = 1
    pasajeros_menores: int = 0
    precio_total: float

class ReservaCreate(ReservaBase):
    pass # vendedor_id will be extracted from JWT in the endpoint

class ReservaUpdate(BaseModel):
    estado_reserva: ReservaStatus

class ReservaInDBBase(ReservaBase):
    id: int
    vendedor_id: int
    estado_reserva: ReservaStatus
    fecha_creacion: datetime

    class Config:
        from_attributes = True

class Reserva(ReservaInDBBase):
    vendedor: Optional[User] = None
    paquete: Optional[Paquete] = None
