# Casa Propia — Automatización de pruebas (QA)

Automatización de pruebas para el sistema **Casa Propia** (solicitudes de crédito hipotecario):
API con **Karate 1.4.1 / Java 11 / Maven / JUnit 5** y recorridos de interfaz con
**Playwright + TypeScript + playwright-bdd** (Chromium).

## Arquitectura

```
casa-propia-qa/
├── api-karate/          Pruebas de API (Karate)
├── ui-playwright-bdd/   Recorridos UI E2E (Playwright + playwright-bdd)
├── docs/                Estrategia, matrices, hallazgos, decisiones
├── evidence/            Evidencia (jornada Karate, artefactos Playwright)
└── Insumos_.../         Backend (NestJS), frontend (Angular), contrato (OpenAPI)
```

- **Karate** valida reglas de negocio e invariantes vía API (base `http://localhost:3000/api`).
- **Playwright** ejecuta los recorridos del asesor en la UI (`http://localhost:4200`) y compara
  contra la API.

## Requisitos

- Java 11, Maven 3.9+, Node 20+/22, npm 10+. Backend en `:3000` y frontend en `:4200` en ejecución.

## Variables de entorno

| Variable | Uso | Valor local |
|---|---|---|
| UI_BASE_URL | URL del frontend (Playwright) | http://localhost:4200 |
| API_BASE_URL | URL de la API (Karate y Playwright) | http://localhost:3000/api |
| TEST_TIMEOUT / EXPECT_TIMEOUT / WORKERS | Playwright | opcionales |

## Ejecución

> Antes de empezar: ten el **backend en `:3000`** y el **frontend en `:4200`** corriendo.
> Los comandos son para **PowerShell** (Windows). Ejecuta cada bloque desde la carpeta indicada.

### 1. Karate (API)

```powershell
cd api-karate

# Variables de entorno de la sesión (una vez por terminal)
$env:MAVEN_OPTS   = "-Dfile.encoding=UTF-8"
$env:API_BASE_URL = "http://localhost:3000/api"

# Suite COMPLETA (estructural + RF01-RF06) en una sola pasada  ← recomendado
mvn clean test
```

Opcionales (solo para depurar una parte):

```powershell
mvn clean test -Dtest=StructuralTestRunner    # solo estructural (no requiere backend)
mvn clean test -Dtest=WorkloadTestRunner      # solo jornada (RF06)
```

Notas importantes:
- `mvn clean test` usa el runner único `AllTestRunner` y corre todo de una vez. El reporte sale
  **completo** porque no se mezclan ejecuciones.
- La build **no se detiene** ante fallos (`testFailureIgnore=true`): verás `BUILD FAILURE` al final
  pero los 33 escenarios se ejecutaron y el reporte queda completo. Es el comportamiento esperado:
  RF02, RF03 y RF06 fallan a propósito (defectos del producto, ver más abajo).
- **No** ejecutes un runner suelto (`-Dtest=WorkloadTestRunner`…) *después* de `mvn clean test`:
  Karate sobrescribe el reporte y verías solo ese feature. Si lo hiciste, vuelve a correr
  `mvn clean test`.

### 2. Playwright (UI)

```powershell
cd ui-playwright-bdd

# Instalación (solo la primera vez)
npm ci
npx playwright install chromium

# Variables de entorno de la sesión (una vez por terminal)
$env:UI_BASE_URL  = "http://localhost:4200"
$env:API_BASE_URL = "http://localhost:3000/api"

# Suite COMPLETA (regenera el index al terminar, por el hook posttest)
npm test

# Ver el reporte navegable
npm run test:report
```

Opcionales:

```powershell
npm run typecheck            # chequeo de tipos
npm run test:structural      # solo estructural (no requiere backend/frontend)
npm run test:headed          # ver el navegador durante la ejecución
```

### 3. Reporte consolidado (index con PDF y casos por RF)

**No requiere pasos manuales:** `mvn clean test` (Karate) y `npm test` (Playwright) regeneran el
index automáticamente al terminar. Solo abre `reports/dist/index.html`.

Si quisieras regenerarlo a mano (por ejemplo tras editar el generador):

```powershell
node reports/generar-reportes.mjs       # desde la raíz del repo
```

El index agrupa los casos por requisito (RF01-RF06), marca pasados/fallidos y enlaza los
reportes navegables, los PDF y la evidencia de jornada. Si detecta que un reporte quedó más
reciente que el index, muestra un aviso para que lo regeneres.

## Reportes y evidencia

Cada prueba genera evidencia del paso a paso y muestra el proceso del caso Gherkin:

- **Karate**: `api-karate/target/karate-reports/karate-summary.html`. Un HTML por feature con
  cada escenario Gherkin (Given/When/Then) y el request/response de cada paso.
- **Playwright**: `ui-playwright-bdd/playwright-report/index.html`. Captura por paso, video y
  **traza navegable (timeline)** de cada recorrido — configurado `screenshot/video/trace: on`,
  es decir en TODAS las pruebas, no solo ante fallo. Cada escenario adjunta además
  `contexto-escenario.json`.
- **Jornada (RF06)**: `evidence/karate/jornada-<timestamp>.txt`.

### Reporte consolidado (index + PDF)

El generador (`reports/generar-reportes.mjs`, ver paso 3 de Ejecución) crea `reports/dist/index.html`
y un PDF por suite, reutilizando el Chromium de Playwright. Opciones:

```powershell
node reports/generar-reportes.mjs                 # ambas suites
node reports/generar-reportes.mjs --only karate   # solo API tras un debug puntual
node reports/generar-reportes.mjs --only playwright
```

Es incremental: regenera solo la suite con reporte nuevo (o la indicada con `--only`) y conserva
la otra, anotando la fecha de cada una. `npm test` de Playwright ya lo ejecuta al terminar
(hook `posttest`). Salida en `reports/dist/` (ignorada por git).

## Estado de RF01-RF06 (según ejecución real)

| RF | Estado | Nota |
|---|---|---|
| RF01 Registro y consulta | APROBADO | 14/14 Karate |
| RF02 Evaluación | FALLIDO POR DEFECTO en 80% exacto | HALL-001 |
| RF03 Confirmación | FALLIDO POR DEFECTO en re-confirmación | HALL-002 |
| RF04 Recorridos UI | APROBADO | 4 recorridos Playwright |
| RF05 Continuidad | APROBADO | demora + indisponibilidad + recuperación |
| RF06 Jornada | FUNCIONAL OK / TEMPORAL FALLIDO (18/20) | HALL-RF06-001 |

Las pruebas RF02, RF03 y RF06 **fallan intencionalmente** porque exponen defectos reales del
producto respaldados por el contrato. No se debilitaron las aserciones. Ver `docs/hallazgos.md` y
`docs/decision-liberacion.md`.

## Contrato

El contrato ya está incorporado: endpoints, estados, códigos de error y mecanismos de simulación
están resueltos a partir de `Insumos_Cristian_Karate_Playwright/contrato/`. La referencia
consolidada está en `docs/matriz-contrato.md`. No quedan endpoints, estados ni selectores
inventados; la única variabilidad técnica a vigilar son los timestamps, ya excluidos de la
comparación de negocio.
