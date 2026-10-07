@rf02 @api @regresion
Feature: Evaluacion del limite de financiacion

  # Contrato: se preaprueba si monto <= 80% del valor de la vivienda (inclusive);
  # por encima del 80% queda rechazada con una razon general.

  Background:
    * def fabrica = call read('classpath:data/solicitudes.js')
    * def estados = call read('classpath:data/estados.js')
    * def schemas = call read('classpath:data/schemas.js')

    * def registrar =
      """
      function(solicitud) {
        var payload = fabrica.aPayload(solicitud);
        var res = karate.call('classpath:helpers/crear-solicitud.feature', { payload: payload });
        return res.id;
      }
      """

  @smoke @critico
  Scenario: Preaprobar una solicitud cuyo monto es inferior al ochenta por ciento
    * def id = registrar(fabrica.inferiorAlLimite())
    Given url rutaEvaluacion(id)
    And request {}
    When method post
    Then status 200
    And match response.estado == estados.PREAPROBADA
    And match response.razonRechazo == null

  @frontera @critico
  Scenario: Preaprobar una solicitud cuyo monto equivale exactamente al ochenta por ciento
    # Frontera inclusiva: el contrato exige PREAPROBADA en el 80% exacto.
    * def id = registrar(fabrica.exactamenteEnElLimite())
    Given url rutaEvaluacion(id)
    And request {}
    When method post
    Then status 200
    And match response.estado == estados.PREAPROBADA
    And match response.razonRechazo == null
    # Persistencia del estado al consultar nuevamente.
    Given url rutaSolicitud(id)
    When method get
    Then status 200
    And match response.estado == estados.PREAPROBADA

  @frontera @critico
  Scenario: Rechazar una solicitud cuyo monto supera el limite permitido
    * def id = registrar(fabrica.superiorAlLimite())
    Given url rutaEvaluacion(id)
    And request {}
    When method post
    Then status 200
    And match response.estado == estados.RECHAZADA
    # La solicitud rechazada expone una razon general (no vacia).
    And match response.razonRechazo == '#string'
    And assert response.razonRechazo.length > 0

  @regresion
  Scenario: Conservar el estado preaprobado al consultar nuevamente
    * def id = registrar(fabrica.inferiorAlLimite())
    Given url rutaEvaluacion(id)
    And request {}
    When method post
    Then status 200
    And match response.estado == estados.PREAPROBADA
    Given url rutaSolicitud(id)
    When method get
    Then status 200
    And match response.estado == estados.PREAPROBADA
    And match response.evaluadaEn == '#string'

  @negativo
  Scenario: No se puede evaluar dos veces la misma solicitud
    # Tras evaluar, el estado ya no es REGISTRADA: una segunda evaluacion responde 409.
    * def id = registrar(fabrica.inferiorAlLimite())
    Given url rutaEvaluacion(id)
    And request {}
    When method post
    Then status 200
    Given url rutaEvaluacion(id)
    And request {}
    When method post
    Then status 409
    And match response.codigo == estados.error.TRANSICION_NO_PERMITIDA
