@ignore
Feature: Helper - evaluar una solicitud

  # Recibe: id (string). Opcional: modoProveedor ('normal'|'demora'|'no-disponible').
  # Devuelve: respuesta (cuerpo), status (codigo HTTP). NO exige status fijo:
  # el llamador valida 200/503/409 segun el escenario, para no ocultar codigos reales.

  Scenario: evaluar
    Given url rutaEvaluacion(id)
    And configure headers = (typeof modoProveedor == 'undefined' || modoProveedor == null ? null : { 'X-Simulacion-Proveedor': modoProveedor })
    And request {}
    When method post
    * def respuesta = response
    * def status = responseStatus
