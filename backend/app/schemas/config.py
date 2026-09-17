from pydantic import BaseModel
from typing import Optional, List, Any

# --- Generic Config Schema ---
class ConfigItemBase(BaseModel):
    nombre: str

class ConfigItemCreate(ConfigItemBase):
    pass

class ConfigItemInDBBase(ConfigItemBase):
    id: int

    class Config:
        from_attributes = True

# Destino
class DestinoBase(BaseModel):
    nombre: str
    sigla: Optional[str] = None
    descripcion: Optional[str] = None
    es_combinado: bool = False
    destino_ids: Optional[List[int]] = None

class DestinoCreate(DestinoBase): pass
class DestinoUpdate(DestinoBase): pass

class Destino(DestinoBase):
    id: int
    class Config:
        from_attributes = True

class Categoria(ConfigItemInDBBase):
    slug: Optional[str] = None
    imagen_url: Optional[str] = None
class CategoriaCreate(ConfigItemCreate):
    slug: Optional[str] = None
    imagen_url: Optional[str] = None
class CategoriaUpdate(BaseModel):
    nombre: Optional[str] = None
    slug: Optional[str] = None
    imagen_url: Optional[str] = None

# Hotel (con campos extendidos)
class HotelBase(ConfigItemBase):
    telefono: Optional[str] = None
    destino_id: Optional[int] = None
    direccion: Optional[str] = None
    descripcion: Optional[str] = None
    imagenes: List[str] = []

class HotelCreate(HotelBase): pass
class HotelUpdate(HotelBase): pass

class Hotel(HotelBase):
    id: int
    class Config:
        from_attributes = True

# Transporte (con scheduling)
class TransporteBase(ConfigItemBase):
    razon_social: Optional[str] = None
    tipo: Optional[str] = None
    horario_salida_desde: Optional[str] = None
    horario_salida_hasta: Optional[str] = None
    horario_regreso: Optional[str] = None

class TransporteCreate(TransporteBase): pass
class TransporteUpdate(TransporteBase): pass

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
    direccion_maps: str = ""
    horario_default: str = "00:00"

class PuntoAscensoUpdate(BaseModel):
    nombre_lugar: Optional[str] = None
    direccion_maps: Optional[str] = None
    horario_default: Optional[str] = None


class Aerolinea(ConfigItemInDBBase):
    pass


class AerolineaCreate(ConfigItemCreate):
    pass


class AerolineaUpdate(ConfigItemBase):
    pass


class HomeBannerConfig(BaseModel):
    video_url: str
    mobile_video_url: str = ""
    poster_url: Optional[str] = "/resources/hero_cartelera.png"
