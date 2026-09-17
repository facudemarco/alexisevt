# Despliegue: paquetes completos

El check **Completo** se guarda al crear o editar un paquete. Permanece visible
en la web con una franja roja, pero la API rechaza nuevas reservas de cualquier rol
con HTTP 409. También rechaza trasladar una reserva a un paquete completo.
Las reservas existentes se conservan y se pueden editar; desmarcar el check
habilita nuevamente las reservas. El estado afecta al paquete entero, incluyendo
todas sus fechas si tiene salidas diarias.

## Docker Compose y Nginx

Desde la raíz del proyecto en el VPS, con el código actualizado y la DB respaldada:

```sh
docker compose build backend frontend
docker compose run --rm --no-deps backend python update_db_v6.py
docker compose up -d --build
```

Aplicar la migración **antes** de iniciar la nueva API: `create_all` no agrega
columnas a tablas existentes. El script agrega `paquetes.completo` con valor inicial
falso y es seguro ejecutarlo nuevamente. Usa la conexión de `backend/.env` a
Hostinger; no requiere acceso a un panel de hosting. No cambia la configuración Nginx.

Para instalaciones que ya mantienen el historial Alembic en revisión 012,
la migración equivalente es `docker compose run --rm --no-deps backend alembic upgrade head`.
La revisión 013 reconoce la columna si el script ya la agregó.

## Verificación

- Marcar Completo y guardar; revisar la franja en tarjetas y detalle.
- Intentar reservar como vendedor y administrador: debe rechazarse sin crear registros.
- Desmarcar y guardar: debe permitir nuevas reservas.
- Comprobar que las reservas previas sigan accesibles.

Pruebas aisladas: `python -m pytest tests/test_package_completo.py -q` desde `backend/`.
