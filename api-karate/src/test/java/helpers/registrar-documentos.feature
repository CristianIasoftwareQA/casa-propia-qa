@ignore
Feature: Helper - registrar documentos de una solicitud

  # Recibe: id (string), documentos (array de tipos de documento).
  # Devuelve: response, status.

  Scenario: registrarDocumentos
    Given url rutaDocumentos(id)
    And request { documentos: '#(documentos)' }
    When method post
    Then status 200
    * def status = responseStatus
