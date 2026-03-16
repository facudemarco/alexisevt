from pydantic import BaseModel
from typing import Optional
from datetime import date

class BoardItemBase(BaseModel):
    titulo: str
    imagen_url: str
    fecha_expiracion: date

class BoardItemCreate(BoardItemBase):
    pass

class BoardItemUpdate(BaseModel):
    titulo: Optional[str] = None
    imagen_url: Optional[str] = None
    fecha_expiracion: Optional[date] = None

class BoardItemInDBBase(BoardItemBase):
    id: int

    class Config:
        from_attributes = True

class BoardItem(BoardItemInDBBase):
    pass
