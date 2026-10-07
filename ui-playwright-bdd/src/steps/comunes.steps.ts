import { expect } from '@playwright/test';
import { Given, When, Then } from '../support/fixtures';
import { CreditRequestFactory } from '../data/credit-request.factory';
import { desdeSolicitudApi } from '../adapters/credit-api.adapter';
import { estadoVisibleAInterno } from '../adapters/credit-ui.adapter';
import { EstadoSolicitud } from '../models/credit-response.model';

/**
 * Steps comunes: apertura de la app, preparacion de datos y aperturas/registros base.
 * El estado del escenario se guarda en el fixture `ctx` (aislado por escenario).
 */

Given('que abro la aplicación Casa Propia', async ({ solicitudPage }) => {
  await solicitudPage.abrir();
  
});

Given('que preparo datos sintéticos válidos de una solicitud', async ({ ctx }) => {
  ctx.requestData = CreditRequestFactory.inferiorAlLimite();
});

Given(
  'que preparo una solicitud con valor de vivienda {int} y monto {int}',
  async ({ ctx }, valorVivienda: number, monto: number) => {
    const bruto = CreditRequestFactory.superiorAlLimite();
    ctx.requestData = {
      ...bruto,
      propertyValue: valorVivienda,
      requestedAmount: monto,
    };
  }
);

When('registro la solicitud desde la interfaz', async ({ ctx, solicitudPage, confirmacionPage }) => {
  expect(ctx.requestData, 'Debe existir requestData').toBeDefined();
  await solicitudPage.registrar(ctx.requestData!);
  // La solicitud registrada aparece en el detalle con su ID.
  await expect(confirmacionPage.idSolicitud).toBeVisible();
});

When('capturo el identificador real de la solicitud', async ({ ctx, confirmacionPage }) => {
  ctx.requestId = await confirmacionPage.leerId();
  expect(ctx.requestId, 'El ID capturado no debe estar vacío').toBeTruthy();
});

// --- Steps de preparacion para continuidad (registra una solicitud evaluable) ---

Given('que registro por la interfaz una solicitud válida y evaluable', async ({ ctx, solicitudPage, confirmacionPage }) => {
  ctx.requestData = CreditRequestFactory.inferiorAlLimite();
  await solicitudPage.registrar(ctx.requestData);
  await expect(confirmacionPage.idSolicitud).toBeVisible();
  ctx.requestId = await confirmacionPage.leerId();
  expect(ctx.requestId).toBeTruthy();
});

// --- Aserciones de estado visible reutilizables ---

Then('la interfaz muestra la solicitud como preaprobada', async ({ confirmacionPage }) => {
  await expect(confirmacionPage.estadoSolicitud).toHaveText('Preaprobada');
  expect(estadoVisibleAInterno('Preaprobada')).toBe(EstadoSolicitud.PREAPROBADA);
});

Then('la interfaz muestra la solicitud como confirmada', async ({ confirmacionPage }) => {
  await expect(confirmacionPage.estadoSolicitud).toHaveText('Confirmada');
});

Then('la interfaz muestra la solicitud como rechazada', async ({ confirmacionPage }) => {
  await expect(confirmacionPage.estadoSolicitud).toHaveText('Rechazada');
});

// --- Consulta por API y comparaciones UI vs API (RF04) ---

When('consulto la misma solicitud mediante la API', async ({ ctx, api }) => {
  expect(ctx.requestId).toBeTruthy();
  const res = await api.consultarSolicitud(ctx.requestId!);
  expect(res.status).toBe(200);
  ctx.apiResult = desdeSolicitudApi(res.body);
});

Then('el identificador coincide entre la interfaz y la API', async ({ ctx, confirmacionPage }) => {
  const idUi = await confirmacionPage.leerId();
  expect(ctx.apiResult?.requestId).toBe(idUi);
  expect(ctx.apiResult?.requestId).toBe(ctx.requestId);
});

Then('el cliente coincide entre la interfaz y la API', async ({ ctx }) => {
  // El cliente visible en el detalle corresponde al dato registrado.
  expect(ctx.apiResult?.clientName).toBe(ctx.requestData?.clientName);
});

Then('el plazo coincide entre la interfaz y la API', async ({ ctx, confirmacionPage }) => {
  const plazoTexto = (await confirmacionPage.detallePlazo.innerText()).trim();
  // El plazo del API debe aparecer en el texto visible ("180 meses (15 años)").
  expect(plazoTexto).toContain(String(ctx.apiResult?.termMonths));
  expect(ctx.apiResult?.termMonths).toBe(ctx.requestData?.termMonths);
});

Then('el estado final coincide entre la interfaz y la API', async ({ ctx, confirmacionPage }) => {
  const estadoUi = estadoVisibleAInterno((await confirmacionPage.estadoSolicitud.innerText()).trim());
  expect(ctx.apiResult?.state).toBe(estadoUi);
});

Then('los documentos están completos según la API', async ({ ctx }) => {
  expect(ctx.apiResult?.documentsComplete).toBe(true);
});
