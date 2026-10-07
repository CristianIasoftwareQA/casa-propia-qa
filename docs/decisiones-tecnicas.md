# Decisiones técnicas

## 1. Idioma de Gherkin (Karate vs Playwright)

### Contexto
La prueba exige escenarios en lenguaje de negocio en español. Se evaluó usar `# language: es`
(keywords localizados) en ambos frameworks.

### Ambiente detectado
Java 11 (Corretto 11.0.32), Maven 3.9.11, Node 22.23.2, Windows 11, locale es_CO, encoding Cp1252.

### Incompatibilidad encontrada
Karate usa su propio parser de Gherkin (no el de Cucumber) y **no interpreta las palabras
estructurales localizadas** ni la directiva `# language: es`. La documentación oficial de Karate
usa exclusivamente keywords en inglés. playwright-bdd, en cambio, usa el parser estándar
`@cucumber/gherkin`, que sí soporta `# language: es`.

### Decisión adoptada
- **Playwright:** features completamente en español con `# language: es`
  (Característica/Antecedentes/Escenario/Dado/Cuando/Entonces/Y).
- **Karate:** keywords estructurales en inglés (Feature/Background/Scenario/Given/When/Then/And),
  manteniendo en español títulos, narrativa, comentarios, datos y nombres funcionales.

### Alternativas descartadas
- Migrar la capa API a Cucumber-JVM/REST Assured: contradice el requisito de usar Karate y añade
  complejidad; descartada.
- Forzar keywords en español en Karate: imposible, el parser no lo soporta.

### Impacto
Ninguno funcional. La narrativa de negocio permanece en español en ambos proyectos.

### Mitigación
Documentación y narrativa en español; keywords en inglés solo donde el framework lo exige.

### Conclusión
La narrativa funcional permanece en español en todo el repositorio. Decisión resuelta (no es un
TODO de contrato).

### Razón para Karate 1.4.1 con Java 11
Karate 1.4.1 es la última línea estable compatible con Java 11; Karate ≥1.5 exige JDK 17+. No se
usan versiones SNAPSHOT ni RC.

## 2. Codificación UTF-8

El sistema reporta Cp1252. Se fija en Maven `project.build.sourceEncoding=UTF-8`,
`project.reporting.outputEncoding=UTF-8`, `maven.compiler.release=11`, y en Surefire
`-Dfile.encoding=UTF-8`. En PowerShell: `$env:MAVEN_OPTS = "-Dfile.encoding=UTF-8"`.

## 3. Uso de adapters

Se separan el modelo interno de negocio (clientName/propertyValue/requestedAmount/termMonths) del
contrato real (cliente/valorVivienda/monto/plazoMeses) mediante adapters, tanto en Karate
(`solicitudes.js#aPayload`) como en Playwright (`credit-api.adapter.ts`, `credit-ui.adapter.ts`).

## 4. Mecanismos de simulación (contrato)

- RF05 (proveedor): se usa la cabecera por petición `X-Simulacion-Proveedor` cuando el escenario
  puede permanecer aislado (preferido en Karate), y la configuración global
  `PUT/GET /simulacion/proveedor` cuando el flujo real pasa por la UI (que no envía cabecera).
- Aislamiento de configuración global: escenarios marcados `@configuracionGlobal` restauran el
  proveedor a `normal` con teardown garantizado (Karate: `configure afterScenario`; Playwright:
  hook `After({ tags: '@configuracionGlobal' })`). Se ejecutan en serie (workers=1).
- RF06 (jornada): se activa con `X-Condicion-Atencion: jornada` en la consulta; no usa `demoraMs`
  ni la configuración del proveedor.

## 5. Concurrencia de la jornada (RF06)

La concurrencia real (5 asesores × 4 consultas = 20 concurrentes) se implementa con un helper Java
(`JornadaConcurrente`) usando `ExecutorService`/`invokeAll`, midiendo cada petición de forma
individual. No es una prueba de carga formal (no se usan JMeter/Gatling). La evidencia se escribe
antes de la assertion final.

## 6. Validación diferida de configuración

`CreditApiClient` no valida `API_BASE_URL` en su construcción; la valida en el primer método HTTP
(`requireConfiguredBaseUrl`). Así, la prueba estructural (que no llama a la red) no exige la URL,
pero las pruebas funcionales sí fallan claramente si falta.

## 7. Retries en cero localmente

`playwright.config.ts` usa `retries: 0` en local para no enmascarar inestabilidad. Evidencia:
`screenshot: only-on-failure`, `video: retain-on-failure`, `trace: on-first-retry`.

## 8. Exclusión de escenarios pendientes

Se usa `@pendienteContrato` solo para elementos sin respaldo. Con el contrato disponible, RF01-RF06
están implementados y NO llevan `@pendienteContrato`. La ejecución por defecto excluye ese tag.
