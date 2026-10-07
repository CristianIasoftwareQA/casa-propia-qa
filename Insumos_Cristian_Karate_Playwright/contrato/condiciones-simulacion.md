# Condiciones de simulación

La aplicación simula dos condiciones externas. Ninguna requiere herramientas adicionales: se activan con cabeceras HTTP o con un endpoint de configuración.

## 1. Proveedor de evaluación (RF05)

La evaluación (`POST /api/solicitudes/{id}/evaluacion`) consulta a un proveedor externo simulado.

| Modo | Comportamiento del proveedor | Respuesta de la API |
|---|---|---|
| `normal` | Responde en ~150 ms | `200` con la solicitud evaluada |
| `demora` | Responde después de `demoraMs` (por defecto 4000 ms, máximo 15000 ms) | `200` con la solicitud evaluada, con demora |
| `no-disponible` | Falla en ~300 ms | `503 PROVEEDOR_NO_DISPONIBLE`; la solicitud **no se modifica** |

Formas de activarlo:

- **Por petición (API):** cabecera `X-Simulacion-Proveedor: normal | demora | no-disponible`. Solo afecta esa petición. Para el modo `demora` usa el `demoraMs` de la configuración global.
- **Global (API e interfaz):** `PUT /api/simulacion/proveedor` con `{ "modo": "...", "demoraMs": 4000 }`. Afecta todas las evaluaciones que no envíen la cabecera, incluidas las que hace la pantalla del asesor. Consulta la configuración vigente con `GET /api/simulacion/proveedor`.

> La configuración global es compartida. Si ejecutas suites en paralelo, ten en cuenta que un cambio global afecta a las demás; vuelve a `normal` al terminar.

### Lo que ve el asesor en la pantalla

- Mientras la evaluación está en curso: mensaje "Evaluando con el proveedor…".
- Si tarda más de 2 segundos: aviso adicional "La evaluación está tardando más de lo habitual…".
- Si el proveedor no está disponible: alerta indicando que la solicitud no fue modificada y que puede reintentar. El botón **Evaluar solicitud** sigue disponible para reintentar.
- La interfaz deja de esperar a los 20 segundos.

## 2. Condición *jornada* (RF06)

Simula una jornada de atención con varios asesores consultando al mismo tiempo.

- Se activa enviando la cabecera `X-Condicion-Atencion: jornada` en `GET /api/solicitudes/{id}`.
- Sin la cabecera (o con `normal`) la consulta no tiene latencia simulada.
- La latencia es variable y no se configura.

**Expectativa de servicio:** cada consulta debe responder en **800 ms o menos**; en una jornada de 20 consultas (5 asesores × 4 consultas) al menos **19 de 20** deben cumplirlo, y cada respuesta debe traer los datos correctos de la solicitud.

## Datos

- Todo vive en memoria. Reiniciar el backend borra las solicitudes y reinicia la numeración (`SOL-000001`, …) y la configuración del proveedor (`normal`).
- No hay datos precargados: cada suite debe crear sus propias solicitudes.
