# Despliegue de habitaciones por reserva

La revisión de Alembic anterior debe ser `015`. La aplicación existente sigue
funcionando con el esquema ampliado, pero el código nuevo necesita que el
esquema esté actualizado antes de iniciar. Preparar y probar el despliegue en
un entorno de ensayo y respaldar la base antes de intervenir producción.

1. Actualizar el código en el servidor sin iniciar todavía la versión nueva.
   Verificar que la base correcta tiene una única revisión Alembic `015`
   (`SELECT version_num FROM alembic_version;` o `alembic current`). Si no es
   así, detenerse y resolver las migraciones anteriores.
2. Elegir **una** forma de actualizar el esquema:
   - Desde `backend/`, con la configuración de la base correcta: `alembic upgrade 016`.
   - Si se aplica manualmente, ejecutar `docs/016_booking_rooms_mysql.sql` en
     esa base MySQL/MariaDB. Verificar que ambas sentencias terminaron bien,
     que existen la tabla, la columna, los índices y las dos claves foráneas,
     y que los pasajeros existentes mantienen `habitacion_id` en NULL. Luego,
     desde `backend/` y contra la misma base, ejecutar `alembic stamp 016`.
     Confirmar con `alembic current`. No ejecutar `upgrade 016` después del SQL.

   El DDL de MySQL/MariaDB puede confirmarse parcialmente. Si falla alguna
   sentencia, no repetir el archivo completo ni hacer `stamp`: inspeccionar
   el esquema y completar o revertir los cambios parciales antes de continuar.
3. Instalar las dependencias y construir el frontend con `NEXT_PUBLIC_API_URL`
   apuntando a la API correcta e incluyendo `/api/v1`. Desplegar y reiniciar
   backend y frontend según el procedimiento habitual del servidor.
4. Comprobar una reserva nueva con habitaciones, una reserva existente sin
   asignaciones, la liquidación y la visualización del voucher. La regeneración
   explícita del voucher pide confirmación porque reemplaza campos editados.

La migración de Alembic admite `downgrade 015`, que elimina las habitaciones y
asignaciones. Antes de revertir el esquema, detener la versión nueva y evaluar
la pérdida de esos datos. La reversión del código por sí sola no requiere
eliminar las nuevas columnas y tablas.
