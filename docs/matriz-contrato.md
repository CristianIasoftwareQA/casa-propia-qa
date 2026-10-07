# Matriz de contrato (OpenAPI + condiciones de simulación)

Fuente: `Insumos_Cristian_Karate_Playwright/contrato/openapi.yaml` y `condiciones-simulacion.md`.
Base API: `http://localhost:3000/api` (o `http://localhost:4200/api` vía proxy).

## Operaciones

| Operación | Método | Ruta | Request | Código éxito | Códigos error | Respuesta | Estados | RF | Fuente |
|---|---|---|---|---|---|---|---|---|---|
| Salud | GET | `/salud` | — | 200 | — | `{estado,servicio,version}` | — | — | openapi.yaml |
| Registrar | POST | `/solicitudes` | `{cliente,valorVivienda,monto,plazoMeses}` | 201 | 400 DATOS_INVALIDOS | `Solicitud` | REGISTRADA | RF01 | openapi.yaml |
| Consultar | GET | `/solicitudes/{id}` | header opc. `X-Condicion-Atencion: normal\|jornada` | 200 | 400, 404 SOLICITUD_NO_ENCONTRADA | `Solicitud` | sin cambio | RF01/RF06 | openapi.yaml |
| Evaluar | POST | `/solicitudes/{id}/evaluacion` | header opc. `X-Simulacion-Proveedor: normal\|demora\|no-disponible` | 200 | 400, 404, 409 TRANSICION_NO_PERMITIDA, 503 PROVEEDOR_NO_DISPONIBLE | `Solicitud` | PREAPROBADA o RECHAZADA | RF02/RF05 | openapi.yaml |
| Registrar documentos | POST | `/solicitudes/{id}/documentos` | `{documentos:[CEDULA\|CERTIFICADO_INGRESOS\|AVALUO_VIVIENDA]}` (minItems 1) | 200 | 400 DATOS_INVALIDOS, 404, 409 TRANSICION_NO_PERMITIDA | `Solicitud` | sin cambio de estado | RF03 | openapi.yaml |
| Confirmar | POST | `/solicitudes/{id}/confirmacion` | — | 200 | 404, 409 TRANSICION_NO_PERMITIDA / DOCUMENTOS_INCOMPLETOS | `Solicitud` | CONFIRMADA | RF03 | openapi.yaml |
| Config proveedor (ver) | GET | `/simulacion/proveedor` | — | 200 | — | `{modo,demoraMs}` | — | RF05 | openapi.yaml |
| Config proveedor (set) | PUT | `/simulacion/proveedor` | `{modo,demoraMs?}` | 200 | 400 DATOS_INVALIDOS | `{modo,demoraMs}` | — | RF05 | openapi.yaml |

## Reglas de negocio (contrato)

- **Evaluación (RF02):** se preaprueba si `monto <= 80% * valorVivienda` (**límite inclusive**);
  si lo supera, `RECHAZADA` con `razonRechazo` general.
- **Confirmación (RF03):** requiere `PREAPROBADA` + los 3 documentos requeridos + no estar ya
  confirmada. Todo intento no permitido responde `409` y **no modifica** estado ni datos.
- **Documentos requeridos:** `CEDULA`, `CERTIFICADO_INGRESOS`, `AVALUO_VIVIENDA`.
- **Ciclo de vida:** REGISTRADA → (evaluación) → PREAPROBADA → (confirmación) → CONFIRMADA; o
  REGISTRADA → (evaluación) → RECHAZADA.

## Mecanismos de simulación (contrato)

| Mecanismo | Activación oficial | Efecto | RF |
|---|---|---|---|
| Demora del proveedor | header `X-Simulacion-Proveedor: demora` (por petición) o `PUT /simulacion/proveedor {modo:demora,demoraMs}` (global) | Evaluación responde 200 tras `demoraMs` (def. 4000, máx. 15000) | RF05 |
| Indisponibilidad | header `X-Simulacion-Proveedor: no-disponible` o `PUT {modo:no-disponible}` | Evaluación responde 503 PROVEEDOR_NO_DISPONIBLE; la solicitud no cambia | RF05 |
| Restaurar proveedor | header `X-Simulacion-Proveedor: normal` o `PUT {modo:normal}` | Evaluación normal (~150 ms) | RF05 |
| Jornada | header `X-Condicion-Atencion: jornada` en `GET /solicitudes/{id}` | Latencia variable; expectativa ≤800 ms, 19/20 | RF06 |

Nota: la demora/indisponibilidad desde la **interfaz** se activa con `PUT /simulacion/proveedor`
(config global), porque la UI no envía la cabecera `X-Simulacion-Proveedor`.
