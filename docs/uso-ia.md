# Uso de IA

## Herramienta utilizada
Asistente de IA integrado en el IDE (Kiro), usado como copiloto de automatización.

## Tareas apoyadas
- Verificación de compatibilidad de versiones (Karate 1.4.1 / Java 11) y del soporte de Gherkin
  localizado por framework.
- Análisis del contrato (OpenAPI + condiciones de simulación), backend (NestJS) y frontend (Angular).
- Generación de la estructura del repositorio, configuraciones, modelos, fábricas, helpers, Page
  Objects, adapters, steps, features y documentación.
- Ejecución y diagnóstico de pruebas; clasificación de fallos.

## Validaciones personales (del candidato)
- Confirmación en vivo de endpoints, estados y códigos HTTP mediante peticiones reales.
- Verificación de los defectos (80% inclusive, re-confirmación, jornada 18/20) contra el contrato.
- Revisión de que las aserciones reflejan el contrato y no se debilitaron para pasar.

## Cambios realizados sobre propuestas de la IA
- Corrección de la selección del `<select>` Angular por etiqueta (no por value).
- Ajuste del texto del aviso de demora al texto real del DOM (sin elipsis).
- Validación diferida de API_BASE_URL en el cliente API.
- Diseño de la jornada concurrente con medición por petición y evidencia previa a la aserción.

## Propuestas descartadas
- Migrar la capa API fuera de Karate.
- Forzar el criterio de jornada a 18/20 o eliminar las consultas lentas (se conservó el fallo real).
- Usar `page.route`/intercepción para simular demora/indisponibilidad (se usó el mecanismo oficial).

## Limitaciones
- La IA no decide la liberación; la decisión se basa en evidencia de ejecución real.
- El conocimiento del perfil interno del backend no se usó para forzar un resultado verde en RF06.

## Responsabilidad final
El candidato es responsable de la validación final, de la interpretación del contrato y de la
clasificación de los hallazgos.
