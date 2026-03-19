from pydantic import BaseModel
from typing import Optional, List

# --- Generic Config Schema ---
class ConfigItemBase(BaseModel):
    nombre: str

class ConfigItemCreate(ConfigItemBase):
    pass

class ConfigItemInDBBase(ConfigItemBase):
    id: int

    class Config:
        from_attributes = True

# Destino / Categoria
class Destino(ConfigItemInDBBase): pass
class DestinoCreate(ConfigItemCreate): pass

class Categoria(ConfigItemInDBBase):
    slug: Optional[str] = None
    imagen_url: Optional[str] = None
class CategoriaCreate(ConfigItemCreate):
    slug: Optional[str] = None
    imagen_url: Optional[str] = None

# Hotel (con campos extendidos)
class HotelBase(ConfigItemBase):
    direccion: Optional[str] = None
    descripcion: Optional[str] = None
    imagenes: List[str] = []

class HotelCreate(HotelBase): pass

class Hotel(HotelBase):
    id: int
    class Config:
        from_attributes = True

# Transporte (con scheduling)
class TransporteBase(ConfigItemBase):
    tipo: Optional[str] = None
    horario_salida_desde: Optional[str] = None
    horario_salida_hasta: Optional[str] = None
    horario_regreso: Optional[str] = None

class TransporteCreate(TransporteBase): pass

class Transporte(TransporteBase):
    id: int
    class Config:
        from_attributes = True

# Servicio / PuntoAscenso
class Servicio(ConfigItemInDBBase): pass
class ServicioCreate(ConfigItemCreate): pass

class PuntoAscenso(BaseModel):
    id: int
    nombre_lugar: str
    direccion_maps: str
    horario_default: str

    class Config:
        from_attributes = True

class PuntoAscensoCreate(BaseModel):
    nombre_lugar: str
    direccion_maps: str
    horario_default: str


