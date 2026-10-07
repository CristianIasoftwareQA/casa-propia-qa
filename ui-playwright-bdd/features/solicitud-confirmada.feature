# language: es
@rf04 @ui @e2e @critico
Característica: Confirmación de una solicitud de crédito desde la interfaz

  # Flujo E2E completo desde la UI: registrar, evaluar, completar documentos, confirmar,
  # capturar el ID real y comparar la interfaz con la consulta por API.

  Antecedentes:
    Dado que abro la aplicación Casa Propia
    Y que preparo datos sintéticos válidos de una solicitud

  Escenario: Confirmar una solicitud válida y comparar la interfaz con la API
    Cuando registro la solicitud desde la interfaz
    Y capturo el identificador real de la solicitud
    Y evalúo la solicitud desde la interfaz
    Entonces la interfaz muestra la solicitud como preaprobada
    Cuando completo los documentos requeridos desde la interfaz
    Y confirmo la solicitud desde la interfaz
    Entonces la interfaz muestra la solicitud como confirmada
    Cuando consulto la misma solicitud mediante la API
    Entonces el identificador coincide entre la interfaz y la API
    Y el cliente coincide entre la interfaz y la API
    Y el plazo coincide entre la interfaz y la API
    Y el estado final coincide entre la interfaz y la API
    Y los documentos están completos según la API
