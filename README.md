# kindle-md-reader-startos

Wrapper StartOS para el proyecto [kindle-md-reader](https://github.com/rocket-morgan/kindle-md-reader): servidor HTML minimal para leer Markdown en Kindle.

## Estructura
- `Dockerfile`: build de la app (Node 20-slim)
- `docker_entrypoint.sh`: arranque y manejo de señales
- `manifest.yaml`: definición StartOS (interfaces, volúmenes, env)
- `instructions.md`: guía de uso
- `app/`: código de la app (copiado del repo principal)

## Build (multi-arch) + pack (.s9pk)
Requiere `docker buildx` y `start-sdk` instalados.

```bash
# desde este repo
make image   # opcional: docker buildx build ... -o type=docker,dest=image.tar
make pack    # usa start-sdk pack
make verify  # start-sdk verify s9pk kindle-md-reader.s9pk
```

Makefile incluye comandos base; ajusta plataforma/versión según tu entorno.

## Config en StartOS
- Volumen `data` → `/vault`
- Env:
  - `AUTH_USER` (default: kindle)
  - `AUTH_PASS` (default: changeme)
  - `SESSION_SECRET` (cámbialo)
  - `VAULT_PATH` (default `/vault`)
  - `PORT` (default 3000)

## Salud
- Health check HTTP `GET /health`.

## Licencia
MIT
