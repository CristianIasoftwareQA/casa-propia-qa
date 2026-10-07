import { expect } from '@playwright/test';
import { parseMoney } from '../utils/money';
import {
  CreditRequestFactory,
  VALOR_VIVIENDA_BASE,
  MONTO_INFERIOR_AL_LIMITE,
} from '../data/credit-request.factory';
import { CreditRequestData } from '../models/credit-request.model';
import { Given, When, Then } from '../support/fixtures';

/**
 * Steps de la prueba ESTRUCTURAL.
 *
 * No navegan ni usan la red. Validan funciones locales (normalizacion y fabrica)
 * para confirmar que TypeScript + playwright-bdd + Playwright Test estan integrados.
 *
 * Se usa un contexto local por escenario (no se comparte estado mutable global).
 */

interface EstructuraContexto {
  valorTexto?: string;
  numeroResultante?: number;
  solicitud?: CreditRequestData;
}

const contextoPorTest = new WeakMap<object, EstructuraContexto>();

function ctx(testInfoKey: object): EstructuraContexto {
  let c = contextoPorTest.get(testInfoKey);
  if (!c) {
    c = {};
    contextoPorTest.set(testInfoKey, c);
  }
  return c;
}

Given('un valor monetario en texto {string}', async ({ $testInfo }, texto: string) => {
  ctx($testInfo).valorTexto = texto;
});

When('normalizo el valor monetario', async ({ $testInfo }) => {
  const c = ctx($testInfo);
  expect(c.valorTexto, 'El valor monetario debe haberse establecido').toBeDefined();
  c.numeroResultante = parseMoney(c.valorTexto as string);
});

Then('el número resultante es {int}', async ({ $testInfo }, esperado: number) => {
  const c = ctx($testInfo);
  expect(c.numeroResultante).toBe(esperado);
});

Given('que solicito una solicitud sintética inferior al límite', async ({ $testInfo }) => {
  ctx($testInfo).solicitud = CreditRequestFactory.inferiorAlLimite();
});

Then('la solicitud tiene un valor de vivienda de {int}', async ({ $testInfo }, esperado: number) => {
  const c = ctx($testInfo);
  expect(c.solicitud, 'La solicitud debe existir').toBeDefined();
  expect(c.solicitud!.propertyValue).toBe(esperado);
  // Confirma coherencia con la constante base.
  expect(esperado).toBe(VALOR_VIVIENDA_BASE);
});

Then('la solicitud tiene un monto solicitado de {int}', async ({ $testInfo }, esperado: number) => {
  const c = ctx($testInfo);
  expect(c.solicitud).toBeDefined();
  expect(c.solicitud!.requestedAmount).toBe(esperado);
  expect(esperado).toBe(MONTO_INFERIOR_AL_LIMITE);
});
