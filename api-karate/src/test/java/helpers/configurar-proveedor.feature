@ignore
Feature: Helper - configurar el modo global del proveedor simulado

  # Recibe: modo ('normal'|'demora'|'no-disponible'), demoraMs (opcional, def. 4000).
  # Aplica el cambio y lo verifica mediante GET. Devuelve: config, status.

  Scenario: configurarProveedor
    * def ms = (typeof demoraMs == 'undefined' || demoraMs == null ? 4000 : demoraMs)
    Given url rutas.configProveedor
    And request { modo: '#(modo)', demoraMs: '#(ms)' }
    When method put
    Then status 200
    And match response.modo == modo
    # Verificacion mediante GET (confirma que el cambio quedo aplicado).
    Given url rutas.configProveedor
    When method get
    Then status 200
    And match response.modo == modo
    * def config = response
    * def status = responseStatus
