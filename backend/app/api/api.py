from fastapi import APIRouter
from app.api.routers import auth, users, config, packages, bookings, uploads, notifications, board, liquidaciones, vouchers

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Autenticación"])
api_router.include_router(users.router, prefix="/users", tags=["Usuarios (Vendedores)"])
api_router.include_router(config.router, prefix="/config", tags=["Configuraciones (Diccionarios)"])
api_router.include_router(packages.router, prefix="/packages", tags=["Paquetes"])
api_router.include_router(bookings.router, prefix="/bookings", tags=["Reservas"])
api_router.include_router(uploads.router, prefix="/uploads", tags=["Uploads"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["Notificaciones"])
api_router.include_router(board.router, prefix="/cartelera", tags=["Cartelera"])
api_router.include_router(liquidaciones.router, prefix="/liquidaciones", tags=["Liquidaciones"])
api_router.include_router(vouchers.router, prefix="/vouchers", tags=["Vouchers"])
