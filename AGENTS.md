# AGENTS.md — kindle-md-reader-startos

## Qué es
Wrapper StartOS 0.3.5 para el servicio Kindle Markdown Reader (Node). Empaqueta en `.s9pk` con volumen `/vault`.

## Archivos clave
- `Dockerfile` — Node 20-slim, instala jq/yq, copia app/
- `docker_entrypoint.sh` — lee config StartOS si existe, define AUTH_USER/PASS/VAULT/PORT y arranca `node server.js`
- `manifest.yaml` — interfaz http:3000 (UI), volumen data→/vault, config spec (authUser/authPass/vaultPath), health `/health`
- `startos/embassy.ts` — spec de config (authUser, authPass, vaultPath)
- `instructions.md`, `icon.png`, `LICENSE`, `Makefile`

## Config en StartOS
Formulario expone:
- Usuario (authUser)
- Contraseña (authPass)
- Ruta del vault (vaultPath, default /vault)

Volumen:
- `data` montado en `/vault` (rellenar con .md via File Browser u otro servicio StartOS).

## Build .s9pk (0.3.5)
```
docker buildx build --platform=linux/amd64,linux/arm64 -t kindle-md-reader:0.1.0 -o type=docker,dest=image.tar .
start-sdk pack
start-sdk verify s9pk kindle-md-reader.s9pk
```

## Runtime
- Lee config desde archivo si existe (candidatos: /root/start9/config.json, /start9/config.json, /root/start9/config.yaml, /start9/config.yaml) usando jq/yq. Fallback a env.
- Exporta AUTH_USER/AUTH_PASS/VAULT_PATH/PORT y ejecuta `node server.js`.

## Salud
- HTTP `GET /health`
