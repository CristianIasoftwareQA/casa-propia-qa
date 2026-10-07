@rf05 @api @continuidad @regresion
Feature: Continuidad del servicio ante demora e indisponibilidad del proveedor

  # Simulacion por peticion (cabecera X-Simulacion-Proveedor). Ante demora o
  # indisponibilidad el estado y los datos se conservan; al restaurar, continua.

  Background:
    * def fabrica = call read('classpath:data/solicitudes.js')
    * def estados = call read('classpath:data/estados.js')
    * def normalizer = call read('classpath:utils/normalizer.js')
    * def registrar =
      """
      function(solicitud) {
        var payload = fabrica.aPayload(solicitud);
        return karate.call('classpath:helpers/crear-solicitud.feature', { payload: payload }).id;
      }
      """
    * def consultar =
      """
      function(id) {
        return karate.call('classpath:helpers/consultar-solicitud.feature', { id: id }).response;
      }
      """

  @smoke
  Scenario: Evaluacion en modo normal mediante cabecera por peticion
    * def id = registrar(fabrica.inferiorAlLimite())
    Given url rutaEvaluacion(id)
    And header X-Simulacion-Proveedor = 'normal'
    And request {}
    When method post
    Then status 200
    And match response.estado == estados.PREAPROBADA
    And match response.id == id

  @critico
  Scenario: La evaluacion demorada por peticion responde 200 sin duplicar la solicitud
    * def id = registrar(fabrica.inferiorAlLimite())
    * def antes = consultar(id)
    # Mecanismo oficial: forzar demora solo para esta peticion (usa demoraMs global vigente).
    Given url rutaEvaluacion(id)
    And header X-Simulacion-Proveedor = 'demora'
    And request {}
    When method post
    Then status 200
    And match response.estado == estados.PREAPROBADA
    # No se generan solicitudes nuevas por la demora: el id es el mismo.
    And match response.id == id

  @critico @configuracionGlobal
  Scenario: La demora configurada globalmente (demoraMs=4000) evalua con exito y se restaura
    # Escenario que MODIFICA la configuracion global compartida. Teardown garantizado:
    # restaura el proveedor a normal aunque el escenario falle.
    * configure afterScenario =
      """
      function() {
        karate.call('classpath:helpers/restaurar-proveedor.feature');
      }
      """
    * def cfg = call read('classpath:helpers/configurar-proveedor.feature') { modo: 'demora', demoraMs: 4000 }
    * match cfg.config.modo == 'demora'
    * match cfg.config.demoraMs == 4000
    # Evaluacion sin cabecera: toma la configuracion global y responde 200.
    * def id = registrar(fabrica.inferiorAlLimite())
    Given url rutaEvaluacion(id)
    And request {}
    When method post
    Then status 200
    And match response.estado == estados.PREAPROBADA
    And match response.id == id
    # Restauracion explicita verificada (ademas del teardown defensivo).
    * def restaurado = call read('classpath:helpers/restaurar-proveedor.feature')
    * match restaurado.config.modo == 'normal'

  @critico
  Scenario: Conservar estado y datos ante indisponibilidad del proveedor
    * def id = registrar(fabrica.inferiorAlLimite())
    * def antes = consultar(id)
    * match antes.estado == estados.REGISTRADA
    # Mecanismo oficial: proveedor no disponible solo para esta peticion.
    Given url rutaEvaluacion(id)
    And header X-Simulacion-Proveedor = 'no-disponible'
    And request {}
    When method post
    Then status 503
    And match response.codigo == estados.error.PROVEEDOR_NO_DISPONIBLE
    # El estado y los datos no cambiaron.
    * def despues = consultar(id)
    * def dif = normalizer.comparar(antes, despues)
    * match dif.iguales == true
    * match despues.estado == estados.REGISTRADA

  @critico
  Scenario: Continuar exitosamente tras restaurar el proveedor
    * def id = registrar(fabrica.inferiorAlLimite())
    # Primer intento con indisponibilidad
    Given url rutaEvaluacion(id)
    And header X-Simulacion-Proveedor = 'no-disponible'
    And request {}
    When method post
    Then status 503
    And match response.codigo == estados.error.PROVEEDOR_NO_DISPONIBLE
    # Restaurar (modo normal) y reintentar: la operacion continua con exito.
    Given url rutaEvaluacion(id)
    And header X-Simulacion-Proveedor = 'normal'
    And request {}
    When method post
    Then status 200
    And match response.estado == estados.PREAPROBADA
    And match response.id == id
    # No hay duplicados: sigue siendo la misma unica solicitud, ahora preaprobada.
    * def despues = consultar(id)
    * match despues.id == id
    * match despues.estado == estados.PREAPROBADA
