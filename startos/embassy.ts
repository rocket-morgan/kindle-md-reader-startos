// Config and properties for StartOS 0.3.5
// Minimal spec to map UI config to env vars
import { matches, object, string, any } from "https://deno.land/x/embassyd_sdk@v0.3.3.0/mod.ts";

export const config = {
  "title": "Kindle MD Reader",
  "description": "Configura usuario, contraseña y ruta del vault",
  "type": "object",
  "properties": {
    "authUser": {
      "type": "string",
      "title": "Usuario",
      "default": "kindle"
    },
    "authPass": {
      "type": "string",
      "title": "Contraseña",
      "default": "changeme",
      "writeOnly": true
    },
    "vaultPath": {
      "type": "string",
      "title": "Ruta del vault",
      "default": "/vault"
    }
  },
  "required": ["authUser", "authPass", "vaultPath"]
};

export const properties = matches(object({
  authUser: string(),
  authPass: string(),
  vaultPath: string(),
}));

// health: simple pass-through
export const health = async () => {
  return { status: "starting" };
};
