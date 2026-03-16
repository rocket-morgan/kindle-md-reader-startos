# Kindle Markdown Reader (StartOS)

## Setup
1. Instala el servicio (sideload `.s9pk`).
2. En **Config**, ajusta `AUTH_USER`, `AUTH_PASS`, `SESSION_SECRET` (obligatorio cambiar `AUTH_PASS` y `SESSION_SECRET`).
3. El servicio monta el volumen `data` en `/vault`. Sube tus archivos `.md` allí (ej. con File Browser).
4. Abre la interfaz web desde StartOS (Tor/LAN). Login con las credenciales configuradas.
5. Usa el navegador de carpetas para leer tus Markdown. Controles +/- ajustan font-size (cookie).

## Notas
- HTML minimal, sin JS ni imágenes. Ideal para el navegador del Kindle.
- Protección contra path traversal. Solo lee `.md`.
- Health check en `/health`.

## Backup
- Respaldá el volumen `data` (vault). No se almacenan credenciales dentro del volumen.
