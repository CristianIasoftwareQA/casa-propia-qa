import { TestInfo } from '@playwright/test';
import { TestContext } from '../models/test-context.model';

/**
 * Utilidades de evidencia. Adjunta datos relevantes al reporte de Playwright ante
 * fallos (ID, datos sinteticos, respuesta API relevante, mensajes de error).
 * Los screenshots/video/trace los captura Playwright por configuracion (only-on-failure).
 */
export async function adjuntarContexto(testInfo: TestInfo, ctx: TestContext): Promise<void> {
  const resumen = {
    requestId: ctx.requestId,
    requestData: ctx.requestData,
    estadoAntes: ctx.stateBefore?.state,
    estadoDespues: ctx.stateAfter?.state,
    apiResult: ctx.apiResult,
    uiResult: ctx.uiResult,
    errorMessages: ctx.errorMessages,
  };
  await testInfo.attach('contexto-escenario.json', {
    body: Buffer.from(JSON.stringify(resumen, null, 2), 'utf-8'),
    contentType: 'application/json',
  });
}
