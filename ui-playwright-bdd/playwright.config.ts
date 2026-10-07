import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';
import { readEnvironment } from './src/support/environment';

const env = readEnvironment();

/**
 * playwright-bdd genera los archivos de test (.features-gen) a partir de:
 *  - los .feature en espanol (features/)
 *  - los steps en TypeScript (src/steps/)
 *
 * El comando `bddgen` produce esos archivos; luego Playwright los ejecuta.
 */
const testDir = defineBddConfig({
  features: ['features/**/*.feature'],
  // Steps + fixtures + hooks comparten la misma instancia de createBdd(test).
  steps: ['src/steps/**/*.ts', 'src/support/fixtures.ts', 'src/support/hooks.ts'],
  // Carpeta de salida de los tests generados (ignorada por git).
  outputDir: '.features-gen',
});

export default defineConfig({
  testDir,

  // Sin reintentos en local (requisito).
  retries: 0,

  // Workers configurables por variable de entorno (por defecto 1).
  workers: env.workers,

  // Timeouts configurables por variable de entorno.
  timeout: env.testTimeout,
  expect: {
    timeout: env.expectTimeout,
  },

  // Reporteros: linea (consola), HTML y JSON (insumo para el PDF/index unificado).
  reporter: [
    ['line'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'playwright-report/resultados.json' }],
  ],

  // Evidencia del paso a paso en TODAS las pruebas (no solo ante fallo).
  // El reporte HTML muestra cada step del Gherkin con su captura y la traza navegable.
  use: {
    // baseURL se toma de UI_BASE_URL si esta definida (los Page Objects navegan con
    // requireUiBaseUrl de forma diferida; la estructural no depende de la URL).
    ...(process.env['UI_BASE_URL'] ? { baseURL: process.env['UI_BASE_URL'] } : {}),
    // El frontend ya expone data-testid; alineamos getByTestId con ese atributo.
    testIdAttribute: 'data-testid',
    // Captura siempre: screenshot al final de cada test, video completo y traza con
    // snapshots/capturas por accion. La traza es el "paso a paso" navegable.
    screenshot: 'on',
    video: 'on',
    trace: 'on',
  },

  // Unico navegador: Chromium.
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
