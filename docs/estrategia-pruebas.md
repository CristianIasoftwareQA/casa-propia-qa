# Estrategia de pruebas — Casa Propia

## Objetivo
Verificar el registro, consulta, evaluación y confirmación de solicitudes de crédito hipotecario,
más la continuidad ante demora/indisponibilidad del proveedor y la jornada de atención, usando
pruebas de API (Karate) y recorridos de interfaz (Playwright), con datos sintéticos y evidencia
reproducible, sin modificar el producto.

## Alcance
- RF01 Registro y consulta, RF02 Evaluación, RF03 Confirmación (API, Karate).
- RF05 Continuidad del proveedor, RF06 Jornada (API, Karate).
- RF04 Recorridos UI: confirmado, rechazado, demora, indisponibilidad+recuperación (Playwright).

## Enfoque
- Pruebas de API como primera línea (rápidas, deterministas) para reglas de negocio e invariantes.
- Recorridos E2E en la capa UI para los flujos del asesor y la comparación UI vs API.
- Datos sintéticos únicos (QA-AUTO-timestamp-random); cada suite crea sus propios datos; no se
  reutilizan IDs; no se depende del orden.
- El resultado esperado se toma del **contrato** (fuente de verdad). Cuando el producto difiere,
  se conserva el fallo como hallazgo (no se debilita la aserción).

## Priorización basada en riesgos
- P0: regla del 80% (incl. límite), invariantes de confirmación, conservación de estado ante
  indisponibilidad, consistencia UI/API, criterio de jornada.
- P1: persistencia de estado, validaciones de registro, ausencia de duplicados, avisos de demora.
- P2: plazos permitidos, segunda evaluación.

## Datos
- Vivienda base 100000000; monto inferior 79000000; límite 80000000; superior 80000001;
  plazos 120/180/240. Documentos: CEDULA, CERTIFICADO_INGRESOS, AVALUO_VIVIENDA.

## Niveles de prueba
- Estructural (ambos frameworks): confirma la integración de herramientas sin tocar el producto.
- API funcional (Karate): status + esquema + valores + estado de negocio + persistencia + invariantes.
- E2E UI (Playwright): assertions web-first, Page Objects, comparación UI/API, evidencia en fallo.

## Riesgos conocidos
- HALL-001 (80% no inclusivo), HALL-002 (re-confirmación), HALL-RF06-001 (jornada 18/20).

## Fuera de alcance
- Autenticación, gestión de usuarios, multibrowser, pruebas de carga formales (JMeter/Gatling),
  despliegue, nube, modificación de backend/frontend, nuevos data-testid.
