# Matriz de trazabilidad

Estados: APROBADO, FALLIDO POR DEFECTO, FALLIDO POR INCUMPLIMIENTO TEMPORAL, PENDIENTE.
Evidencia: reportes Karate en `api-karate/target/karate-reports/`, reporte Playwright en
`ui-playwright-bdd/playwright-report/`, evidencia de jornada en `evidence/karate/`.

| RF | Regla | Riesgo | Feature | Escenario | Capa | Endpoint / Pantalla | Prioridad | Estado | Resultado |
|---|---|---|---|---|---|---|---|---|---|
| RF01 | Registro válido y consulta conserva datos | P1 | registro-consulta | Registrar válida y recuperar por id | API | POST /solicitudes, GET /solicitudes/{id} | Alta | APROBADO | 14/14 Karate |
| RF01 | Cliente obligatorio | P1 | registro-consulta | Cliente ausente / vacío | API | POST /solicitudes | Alta | APROBADO | 400 DATOS_INVALIDOS |
| RF01 | Importes enteros positivos | P1 | registro-consulta | valor/monto cero, negativo, decimal | API | POST /solicitudes | Alta | APROBADO | 400 DATOS_INVALIDOS |
| RF01 | Plazos permitidos | P2 | registro-consulta | 120/180/240 y plazo inválido | API | POST /solicitudes | Media | APROBADO | 201 / 400 |
| RF01 | Entrada inválida no crea solicitud | P1 | registro-consulta | Sin id en respuesta de error | API | POST /solicitudes | Alta | APROBADO | id no presente |
| RF02 | Preaprobar < 80% | P0 | evaluacion-credito | 79% preaprobado | API | POST .../evaluacion | Crítica | APROBADO | PREAPROBADA |
| RF02 | **Preaprobar = 80% inclusive** | P0 | evaluacion-credito | 80% exacto | API | POST .../evaluacion | Crítica | **FALLIDO POR DEFECTO** | HALL-001 (RECHAZADA) |
| RF02 | Rechazar > 80% + razón | P0 | evaluacion-credito | 80%+1 rechazado | API | POST .../evaluacion | Crítica | APROBADO | RECHAZADA + razón |
| RF02 | Persistencia del estado | P1 | evaluacion-credito | Persistir preaprobado | API | GET /solicitudes/{id} | Alta | APROBADO | persiste |
| RF02 | No re-evaluar | P2 | evaluacion-credito | Segunda evaluación 409 | API | POST .../evaluacion | Media | APROBADO | 409 |
| RF03 | Confirmación permitida | P0 | confirmacion-credito | Preaprobada + docs completos | API | POST .../confirmacion | Crítica | APROBADO | CONFIRMADA |
| RF03 | No confirmar REGISTRADA | P0 | confirmacion-credito | Registrada → 409, sin cambios | API | POST .../confirmacion | Crítica | APROBADO | 409 + sin cambios |
| RF03 | No confirmar RECHAZADA | P0 | confirmacion-credito | Rechazada → 409, sin cambios | API | POST .../confirmacion | Crítica | APROBADO | 409 + sin cambios |
| RF03 | No confirmar docs incompletos | P0 | confirmacion-credito | Preaprobada incompleta → 409 | API | POST .../confirmacion | Crítica | APROBADO | 409 DOCUMENTOS_INCOMPLETOS |
| RF03 | **No re-confirmar CONFIRMADA** | P0 | confirmacion-credito | Segunda confirmación | API | POST .../confirmacion | Crítica | **FALLIDO POR DEFECTO** | HALL-002 (200) |
| RF05 | Evaluación normal (cabecera) | P1 | continuidad-proveedor | Normal por cabecera | API | POST .../evaluacion | Alta | APROBADO | 200 PREAPROBADA |
| RF05 | Demora por cabecera | P1 | continuidad-proveedor | Demora responde 200 | API | POST .../evaluacion | Alta | APROBADO | 200 |
| RF05 | Demora global + cleanup | P1 | continuidad-proveedor | Demora global 4000 ms | API | PUT /simulacion/proveedor | Alta | APROBADO | 200 + restaurado |
| RF05 | Indisponibilidad conserva estado | P0 | continuidad-proveedor | 503, snapshot sin cambios | API | POST .../evaluacion | Crítica | APROBADO | 503 + sin cambios |
| RF05 | Recuperación continúa | P0 | continuidad-proveedor | Restaurar y reintentar | API | POST .../evaluacion | Crítica | APROBADO | 200 PREAPROBADA |
| RF06 | 20 respuestas correctas (funcional) | P1 | jornada-consultas | Jornada 5×4 concurrente | API | GET /solicitudes/{id} (jornada) | Alta | APROBADO | 20/20 válidas |
| RF06 | **19/20 ≤ 800 ms (temporal)** | P0 | jornada-consultas | Jornada 5×4 concurrente | API | GET /solicitudes/{id} (jornada) | Crítica | **FALLIDO POR INCUMPLIMIENTO TEMPORAL** | HALL-RF06-001 (18/20) |
| RF04 | Recorrido confirmado + comparación UI/API | P0 | solicitud-confirmada | E2E confirmado | UI+API | Pantalla asesor + API | Crítica | APROBADO | 1/1 Playwright |
| RF04 | Recorrido rechazado | P0 | solicitud-rechazada | Rechazo visible + razón | UI | Pantalla asesor | Crítica | APROBADO | 1/1 Playwright |
| RF04/RF05 | Demora visible UI | P1 | continuidad-proveedor | Avisos de demora | UI+API | Pantalla asesor | Alta | APROBADO | 1/1 Playwright |
| RF04/RF05 | Indisponibilidad + recuperación UI | P0 | continuidad-proveedor | Alerta + snapshot + reintento | UI+API | Pantalla asesor | Crítica | APROBADO | 1/1 Playwright |
| — | Estructural API | — | structural/estructura | Karate+JUnit integrados | API | — | — | APROBADO | 3/3 |
| — | Estructural UI | — | features/estructura | TS+bdd+PW integrados | UI | — | — | APROBADO | 2/2 |

## Nota sobre RF06

RF06 se evalúa en dos dimensiones separadas:
- **Corrección funcional:** APROBADO (20/20 respuestas con datos correctos).
- **Cumplimiento temporal:** FALLIDO POR INCUMPLIMIENTO TEMPORAL (18/20 ≤ 800 ms; requiere ≥ 19/20).

**RF06 global: NO APROBADO** mientras `serviceCriterionMet` sea false. Riesgo abierto y
potencialmente bloqueante (ver `decision-liberacion.md`).
