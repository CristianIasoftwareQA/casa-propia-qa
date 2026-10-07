import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * Page Object de la evaluacion y de los avisos de simulacion del proveedor (RF05).
 * Textos confirmados en el frontend:
 *  - "Evaluando con el proveedor…"
 *  - "La evaluación está tardando más de lo habitual…"
 */
export class EvaluacionPage extends BasePage {
  readonly btnEvaluar: Locator;
  readonly evaluacionEnCurso: Locator;
  readonly avisoDemora: Locator;
  readonly alertaProveedor: Locator;
  readonly resultadoEvaluacion: Locator;

  constructor(page: Page) {
    super(page);
    this.btnEvaluar = page.getByRole('button', { name: 'Evaluar solicitud' });
    this.evaluacionEnCurso = page.getByTestId('evaluacion-en-curso');
    this.avisoDemora = page.getByTestId('aviso-demora');
    this.alertaProveedor = page.getByTestId('alerta-proveedor');
    this.resultadoEvaluacion = page.getByTestId('resultado-evaluacion');
  }

  async evaluar(): Promise<void> {
    await this.btnEvaluar.click();
  }
}
