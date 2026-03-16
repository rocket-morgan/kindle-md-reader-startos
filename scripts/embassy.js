const configSpec = {
  authUser: {
    type: "string",
    name: "Usuario",
    description: "Usuario para iniciar sesion en la interfaz web.",
    nullable: false,
    masked: false,
    copyable: true,
    default: "kindle",
  },
  authPass: {
    type: "string",
    name: "Contrasena",
    description: "Contrasena para iniciar sesion en la interfaz web.",
    nullable: false,
    masked: true,
    copyable: true,
    default: "changeme",
  },
  vaultPath: {
    type: "string",
    name: "Ruta del vault",
    description: "Ruta del directorio Markdown dentro del contenedor.",
    nullable: false,
    masked: false,
    copyable: true,
    default: "/vault",
  },
};

async function readConfig(effects) {
  try {
    const raw = await effects.readFile({
      path: "start9/config.yaml",
      volumeId: "data",
    });
    const config = {};
    for (const line of raw.split("\n")) {
      const match = line.match(/^([^:#]+):\s*(.*)$/);
      if (!match) continue;
      const key = match[1].trim();
      let value = match[2].trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      config[key] = value;
    }
    return config;
  } catch (_error) {
    return undefined;
  }
}

export async function getConfig(effects) {
  return {
    result: {
      config: await readConfig(effects),
      spec: configSpec,
    },
  };
}

export async function setConfig(_effects, config) {
  if (!config.authUser || !config.authPass || !config.vaultPath) {
    return {
      error: "authUser, authPass y vaultPath son obligatorios.",
    };
  }

  return {
    result: {
      signal: "SIGTERM",
      "depends-on": {},
    },
  };
}

export async function properties(_effects) {
  return {
    result: {
      version: 2,
      data: {
        Status: {
          type: "string",
          value: "Ready",
          description: "Kindle Markdown Reader instalado",
          copyable: false,
          qr: false,
          masked: false,
        },
      },
    },
  };
}

export const health = {
  async main(effects, _duration) {
    try {
      const response = await effects.fetch("http://kindle-md-reader.embassy:3000/health", {
        method: "GET",
        headers: { Accept: "text/plain,application/json,text/html" },
      });

      if (!response.ok) {
        return {
          result: "failure",
          message: `Health endpoint returned ${response.status}`,
        };
      }

      return {
        result: "success",
        message: "Kindle Markdown Reader is accessible",
      };
    } catch (error) {
      return {
        result: "failure",
        message: `Cannot reach service: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  },
};
