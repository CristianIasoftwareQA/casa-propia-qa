@rf01 @api @regresion
Feature: Registro y consulta de solicitudes de credito

  # Narrativa en espanol; keywords estructurales en ingles (Karate 1.4.1 no localiza).
  # La suite crea todos sus datos y no reutiliza identificadores previos.

  Background:
    * def fabrica = call read('classpath:data/solicitudes.js')
    * def schemas = call read('classpath:data/schemas.js')
    * def estados = call read('classpath:data/estados.js')

  @smoke @critico
  Scenario: Registrar una solicitud valida y recuperarla por su identificador
    * def solicitud = fabrica.inferiorAlLimite()
    * def payload = fabrica.aPayload(solicitud)
    # Registro
    Given url rutas.solicitudes
    And request payload
    When method post
    Then status 201
    And match response == schemas.solicitud
    And match response.estado == estados.REGISTRADA
    And match response.cliente == solicitud.clientName
    And match response.valorVivienda == solicitud.propertyValue
    And match response.monto == solicitud.requestedAmount
    And match response.plazoMeses == solicitud.termMonths
    And match response.documentosPendientes == ['CEDULA', 'CERTIFICADO_INGRESOS', 'AVALUO_VIVIENDA']
    * def id = response.id
    # Consulta por identificador: debe conservar los datos registrados
    Given url rutaSolicitud(id)
    When method get
    Then status 200
    And match response.id == id
    And match response.cliente == solicitud.clientName
    And match response.valorVivienda == solicitud.propertyValue
    And match response.monto == solicitud.requestedAmount
    And match response.plazoMeses == solicitud.termMonths
    And match response.estado == estados.REGISTRADA

  @negativo
  Scenario: Consultar una solicitud inexistente responde no encontrada
    Given url rutaSolicitud('SOL-999999')
    When method get
    Then status 404
    And match response.codigo == estados.error.SOLICITUD_NO_ENCONTRADA

  @frontera
  Scenario Outline: Registrar una solicitud valida con cada plazo permitido
    * def solicitud = fabrica.conPlazo<plazo>()
    * def payload = fabrica.aPayload(solicitud)
    Given url rutas.solicitudes
    And request payload
    When method post
    Then status 201
    And match response.plazoMeses == <plazo>
    And match response.estado == estados.REGISTRADA

    Examples:
      | plazo |
      | 120   |
      | 180   |
      | 240   |

  @negativo
  Scenario: Rechazar el registro con un plazo no permitido
    * def solicitud = fabrica.conPlazoInvalido()
    * def payload = fabrica.aPayload(solicitud)
    Given url rutas.solicitudes
    And request payload
    When method post
    Then status 400
    And match response.codigo == estados.error.DATOS_INVALIDOS
    And match response.detalles[*].campo contains 'plazoMeses'

  @negativo
  Scenario: Rechazar el registro cuando el cliente esta ausente
    * def solicitud = fabrica.conClienteAusente()
    * def payload = fabrica.aPayload(solicitud)
    Given url rutas.solicitudes
    And request payload
    When method post
    Then status 400
    And match response.codigo == estados.error.DATOS_INVALIDOS
    And match response.detalles[*].campo contains 'cliente'

  @negativo
  Scenario: Rechazar el registro cuando el cliente esta vacio
    * def solicitud = fabrica.conClienteVacio()
    * def payload = fabrica.aPayload(solicitud)
    Given url rutas.solicitudes
    And request payload
    When method post
    Then status 400
    And match response.codigo == estados.error.DATOS_INVALIDOS
    And match response.detalles[*].campo contains 'cliente'

  @negativo @frontera
  Scenario Outline: Rechazar el registro con importes no positivos
    * def solicitud = fabrica.<metodo>()
    * def payload = fabrica.aPayload(solicitud)
    Given url rutas.solicitudes
    And request payload
    When method post
    Then status 400
    And match response.codigo == estados.error.DATOS_INVALIDOS
    And match response.detalles[*].campo contains '<campo>'

    Examples:
      | metodo                    | campo         |
      | conValorViviendaCero      | valorVivienda |
      | conValorViviendaNegativo  | valorVivienda |
      | conMontoCero              | monto         |
      | conMontoNegativo          | monto         |

  @negativo @frontera
  Scenario: Rechazar el registro con importes decimales
    # El contrato exige enteros (type: integer). Un decimal debe rechazarse como dato invalido.
    * def solicitud = fabrica.conValorDecimal()
    * def payload = fabrica.aPayload(solicitud)
    Given url rutas.solicitudes
    And request payload
    When method post
    Then status 400
    And match response.codigo == estados.error.DATOS_INVALIDOS

  @negativo
  Scenario: Una entrada invalida no crea una solicitud consultable
    # Un registro invalido no debe producir un id consultable.
    * def solicitud = fabrica.conClienteVacio()
    * def payload = fabrica.aPayload(solicitud)
    Given url rutas.solicitudes
    And request payload
    When method post
    Then status 400
    And match response.id == '#notpresent'
