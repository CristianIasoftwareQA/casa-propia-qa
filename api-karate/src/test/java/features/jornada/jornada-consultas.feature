@rf06 @jornada @api @critico
Feature: Jornada de atencion con cinco asesores y veinte consultas

  # 5 asesores x 4 consultas = 20 consultas concurrentes a GET /solicitudes/{id} con
  # cabecera X-Condicion-Atencion: jornada. La concurrencia real la provee el helper
  # Java JornadaConcurrente; Karate valida metricas y el criterio 19/20 <= 800 ms.

  Background:
    * def fabrica = call read('classpath:data/solicitudes.js')

  Scenario: Ejecutar la jornada y evaluar resultado funcional y temporal
    # La suite crea previamente UNA solicitud consultable (captura el id real, no lo hardcodea).
    * def payload = fabrica.aPayload(fabrica.inferiorAlLimite())
    * def creacion = call read('classpath:helpers/crear-solicitud.feature') { payload: '#(payload)' }
    * def id = creacion.id
    * match id == '#string'

    # Consulta normal previa para registrar los datos esperados (sin latencia de jornada).
    * def consultaNormal = call read('classpath:helpers/consultar-solicitud.feature') { id: '#(id)' }
    * match consultaNormal.response.id == id

    # Jornada concurrente real: 5 asesores x 4 consultas = 20 consultas con cabecera jornada.
    * def Jornada = Java.type('jornada.JornadaConcurrente')
    * def motor = new Jornada()
    * def resumen = motor.ejecutar(rutaSolicitud(id), id)

    # Evidencia legible del resumen.
    * def rutaEvidencia = motor.guardarEvidencia(resumen)
    * print 'Evidencia jornada:', rutaEvidencia
    * print 'Resumen jornada:', resumen

    # La evidencia ya quedo escrita ANTES de cualquier assertion (ver guardarEvidencia).

    # --- Estructura de la jornada (5 asesores x 4 consultas = 20) ---
    * match resumen.totalQueries == 20
    * match resumen.resultados == '#[20]'
    * match resumen.distinctAdvisors == 5
    * match resumen.fourQueriesEachAdvisor == true
    * match resumen.allResultFieldsPresent == true
    # Cada resultado individual contiene todos los campos requeridos.
    * match each resumen.resultados contains { advisorId: '#number', queryNumber: '#number', requestId: '#string', durationMs: '#number', statusCode: '#number', validData: '#boolean', withinLimit: '#boolean', errorType: '#string' }

    # --- Resultado FUNCIONAL ---
    * match resumen.validResponses == 20
    * match resumen.invalidResponses == 0
    * assert resumen.within800ms + resumen.over800ms == 20
    * assert resumen.minimumDurationMs >= 0
    * assert resumen.maximumDurationMs >= resumen.minimumDurationMs
    * assert resumen.totalDurationMs >= 0

    # --- Criterio de servicio: 19 de 20 <= 800 ms ---
    * print 'within800ms=', resumen.within800ms, '/20; over800ms=', resumen.over800ms
    * assert resumen.within800ms >= 19
    * match resumen.serviceCriterionMet == true
