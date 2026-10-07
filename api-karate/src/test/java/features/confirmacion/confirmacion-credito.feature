@rf03 @api @regresion
Feature: Confirmacion de solicitudes de credito

  # Solo se confirma una solicitud PREAPROBADA, con los tres documentos y no
  # confirmada antes. Todo intento no permitido responde 409 sin cambiar estado ni
  # datos (se compara la solicitud antes/despues).

  Background:
    * def fabrica = call read('classpath:data/solicitudes.js')
    * def estados = call read('classpath:data/estados.js')
    * def normalizer = call read('classpath:utils/normalizer.js')
    * def docsRequeridos = documentosRequeridos

    # Helpers locales de preparacion (cada uno con responsabilidad unica).
    * def registrar =
      """
      function(solicitud) {
        var payload = fabrica.aPayload(solicitud);
        return karate.call('classpath:helpers/crear-solicitud.feature', { payload: payload }).id;
      }
      """
    * def evaluar =
      """
      function(id) {
        return karate.call('classpath:helpers/evaluar-solicitud.feature', { id: id });
      }
      """
    * def registrarDocs =
      """
      function(id, docs) {
        return karate.call('classpath:helpers/registrar-documentos.feature', { id: id, documentos: docs });
      }
      """
    * def consultar =
      """
      function(id) {
        return karate.call('classpath:helpers/consultar-solicitud.feature', { id: id }).response;
      }
      """

  @smoke @critico
  Scenario: Permitir la confirmacion de una solicitud preaprobada con documentos completos
    * def id = registrar(fabrica.inferiorAlLimite())
    * def ev = evaluar(id)
    * match ev.respuesta.estado == estados.PREAPROBADA
    * registrarDocs(id, docsRequeridos)
    # Confirmacion permitida
    Given url rutaConfirmacion(id)
    And request {}
    When method post
    Then status 200
    And match response.estado == estados.CONFIRMADA
    And match response.confirmadaEn == '#string'
    # Los datos originales permanecen correctos
    And match response.cliente == '#string'
    And match response.documentosPendientes == []
    # Persistencia al consultar nuevamente
    * def despues = consultar(id)
    * match despues.estado == estados.CONFIRMADA

  @negativo @critico
  Scenario: No permitir confirmar una solicitud apenas registrada
    * def id = registrar(fabrica.inferiorAlLimite())
    * def antes = consultar(id)
    Given url rutaConfirmacion(id)
    And request {}
    When method post
    Then status 409
    And match response.codigo == estados.error.TRANSICION_NO_PERMITIDA
    * def despues = consultar(id)
    * def dif = normalizer.comparar(antes, despues)
    * match dif.iguales == true

  @negativo @critico
  Scenario: No permitir confirmar una solicitud rechazada
    * def id = registrar(fabrica.superiorAlLimite())
    * evaluar(id)
    * def antes = consultar(id)
    * match antes.estado == estados.RECHAZADA
    Given url rutaConfirmacion(id)
    And request {}
    When method post
    Then status 409
    And match response.codigo == estados.error.TRANSICION_NO_PERMITIDA
    * def despues = consultar(id)
    * def dif = normalizer.comparar(antes, despues)
    * match dif.iguales == true

  @negativo @critico
  Scenario: No permitir confirmar una solicitud preaprobada con documentos incompletos
    * def id = registrar(fabrica.inferiorAlLimite())
    * evaluar(id)
    # Solo un documento de los tres requeridos
    * registrarDocs(id, ['CEDULA'])
    * def antes = consultar(id)
    * match antes.estado == estados.PREAPROBADA
    Given url rutaConfirmacion(id)
    And request {}
    When method post
    Then status 409
    And match response.codigo == estados.error.DOCUMENTOS_INCOMPLETOS
    * def despues = consultar(id)
    * def dif = normalizer.comparar(antes, despues)
    * match dif.iguales == true

  @negativo @critico
  Scenario: No confirmar nuevamente una solicitud ya confirmada
    * def id = registrar(fabrica.inferiorAlLimite())
    * evaluar(id)
    * registrarDocs(id, docsRequeridos)
    # Primera confirmacion permitida
    Given url rutaConfirmacion(id)
    And request {}
    When method post
    Then status 200
    And match response.estado == estados.CONFIRMADA
    * def antes = consultar(id)
    # Segundo intento: no permitido, no debe cambiar nada
    Given url rutaConfirmacion(id)
    And request {}
    When method post
    Then status 409
    And match response.codigo == estados.error.TRANSICION_NO_PERMITIDA
    * def despues = consultar(id)
    * def dif = normalizer.comparar(antes, despues)
    * match dif.iguales == true
