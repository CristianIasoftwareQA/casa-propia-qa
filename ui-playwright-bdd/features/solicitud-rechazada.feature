# language: es
@rf04 @ui @e2e @critico @frontera
Característica: Rechazo de una solicitud cuyo monto supera el límite permitido

  # El monto solicitado (80000001) supera el ochenta por ciento del valor de la
  # vivienda (100000000); la solicitud debe quedar rechazada, mostrar una razón
  # general y no permitir una confirmación válida.

  Antecedentes:
    Dado que abro la aplicación Casa Propia
    Y que preparo una solicitud con valor de vivienda 100000000 y monto 80000001

  Escenario: Mostrar el rechazo y su razón general sin permitir la confirmación
    Cuando registro la solicitud desde la interfaz
    Y evalúo la solicitud desde la interfaz
    Entonces la interfaz muestra la solicitud como rechazada
    Y la interfaz muestra una razón general del rechazo
    Y no aparece la acción de confirmar el crédito
