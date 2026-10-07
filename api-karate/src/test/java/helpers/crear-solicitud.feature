@ignore
Feature: Helper - crear una solicitud

  # Recibe: payload (objeto con cliente, valorVivienda, monto, plazoMeses).
  # Devuelve: response, status, id.
  # Responsabilidad unica: registrar una solicitud. No depende de escenarios previos.

  Scenario: registrar
    Given url rutas.solicitudes
    And request payload
    When method post
    Then status 201
    * def id = response.id
    * def status = responseStatus
