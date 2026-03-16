#!/bin/bash
set -euo pipefail
# Kindle MD Reader entrypoint for StartOS 0.3.5
# Tries to read StartOS config file if present; falls back to env vars.

log() { echo "[kindle-md] $*"; }

# candidate config paths (0.3.5 services commonly get rendered JSON/YAML here)
CANDIDATES=(
  "/root/start9/config.json"
  "/start9/config.json"
  "/root/start9/config.yaml"
  "/start9/config.yaml"
)
AUTH_USER_ENV=${AUTH_USER:-kindle}
AUTH_PASS_ENV=${AUTH_PASS:-changeme}
VAULT_PATH_ENV=${VAULT_PATH:-/vault}
PORT_ENV=${PORT:-3000}

CONFIG_USER="$AUTH_USER_ENV"
CONFIG_PASS="$AUTH_PASS_ENV"
CONFIG_VAULT="$VAULT_PATH_ENV"
CONFIG_PORT="$PORT_ENV"

for f in "${CANDIDATES[@]}"; do
  if [ -f "$f" ]; then
    log "found config file: $f"
    case "$f" in
      *.json)
        CONFIG_USER=$(jq -r '.authUser // empty' "$f" 2>/dev/null || echo "$CONFIG_USER")
        CONFIG_PASS=$(jq -r '.authPass // empty' "$f" 2>/dev/null || echo "$CONFIG_PASS")
        CONFIG_VAULT=$(jq -r '.vaultPath // empty' "$f" 2>/dev/null || echo "$CONFIG_VAULT")
        CONFIG_PORT=$(jq -r '.port // empty' "$f" 2>/dev/null || echo "$CONFIG_PORT")
        ;;
      *.yaml|*.yml)
        CONFIG_USER=$(yq -r '.authUser // ""' "$f" 2>/dev/null || echo "$CONFIG_USER")
        CONFIG_PASS=$(yq -r '.authPass // ""' "$f" 2>/dev/null || echo "$CONFIG_PASS")
        CONFIG_VAULT=$(yq -r '.vaultPath // ""' "$f" 2>/dev/null || echo "$CONFIG_VAULT")
        CONFIG_PORT=$(yq -r '.port // ""' "$f" 2>/dev/null || echo "$CONFIG_PORT")
        ;;
    esac
    break
  fi
done

# fallbacks if empty
CONFIG_USER=${CONFIG_USER:-$AUTH_USER_ENV}
CONFIG_PASS=${CONFIG_PASS:-$AUTH_PASS_ENV}
CONFIG_VAULT=${CONFIG_VAULT:-$VAULT_PATH_ENV}
CONFIG_PORT=${CONFIG_PORT:-$PORT_ENV}

log "using user=$CONFIG_USER vault=$CONFIG_VAULT port=$CONFIG_PORT"

export AUTH_USER="$CONFIG_USER"
export AUTH_PASS="$CONFIG_PASS"
export VAULT_PATH="$CONFIG_VAULT"
export PORT="$CONFIG_PORT"

trap "log 'shutdown signal'; exit 0" SIGTERM SIGINT
exec node server.js
