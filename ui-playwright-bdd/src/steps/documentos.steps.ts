import { When } from '../support/fixtures';
import { TipoDocumento } from '../api/credit-api.client';

/**
 * Steps de registro de documentos desde la interfaz (RF03/RF04).
 */

const DOCS_REQUERIDOS: TipoDocumento[] = ['CEDULA', 'CERTIFICADO_INGRESOS', 'AVALUO_VIVIENDA'];

When('completo los documentos requeridos desde la interfaz', async ({ documentosPage }) => {
  await documentosPage.registrarDocumentos(DOCS_REQUERIDOS);
});
