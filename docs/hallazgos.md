# Hallazgos

Clasificación: PRODUCTO (el esperado está respaldado por el contrato pero el sistema se
comporta distinto), AUTOMATIZACIÓN, DATOS, AMBIENTE, CONTRATO AMBIGUO.

Los hallazgos de automatización ya corregidos se listan al final como referencia.

---

## HALL-001 — El límite del 80% no es inclusivo en la evaluación

- **ID:** HALL-001
- **Título:** Una solicitud cuyo monto equivale exactamente al 80% del valor de la vivienda queda RECHAZADA
- **Requisito:** RF02 (evaluación)
- **Precondiciones:** Solicitud REGISTRADA con valorVivienda=100000000 y monto=80000000.
- **Datos:** cliente sintético QA-AUTO-…, plazo 180.
- **Pasos:** registrar → evaluar.
- **Resultado esperado (contrato):** PREAPROBADA. El contrato indica: "se preaprueba si
  `monto <= 80 % de valorVivienda` (límite **inclusive**)".
- **Resultado obtenido:** RECHAZADA con razón general. Verificado en vivo y por Karate.
- **Causa raíz (código):** `solicitudes.service.ts`: `monto * 100 < valorVivienda * 80` usa
  estrictamente `<` en lugar de `<=`.
- **Impacto:** Clientes en el límite exacto permitido son rechazados indebidamente. Criterio de
  liberación potencialmente bloqueante ("Rechazar el 80% exacto").
- **Evidencia:** Fallo real en `features/evaluacion/evaluacion-credito.feature`, escenario
  "...equivale exactamente al ochenta por ciento"; reportes Karate en `target/karate-reports/`.
- **Reproducibilidad:** Reproducible en todas las ejecuciones observadas (determinístico).
- **Clasificación:** PRODUCTO.

## HALL-002 — Una solicitud CONFIRMADA puede confirmarse de nuevo (200 en vez de 409)

- **ID:** HALL-002
- **Título:** La segunda confirmación de una solicitud CONFIRMADA responde 200 y actualiza confirmadaEn
- **Requisito:** RF03 (confirmación)
- **Precondiciones:** Solicitud CONFIRMADA (preaprobada + 3 documentos + confirmada una vez).
- **Pasos:** confirmar de nuevo la misma solicitud.
- **Resultado esperado (contrato):** 409 TRANSICION_NO_PERMITIDA; el ejemplo `yaConfirmada` del
  OpenAPI lo define explícitamente; "Una solicitud CONFIRMADA no puede volver a confirmarse".
- **Resultado obtenido:** HTTP 200; el estado permanece CONFIRMADA pero `confirmadaEn`/`actualizadaEn`
  se re-escriben. Verificado en vivo y por Karate.
- **Causa raíz (código):** `confirmar()` permite el paso cuando el estado es `CONFIRMADA`
  (`estado !== 'PREAPROBADA' && estado !== 'CONFIRMADA'`), por lo que re-confirma de forma idempotente.
- **Impacto:** Confirmación duplicada posible; viola la invariante de transición. Criterio de
  liberación potencialmente bloqueante ("Confirmar una segunda vez").
- **Evidencia:** Fallo real en `features/confirmacion/confirmacion-credito.feature`, escenario
  "No confirmar nuevamente una solicitud ya confirmada".
- **Reproducibilidad:** Reproducible en todas las ejecuciones observadas (determinístico).
- **Clasificación:** PRODUCTO.

## HALL-RF06-001 — La jornada de 20 consultas incumple el criterio de 19/20 ≤ 800 ms

- **ID:** HALL-RF06-001
- **Título:** La jornada de veinte consultas concurrentes incumple el criterio de 19 respuestas dentro de 800 ms
- **Requisito:** RF06 (jornada de atención)
- **Precondiciones:** Una solicitud creada por la suite; 5 asesores lógicos × 4 consultas = 20
  consultas concurrentes a `GET /solicitudes/{id}` con `X-Condicion-Atencion: jornada`.
- **Resultado esperado (contrato):** 20 respuestas con datos correctos y al menos 19 de 20 con
  duración ≤ 800 ms.
- **Resultado observado:** 20/20 respuestas funcionalmente correctas; **18/20 ≤ 800 ms** (2 > 800 ms);
  `serviceCriterionMet = false`.
- **Impacto:** Incumplimiento del criterio temporal de servicio. Criterio de liberación
  potencialmente bloqueante ("Incumplir el criterio de jornada").
- **Evidencia:** `evidence/karate/jornada-<timestamp>.txt` (se escribe ANTES de la assertion).
  La prueba `WorkloadTestRunner` termina en BUILD FAILURE por la assertion `within800ms >= 19`.
- **Reproducibilidad:** Observado en 2 ejecuciones (ambas 18/20). No se declara "siempre" con una
  sola corrida; con 2 corridas confirmadas el patrón es consistente.
- **Clasificación:** PRODUCTO / rendimiento contractual, con componente de AMBIGÜEDAD CONTRACTUAL:
  el perfil de latencia simulado del backend incluye un valor (~940 ms) por cada 10 consultas de un
  mismo id; con 20 consultas sobre una única solicitud se producen ~2 valores > 800 ms, por lo que el
  propio simulador no puede satisfacer el SLA 19/20 bajo la lectura literal "una solicitud, 20
  consultas". El comportamiento esperado se mantiene según el criterio contractual (19/20); la prueba
  automatizada FALLA mientras no se cumpla. No se usó el conocimiento del perfil interno para forzar
  un verde.

## HALL-004 (menor) — El resumen CONFIRMADA muestra el valor de vivienda en el campo "Monto solicitado"

- **ID:** HALL-004
- **Título:** En el resumen de crédito confirmado, "Monto solicitado" muestra el valor de la vivienda
- **Requisito:** RF04 (interfaz)
- **Precondiciones:** Solicitud CONFIRMADA, vista de resumen.
- **Resultado esperado:** El campo "Monto solicitado" muestra `monto`.
- **Resultado obtenido:** Muestra `pesos(valorVivienda)` (ver `app.html`, bloque CONFIRMADA:
  `detalle-monto` = `pesos(s.valorVivienda)`).
- **Impacto:** Inconsistencia visual menor en la pantalla de resumen; no afecta datos de API.
- **Clasificación:** PRODUCTO (defecto de presentación, severidad baja).
- **Nota de automatización:** por este motivo el recorrido confirmado compara UI vs API usando
  identificador, cliente, plazo y estado (campos no afectados) más la verificación de documentos
  completos por API, evitando una comparación sobre un campo con defecto de presentación.

---

## Fallos de automatización detectados y corregidos (no son defectos de producto)

- **AUTO-01:** `selectOption('180')` fallaba por timeout. Causa: el `<select>` Angular usa
  `[ngValue]` (no fija `value=numero`). Corregido seleccionando por etiqueta `"180 meses"`.
- **AUTO-02:** Aserción de aviso de demora usaba el texto con elipsis `…`; el DOM real dice
  "La evaluación está tardando más de lo habitual. No cierres esta pantalla." Corregido usando el
  prefijo estable con `toContainText`.
- **AUTO-03:** Acceso `ev.response` en helpers Karate; se expuso `respuesta` explícitamente.
- **AUTO-04:** Header `X-Condicion-Atencion`/`X-Simulacion-Proveedor` enviado con valor nulo
  producía 400; se omite el header cuando no aplica.
- **AUTO-05:** Validación de `API_BASE_URL` adelantada rompía la prueba estructural; se difirió al
  primer uso HTTP del `CreditApiClient`.
