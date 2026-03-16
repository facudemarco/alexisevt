from fastapi import APIRouter
from app.api.routers import auth, users, config, packages, bookings

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Autenticación"])
api_router.include_router(users.router, prefix="/users", tags=["Usuarios (Vendedores)"])
api_router.include_router(config.router, prefix="/config", tags=["Configuraciones (Diccionarios)"])
api_router.include_router(packages.router, prefix="/packages", tags=["Paquetes"])
api_router.include_router(bookings.router, prefix="/bookings", tags=["Reservas"])
