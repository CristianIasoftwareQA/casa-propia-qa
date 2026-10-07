@ignore
Feature: Helper - consultar la configuracion global del proveedor simulado

  # Devuelve: config (cuerpo con { modo, demoraMs }), status.

  Scenario: consultarConfig
    Given url rutas.configProveedor
    When method get
    Then status 200
    * def config = response
    * def status = responseStatus
