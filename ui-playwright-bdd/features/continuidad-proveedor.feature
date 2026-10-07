# language: es
@rf04 @rf05 @ui @e2e @continuidad @configuracionGlobal
Característica: Continuidad del servicio ante demora e indisponibilidad del proveedor

  # Usa el mecanismo oficial GLOBAL del proveedor (la UI no envía cabecera por petición):
  # se configura demora / indisponibilidad / normal mediante la configuración global,
  # verificando cada cambio por API. El teardown restaura el proveedor a normal.

  Antecedentes:
    Dado que abro la aplicación Casa Propia
    Y que registro por la interfaz una solicitud válida y evaluable

  @demora
  Escenario: Evaluación demorada muestra avisos y finaliza preaprobando sin duplicar
    Cuando configuro el proveedor en modo demora con 4000 milisegundos
    Y evalúo la solicitud desde la interfaz
    Entonces la interfaz muestra el aviso "Evaluando con el proveedor"
    Y la interfaz muestra el aviso "La evaluación está tardando más de lo habitual"
    Y la evaluación finaliza y la interfaz muestra la solicitud como preaprobada
    Y al consultar la solicitud por API el estado es preaprobada
    Y restauro el proveedor a modo normal

  @indisponibilidad
  Escenario: Indisponibilidad conserva estado y datos, y la recuperación permite continuar
    Cuando guardo el estado inicial de la solicitud por API
    Y configuro el proveedor en modo no disponible
    Y evalúo la solicitud desde la interfaz
    Entonces la interfaz muestra una alerta de proveedor no disponible
    Y al consultar la solicitud por API el estado y los datos no cambiaron
    Y la acción de evaluar sigue disponible
    Cuando restauro el proveedor a modo normal
    Y reintento la evaluación desde la interfaz
    Entonces la evaluación finaliza y la interfaz muestra la solicitud como preaprobada
    Y al consultar la solicitud por API el estado es preaprobada
