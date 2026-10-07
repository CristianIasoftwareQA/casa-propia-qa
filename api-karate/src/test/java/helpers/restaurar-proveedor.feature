@ignore
Feature: Helper - restaurar el proveedor a modo normal

  # Restaura la configuracion global a { modo: normal, demoraMs: 4000 } y lo verifica.
  # Pensado para teardown garantizado (configure afterScenario / finally).

  Scenario: restaurarProveedor
    Given url rutas.configProveedor
    And request { modo: 'normal', demoraMs: 4000 }
    When method put
    Then status 200
    Given url rutas.configProveedor
    When method get
    Then status 200
    And match response.modo == 'normal'
    * def config = response
