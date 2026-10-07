/**
 * Configuracion de ambiente leida desde variables de entorno.
 *
 * Reglas:
 *  - UI_BASE_URL y API_BASE_URL se reciben SIEMPRE por variable de entorno.
 *  - La prueba estructural NO necesita URLs; por eso la lectura no falla al cargar.
 *  - Las pruebas funcionales deben invocar requireUiBaseUrl() / requireApiBaseUrl(),
 *    que fallan con un mensaje entendible cuando la URL real no fue configurada.
 *  - No se imprimen secretos.
 */

function readOptionalNumber(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === '') {
    return fallback;
  }
  const parsed = Number(raw);
  if (Number.isNaN(parsed) || parsed <= 0) {
    throw new Error(
      `Variable de entorno ${name} invalida: "${raw}". Debe ser un numero positivo.`
    );
  }
  return parsed;
}

export interface EnvironmentConfig {
  readonly uiBaseUrl: string;
  readonly apiBaseUrl: string;
  readonly testTimeout: number;
  readonly expectTimeout: number;
  readonly workers: number;
}

/**
 * Lee la configuracion sin fallar aunque falten las URLs (modo estructural).
 */
export function readEnvironment(): EnvironmentConfig {
  return {
    uiBaseUrl: (process.env['UI_BASE_URL'] ?? '').trim(),
    apiBaseUrl: (process.env['API_BASE_URL'] ?? '').trim(),
    testTimeout: readOptionalNumber('TEST_TIMEOUT', 30_000),
    expectTimeout: readOptionalNumber('EXPECT_TIMEOUT', 5_000),
    workers: readOptionalNumber('WORKERS', 1),
  };
}

/**
 * Exige UI_BASE_URL real. Falla claramente si no fue configurada.
 */
export function requireUiBaseUrl(): string {
  const value = (process.env['UI_BASE_URL'] ?? '').trim();
  if (value.length === 0) {
    throw new Error(
      'Configuracion requerida: falta UI_BASE_URL. ' +
        'Defina la variable de entorno UI_BASE_URL con la URL real de la interfaz. ' +
        'Esta prueba funcional no puede ejecutarse sin ella.'
    );
  }
  return value;
}

/**
 * Exige API_BASE_URL real. Falla claramente si no fue configurada.
 */
export function requireApiBaseUrl(): string {
  const value = (process.env['API_BASE_URL'] ?? '').trim();
  if (value.length === 0) {
    throw new Error(
      'Configuracion requerida: falta API_BASE_URL. ' +
        'Defina la variable de entorno API_BASE_URL con la URL real de la API. ' +
        'Esta prueba funcional no puede ejecutarse sin ella.'
    );
  }
  return value;
}
