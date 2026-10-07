# API — Karate 1.4.1

Pruebas de API de Casa Propia con **Karate 1.4.1**, **Java 11**, **Maven** y **JUnit 5**.

## Decisión de idioma

Karate no interpreta Gherkin localizado: los keywords estructurales van en **inglés**
(Feature/Background/Scenario/Given/When/Then/And) y la **narrativa, títulos, comentarios, datos y
nombres** van en español. Ver `docs/decisiones-tecnicas.md`. (Playwright sí usa `# language: es`.)

## Versiones

- Karate 1.4.1 (última línea estable compatible con Java 11; ≥1.5 requiere JDK 17+).
- JUnit 5 (jupiter 5.10.2). Surefire 3.2.5. Compiler release 11. UTF-8 explícito.

## Estructura

```
src/test/java/
├── karate-config.js        Config central: base URL, rutas, timeouts, documentos requeridos
├── runners/                AllTestRunner, StructuralTestRunner, WorkloadTestRunner
├── structural/             estructura.feature (@structural, sin red)
├── features/               RF01 registro, RF02 evaluacion, RF03 confirmacion, RF05 continuidad, RF06 jornada
├── helpers/                crear/consultar/evaluar/registrar-documentos/confirmar + proveedor (configurar/consultar/restaurar)
├── jornada/                JornadaConcurrente.java (concurrencia real RF06)
├── data/                   solicitudes.js (fábrica + aPayload), estados.js, schemas.js
└── utils/                  normalizer.js (comparación de negocio antes/después)
```

## Tags

`@structural @smoke @regresion @negativo @frontera @critico @continuidad @jornada @configuracionGlobal`
y `@rf01..@rf06`, `@api`. La ejecución por defecto excluye `@pendienteContrato`.

## Runners

- `AllTestRunner` — toda la suite en una pasada (por defecto en `mvn test`).
- `StructuralTestRunner` — solo estructural, no requiere API_BASE_URL.
- `WorkloadTestRunner` — solo jornada RF06 (`@jornada`).

## Configuración

`API_BASE_URL` se lee por propiedad del sistema o variable de entorno (por defecto
`http://localhost:3000/api`). Los escenarios `@configuracionGlobal` restauran el proveedor a
`normal` con teardown garantizado (`configure afterScenario`).

## Reportes

`target/karate-reports/karate-summary.html`. Evidencia de jornada en `../evidence/karate/`.

## Comandos

```
$env:MAVEN_OPTS = "-Dfile.encoding=UTF-8"
mvn clean test                           # toda la suite (AllTestRunner)
mvn test -Dtest=StructuralTestRunner     # solo estructural
mvn test -Dtest=WorkloadTestRunner       # solo jornada (RF06)
```

## Resultados conocidos

RF01 y RF05: APROBADOS. RF02 (80% exacto) y RF03 (re-confirmación): FALLIDO POR DEFECTO. RF06:
funcional OK, temporal FALLIDO (18/20). Ver `docs/hallazgos.md`.
