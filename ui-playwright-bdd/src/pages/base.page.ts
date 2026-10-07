import { Page } from '@playwright/test';
import { requireUiBaseUrl } from '../support/environment';

/**
 * Page Object base. Contiene utilidades comunes de navegacion.
 * No contiene reglas de negocio.
 */
export class BasePage {
  constructor(protected readonly page: Page) {}

  /** Abre la aplicacion en la URL base (UI_BASE_URL). */
  async abrir(): Promise<void> {
    const base = requireUiBaseUrl();
    await this.page.goto(base);
  }
}
