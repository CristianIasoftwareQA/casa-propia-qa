@ignore
Feature: Helper - confirmar una solicitud

  # Recibe: id (string).
  # Devuelve: response, status. NO exige status fijo: el llamador valida 200 (permitido)
  # o 409 (no permitido) segun el escenario.

  Scenario: confirmar
    Given url rutaConfirmacion(id)
    And request {}
    When method post
    * def status = responseStatus
