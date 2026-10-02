# Alexis EVT — resumen del proyecto

Alexis EVT combina un sitio público de turismo con un panel para administrar paquetes, salidas, reservas, vendedores, vouchers y liquidaciones.

## Arquitectura

- `frontend/`: Next.js 16, React 19 y TypeScript. Las páginas públicas están en `src/app/(public)/`; el panel, en `src/app/(admin)/`.
- `backend/`: API FastAPI con modelos SQLAlchemy, esquemas Pydantic, autenticación JWT y migraciones Alembic.
- Base de datos: MySQL en producción; SQLite sirve para desarrollo y pruebas.
- `docker-compose.yml`: frontend, API y worker independiente de FFmpeg para procesar videos.
- `docs/`: decisiones de arquitectura, configuración Nginx y procedimientos operativos.

## Entidades centrales

- **Paquete** y sus asociaciones a destino, categoría, hotel, transporte, servicios y puntos de ascenso.
- **PaqueteFechaSalida**, que permite definir múltiples fechas de salida y regreso.
- **Reserva**, que conserva la salida seleccionada, pasajeros, vendedor, estado y precio.
- **Liquidación**, con conceptos, cálculo de comisión y pagos.

La documentación funcional, instalación, variables de entorno, pruebas y prioridades de mejora están en el [README principal](README.md). Actualizá ese documento cuando cambie el comportamiento del sistema.
