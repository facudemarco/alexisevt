# ADR-004: Videos del banner en el VPS

## Decisión

El administrador sube MP4, MOV, WebM o M4V desde Parámetros → Video Banner.
La API guarda el archivo por bloques y responde 202. Un único proceso independiente
convierte los trabajos pendientes, incluyendo los interrumpidos por un reinicio.
La cola y los archivos sobreviven a la recreación de los contenedores.

FFmpeg genera MP4 H.264, sin audio, con `yuv420p` y `faststart`: hasta 1920×1080
para escritorio y 1280×720 para móviles. Conserva la relación de aspecto y no aumenta
la resolución. Conserva la tasa promedio del original hasta 60 fps, incluyendo 59,94;
no interpola cuadros. CRF 21 con límites VBV de 6 y 3 Mbps respectivamente.
La versión móvil se selecciona al cargar, según el ancho de pantalla; no es streaming
adaptativo HLS ni garantiza 60 fps en todos los dispositivos o conexiones.

Solo después de generar ambas versiones y el poster se actualizan las tres URLs en
una transacción de MySQL. Un error conserva la configuración anterior. Hostinger
guarda configuración; los archivos se almacenan en el VPS y Nginx los sirve directamente.
El Vimeo anterior queda como compatibilidad hasta la primera publicación local.
Las cabeceras de otras páginas que todavía tienen un Vimeo fijo no usan esta configuración.

## Despliegue con Docker Compose y Nginx

El despliegue se administra por SSH, exclusivamente con Docker Compose y Nginx;
no requiere acceso a Ferozo. Compose ejecuta frontend, API y worker. Nginx corre
en el host, termina HTTPS, conecta con los puertos locales 3011 y 8011 y sirve
los videos desde el volumen compartido. La DB permanece en Hostinger.

1. Verificar que la ruta real del proyecto sea `/home/iweb/alexisevt`; adaptar los
   volúmenes de Compose y el alias Nginx si difiere. Respaldar la DB antes del despliegue.
2. Mantener `backend/.env` con los datos de Hostinger y `SECRET_KEY`. API y worker
   deben compartir DB, `VIDEOS_DIR` y `VIDEOS_BASE_URL`. Compose define estos últimos
   como `/app/data/videos` y `/media/videos` y monta el directorio persistente.
3. Ejecutar `docker compose up -d --build`. La imagen instala FFmpeg y FFprobe.
   El worker tiene un límite de 4 CPU y 8 GB; mantener exactamente una instancia
   del worker y un proceso Uvicorn de la API para la coordinación de cargas.
4. Ejecutar `docker compose exec backend python update_db_v5.py` para completar
   la inicialización de `site_config` del cambio previo.
5. Incorporar el bloque `/media/videos/` de `docs/nginx/alexisevt.conf` al virtual
   host HTTPS activo del dominio en el host. Localizarlo con `sudo nginx -T`;
   la ruta de referencia es `/etc/nginx/sites-available/alexisevt`.
   Conservar las rutas reales de certificados y la configuración existente del dominio.
   Exponer únicamente `data/videos/published/`, nunca `jobs/`.
6. Revisar la CSP existente: `media-src 'self'` debe permitir los archivos locales.
   La configuración de referencia también corrige una directiva CSP truncada.
   Ajustar el límite de subida de todos los proxies por encima de 500 MB, incluyendo
   el margen multipart. La referencia existente permite 1000 MB.
7. Validar con `sudo nginx -t` y, solo si pasa, ejecutar `sudo nginx -s reload`.
   Verificar después del despliegue que
   `curl -I -H 'Range: bytes=0-1023' https://DOMINIO/media/videos/ARCHIVO.mp4`
   responda 206 y que el tipo MIME sea `video/mp4`.

Desde la raíz del proyecto en el VPS, los comandos de operación son:

```sh
docker compose config --quiet
docker compose up -d --build
docker compose exec backend python update_db_v5.py
docker compose ps
docker compose exec video-worker ffmpeg -version
docker compose logs --tail=100 video-worker
sudo nginx -t
# Ejecutar únicamente si la validación anterior fue exitosa:
sudo nginx -s reload
```

FFmpeg y FFprobe se instalan dentro de la imagen Docker; no se necesita instalarlos
en el host ni configurar un supervisor adicional para el worker. En desarrollo,
FastAPI sirve solo `published/` en `/uploads/videos/`.

## Límites y operación

- `VIDEO_MAX_UPLOAD_MB=500`, `VIDEO_MAX_DURATION_SECONDS=1800` y
  `VIDEO_PROCESS_TIMEOUT_SECONDS=7200` son configurables en ambos servicios.
  El panel muestra los límites de tamaño y duración consultados a la API.
- `docker compose logs --tail=100 video-worker` permite diagnosticar conversiones.
  No detener el worker durante publicaciones salvo mantenimiento; una conversión
  interrumpida se vuelve a ejecutar desde el original.
- Los originales se eliminan al terminar o fallar; las versiones publicadas anteriores
  se conservan. Supervisar disco y purgar versiones antiguas solo tras verificar que
  no sean las URLs activas y dejar al menos siete días para clientes con caché.
  Una caída durante la recepción puede dejar un `.source` sin trabajo asociado;
  eliminar esos huérfanos únicamente durante mantenimiento sin cargas activas.
- Incluir el volumen de videos en los backups; el nombre del plan de backup por sí
  solo no confirma que estos archivos estén cubiertos.
- 8 TB/mes es una cuota, no la velocidad del puerto. A 6 Mbps, 30 segundos equivalen
  aproximadamente a 22,5 MB: unas 355.000 descargas completas consumirían 8 TB decimales,
  antes de imágenes y demás tráfico. Medir transferencia real y arranque/buffering.

## Validación

`python -m pytest tests/test_banner_video.py -q` desde `backend/` usa SQLite aislado
y simula FFmpeg para comprobar publicación, fallos, límites, fps y autenticación.
En el VPS, probar además archivos reales de 30 y 59,94/60 fps, MOV y WebM,
reinicio durante procesamiento y reproducción móvil. Comprobar los resultados con
FFprobe y verificar que un archivo inválido no cambie el banner activo.

Referencias: [FFmpeg: filtros](https://ffmpeg.org/ffmpeg-filters.html),
[FFmpeg: faststart](https://ffmpeg.org/ffmpeg-formats.html),
[Nginx: archivos y rangos](https://nginx.org/en/docs/http/ngx_http_core_module.html).
