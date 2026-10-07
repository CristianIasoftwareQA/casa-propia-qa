import { expect } from '@playwright/test';
import { When } from '../support/fixtures';

/**
 * Steps de confirmacion desde la interfaz (RF03/RF04).
 */

When('confirmo la solicitud desde la interfaz', async ({ confirmacionPage }) => {
  await expect(confirmacionPage.btnConfirmar).toBeVisible();
  await confirmacionPage.confirmar();
});
