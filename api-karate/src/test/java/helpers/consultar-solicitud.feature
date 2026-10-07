@ignore
Feature: Helper - consultar una solicitud por su identificador

  # Recibe: id (string). Opcional: condicionAtencion ('normal' | 'jornada').
  # Devuelve: response, status.
  # El header solo se envia si se paso una condicion (si no, se omite por completo).

  Scenario: consultar
    Given url rutaSolicitud(id)
    And configure headers = (typeof condicionAtencion == 'undefined' || condicionAtencion == null ? null : { 'X-Condicion-Atencion': condicionAtencion })
    When method get
    Then status 200
    * def status = responseStatus
