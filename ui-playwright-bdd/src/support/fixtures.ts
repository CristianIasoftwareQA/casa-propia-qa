import { test as base, createBdd } from 'playwright-bdd';
import { CreditApiClient } from '../api/credit-api.client';
import { TestContext, createTestContext } from '../models/test-context.model';
import { SolicitudPage } from '../pages/solicitud.page';
import { EvaluacionPage } from '../pages/evaluacion.page';
import { DocumentosPage } from '../pages/documentos.page';
import { ConfirmacionPage } from '../pages/confirmacion.page';

// Fixtures por escenario: contexto aislado (ctx), cliente de API (api con dispose
// automatico) y Page Objects. Evidencia y restauracion del proveedor van en hooks.
export interface Fixtures {
  ctx: TestContext;
  api: CreditApiClient;
  solicitudPage: SolicitudPage;
  evaluacionPage: EvaluacionPage;
  documentosPage: DocumentosPage;
  confirmacionPage: ConfirmacionPage;
}

export const test = base.extend<Fixtures>({
  ctx: async ({}, use) => {
    await use(createTestContext());
  },

  api: async ({}, use) => {
    const client = await CreditApiClient.create();
    await use(client);
    await client.dispose();
  },

  solicitudPage: async ({ page }, use) => {
    await use(new SolicitudPage(page));
  },
  evaluacionPage: async ({ page }, use) => {
    await use(new EvaluacionPage(page));
  },
  documentosPage: async ({ page }, use) => {
    await use(new DocumentosPage(page));
  },
  confirmacionPage: async ({ page }, use) => {
    await use(new ConfirmacionPage(page));
  },
});

export const { Given, When, Then, Before, After } = createBdd(test);
