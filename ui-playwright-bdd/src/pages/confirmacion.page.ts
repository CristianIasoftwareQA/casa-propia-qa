import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * Page Object del detalle de la solicitud y de la confirmacion.
 * Expone los campos visibles del detalle para la comparacion UI vs API (RF04).
 */
export class ConfirmacionPage extends BasePage {
  readonly btnConfirmar: Locator;
  readonly idSolicitud: Locator;
  readonly estadoSolicitud: Locator;
  readonly detalleCliente: Locator;
  readonly detalleValorVivienda: Locator;
  readonly detalleMonto: Locator;
  readonly detallePlazo: Locator;
  readonly razonRechazo: Locator;
  readonly resumenConfirmado: Locator;

  constructor(page: Page) {
    super(page);
    this.btnConfirmar = page.getByRole('button', { name: 'Confirmar crédito' });
    this.idSolicitud = page.getByTestId('id-solicitud');
    this.estadoSolicitud = page.getByTestId('estado-solicitud');
    this.detalleCliente = page.getByTestId('detalle-cliente');
    this.detalleValorVivienda = page.getByTestId('detalle-valor-vivienda');
    this.detalleMonto = page.getByTestId('detalle-monto');
    this.detallePlazo = page.getByTestId('detalle-plazo');
    this.razonRechazo = page.getByTestId('razon-rechazo');
    this.resumenConfirmado = page.getByTestId('resumen-confirmado');
  }

  async confirmar(): Promise<void> {
    await this.btnConfirmar.click();
  }

  async leerId(): Promise<string> {
    return (await this.idSolicitud.innerText()).trim();
  }
}
