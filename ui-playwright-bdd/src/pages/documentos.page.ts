import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';
import { TipoDocumento } from '../api/credit-api.client';

/**
 * Page Object del registro de documentos.
 * Los checkboxes usan data-testid existentes del frontend: chk-<TIPO>.
 */
export class DocumentosPage extends BasePage {
  readonly btnRegistrarDocumentos: Locator;
  readonly listaDocumentos: Locator;

  constructor(page: Page) {
    super(page);
    this.btnRegistrarDocumentos = page.getByTestId('btn-registrar-documentos');
    this.listaDocumentos = page.getByTestId('lista-documentos');
  }

  private checkbox(doc: TipoDocumento): Locator {
    return this.page.getByTestId(`chk-${doc}`);
  }

  /** Marca los documentos indicados (solo los que esten disponibles) y los registra. */
  async registrarDocumentos(docs: TipoDocumento[]): Promise<void> {
    for (const d of docs) {
      const chk = this.checkbox(d);
      if (await chk.count()) {
        await chk.check();
      }
    }
    await this.btnRegistrarDocumentos.click();
  }
}
