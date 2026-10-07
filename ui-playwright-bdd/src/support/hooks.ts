import { After } from './fixtures';
import { adjuntarContexto } from '../utils/evidence';

// Adjunta el contexto del escenario (ID, datos, resultados) a la evidencia de cada
// prueba. Screenshots/video/trace los captura Playwright por configuracion.
After(async ({ ctx, $testInfo }) => {
  await adjuntarContexto($testInfo, ctx);
});

// Restauracion defensiva del proveedor para escenarios de configuracion global.
After({ tags: '@configuracionGlobal' }, async ({ api }) => {
  try {
    await api.restaurarProveedor();
  } catch (e) {
    // No ocultar: re-lanzar para que quede visible como bloqueo de aislamiento.
    throw new Error(
      'BLOQUEADO POR AISLAMIENTO: no se pudo restaurar el proveedor a normal. ' +
        'Restaure manualmente con PUT /api/simulacion/proveedor {"modo":"normal","demoraMs":4000}. ' +
        'Detalle: ' +
        (e instanceof Error ? e.message : String(e))
    );
  }
});
