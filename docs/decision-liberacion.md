# Decisión de liberación

Fecha: 2026-10-06. Basada en ejecución real contra el ambiente local (backend 1.4.0).

## Resultado general

- RF01 Registro y consulta: APROBADO.
- RF02 Evaluación: APROBADO excepto el límite inclusivo del 80% (**FALLIDO POR DEFECTO**, HALL-001).
- RF03 Confirmación: APROBADO excepto la re-confirmación de una solicitud CONFIRMADA
  (**FALLIDO POR DEFECTO**, HALL-002).
- RF04 Recorridos UI: APROBADO (confirmado, rechazado, demora, indisponibilidad+recuperación).
- RF05 Continuidad: APROBADO (demora y recuperación; estado y datos conservados).
- RF06 Jornada: funcional APROBADO (20/20), temporal **FALLIDO POR INCUMPLIMIENTO TEMPORAL**
  (18/20 ≤ 800 ms), HALL-RF06-001. RF06 global NO APROBADO.

## Riesgos bloqueantes (según criterios de liberación)

1. **HALL-001 — 80% exacto rechazado (RF02).** Afecta directamente la regla de negocio central.
   Criterio listado: "Rechazar el 80% exacto" y "Preaprobar por encima del 80%".
2. **HALL-002 — re-confirmación posible (RF03).** Criterio listado: "Confirmar una segunda vez".
3. **HALL-RF06-001 — criterio de jornada incumplido (RF06).** Criterio listado: "Incumplir el
   criterio de jornada".

## Riesgos no bloqueantes

- **HALL-004 — presentación del monto en el resumen CONFIRMADA.** Defecto visual de severidad baja.

## Evidencias

- Karate: `api-karate/target/karate-reports/` (RF01-RF06), evidencia de jornada en
  `evidence/karate/jornada-<timestamp>.txt`.
- Playwright: `ui-playwright-bdd/playwright-report/` y `test-results/` (screenshots/video/trace
  solo ante fallo), adjunto `contexto-escenario.json` ante fallo.

## Pendientes

- Ninguno a nivel de automatización estructural: todas las suites compilan y ejecutan.
- Pendiente del lado del producto: corrección de HALL-001, HALL-002 y evaluación de HALL-RF06-001.

## Decisión

**NO LIBERAR** en el estado actual. Existen tres defectos potencialmente bloqueantes confirmados
con evidencia real (HALL-001, HALL-002, HALL-RF06-001). La automatización no fue ajustada para
ocultarlos: las pruebas correspondientes fallan de forma intencional y trazable.

## Justificación

La decisión se basa en evidencia de ejecución, no en suposiciones. Los defectos tocan la regla de
negocio del 80% (límite inclusivo), la invariante de transición de confirmación y el criterio de
servicio de la jornada, todos listados como potencialmente bloqueantes. Una vez corregidos en el
producto, se re-ejecutan RF02, RF03 y RF06 para reevaluar la liberación.
