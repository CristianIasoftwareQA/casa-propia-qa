import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';
import { CreditRequestData } from '../models/credit-request.model';

/**
 * Page Object del formulario de registro y consulta.
 * Contiene localizadores y acciones de pantalla; sin reglas de negocio complejas.
 * Localizadores: se prefieren getByLabel/getByRole; los data-testid usados YA existen
 * en el frontend (no se inventan).
 */
export class SolicitudPage extends BasePage {
  readonly inputCliente: Locator;
  readonly inputValorVivienda: Locator;
  readonly inputMonto: Locator;
  readonly selectPlazo: Locator;
  readonly btnRegistrar: Locator;
  readonly erroresRegistro: Locator;
  readonly inputConsulta: Locator;
  readonly btnConsultar: Locator;

  constructor(page: Page) {
    super(page);
    this.inputCliente = page.getByLabel('Cliente');
    this.inputValorVivienda = page.getByTestId('input-valor-vivienda');
    this.inputMonto = page.getByTestId('input-monto');
    this.selectPlazo = page.getByTestId('select-plazo');
    this.btnRegistrar = page.getByRole('button', { name: 'Registrar solicitud' });
    this.erroresRegistro = page.getByTestId('error-registro');
    this.inputConsulta = page.getByTestId('input-consulta');
    this.btnConsultar = page.getByTestId('btn-consultar');
  }

  /** Completa el formulario y registra la solicitud. */
  async registrar(data: CreditRequestData): Promise<void> {
    await this.inputCliente.fill(data.clientName);
    await this.inputValorVivienda.fill(String(data.propertyValue));
    await this.inputMonto.fill(String(data.requestedAmount));
    // El <select> de Angular usa [ngValue] (no fija value=numero); se selecciona por
    // la etiqueta visible de la opcion, p. ej. "180 meses".
    await this.selectPlazo.selectOption({ label: `${data.termMonths} meses` });
    await this.btnRegistrar.click();
  }

  /** Consulta una solicitud por su identificador. */
  async consultarPorId(id: string): Promise<void> {
    await this.inputConsulta.fill(id);
    await this.btnConsultar.click();
  }
}
