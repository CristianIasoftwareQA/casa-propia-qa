import { expect } from '@playwright/test';
import { When, Then } from '../support/fixtures';

/**
 * Steps de evaluacion desde la interfaz y de los avisos de simulacion (RF05).
 * Se usan assertions web-first; no se usan esperas fijas.
 */

When('evalúo la solicitud desde la interfaz', async ({ evaluacionPage }) => {
  await evaluacionPage.evaluar();
});

When('reintento la evaluación desde la interfaz', async ({ evaluacionPage }) => {
  await evaluacionPage.evaluar();
});

Then('la interfaz muestra una razón general del rechazo', async ({ confirmacionPage }) => {
  await expect(confirmacionPage.razonRechazo).toBeVisible();
  const texto = (await confirmacionPage.razonRechazo.innerText()).trim();
  expect(texto.length).toBeGreaterThan(0);
});

Then('no aparece la acción de confirmar el crédito', async ({ confirmacionPage }) => {
  // El boton de confirmar solo existe si la solicitud esta PREAPROBADA.
  await expect(confirmacionPage.btnConfirmar).toHaveCount(0);
});

Then('la acción de evaluar sigue disponible', async ({ evaluacionPage }) => {
  await expect(evaluacionPage.btnEvaluar).toBeVisible();
  await expect(evaluacionPage.btnEvaluar).toBeEnabled();
});

// --- Avisos de demora (textos confirmados en el frontend) ---

Then('la interfaz muestra el aviso {string}', async ({ evaluacionPage }, texto: string) => {
  // Diferencia entre el aviso "en curso" y el aviso de demora por su contenido.
  if (texto.startsWith('Evaluando')) {
    await expect(evaluacionPage.evaluacionEnCurso).toContainText(texto);
  } else {
    await expect(evaluacionPage.avisoDemora).toContainText(texto);
  }
});

Then('la evaluación finaliza y la interfaz muestra la solicitud como preaprobada', async ({ confirmacionPage, evaluacionPage }) => {
  // El indicador de evaluacion en curso desaparece y el estado pasa a Preaprobada.
  await expect(evaluacionPage.evaluacionEnCurso).toHaveCount(0);
  await expect(confirmacionPage.estadoSolicitud).toHaveText('Preaprobada');
});

Then('la interfaz muestra una alerta de proveedor no disponible', async ({ evaluacionPage }) => {
  await expect(evaluacionPage.alertaProveedor).toBeVisible();
  const texto = (await evaluacionPage.alertaProveedor.innerText()).toLowerCase();
  // Validacion minima respaldada por el frontend: indisponibilidad + no modificada + reintento.
  expect(texto).toContain('no está disponible');
  expect(texto).toContain('no fue modificada');
  expect(texto.includes('intenta') || texto.includes('reintent')).toBe(true);
});
