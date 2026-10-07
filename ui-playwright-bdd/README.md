# UI — Playwright + playwright-bdd

Recorridos E2E de Casa Propia con **Playwright Test**, **TypeScript estricto** y **playwright-bdd**
(Gherkin en español). Único navegador: **Chromium**.

## Stack

- Node 20+/22, @playwright/test 1.48.2, playwright-bdd 7.5.0, TypeScript 5.5.
- Features en español con `# language: es`.

## Generación BDD

`playwright-bdd` genera los tests en `.features-gen/` a partir de `features/**/*.feature` y los
steps/fixtures/hooks en `src/`. El comando `bddgen` corre antes de `playwright test`.

## Estructura

```
features/                  estructura, solicitud-confirmada, solicitud-rechazada, continuidad-proveedor
src/
├── steps/                 estructura, comunes, evaluacion, documentos, confirmacion, continuidad
├── pages/                 base, solicitud, evaluacion, documentos, confirmacion (Page Objects)
├── api/                   credit-api.client.ts (incluye config de proveedor RF05)
├── adapters/              credit-api.adapter.ts, credit-ui.adapter.ts
├── models/                credit-request, credit-response, test-context, jornada
├── data/                  credit-request.factory.ts (14 variantes sintéticas)
├── support/               fixtures.ts (ctx/api/pages), hooks.ts (evidencia + restaurar proveedor), environment.ts
└── utils/                 money.ts, comparisons.ts, evidence.ts
```

## Localizadores

Se prefieren `getByRole`/`getByLabel`. Se usan `data-testid` **existentes** del frontend
(`testIdAttribute: 'data-testid'`). No se inventan selectores, no se usa XPath ni `nth()`, no se
usa `waitForTimeout`; se usan assertions web-first.

## Evidencia

`screenshot: only-on-failure`, `video: retain-on-failure`, `trace: on-first-retry`. Ante fallo se
adjunta `contexto-escenario.json` (ID, datos, resultados API/UI, mensajes).

## Variables de entorno

`UI_BASE_URL`, `API_BASE_URL`, `TEST_TIMEOUT`, `EXPECT_TIMEOUT`, `WORKERS` (ver `.env.example`).
La prueba estructural NO requiere URLs (validación diferida en el cliente API).

## Comandos

```
npm ci
npx playwright install chromium
npm run typecheck
npm run bddgen
npm run test:structural
npm test              # excluye @pendienteContrato
npm run test:headed
npm run test:debug
npm run test:report
```

Los escenarios `@configuracionGlobal` (demora/indisponibilidad) usan la configuración global del
proveedor y se ejecutan con `--workers=1`; el hook `After` restaura el proveedor a `normal`.

## Resultados conocidos

Estructural, solicitud confirmada, solicitud rechazada, demora e indisponibilidad+recuperación:
APROBADOS. Ver `docs/hallazgos.md` y `docs/matriz-trazabilidad.md`.
