@structural @estructural
Feature: Prueba estructural de la suite de API

  # Esta prueba NO consume ninguna API real ni abre conexiones.
  # Confirma que Karate 1.4.1 y JUnit 5 quedaron integrados y que el proyecto
  # ejecuta Gherkin y carga la configuracion central. NO valida el producto.

  Scenario: Karate evalua expresiones y JSON correctamente
    * def suma = 79000000 + 1
    * match suma == 79000001
    * def solicitudSintetica = { cliente: 'QA-AUTO-estructural', valorVivienda: 100000000, monto: 80000000 }
    * match solicitudSintetica.valorVivienda == 100000000
    * match solicitudSintetica contains { monto: 80000000 }

  Scenario: La configuracion central expone la base y las rutas reales
    * match apiBaseUrl == '#string'
    * match rutas.solicitudes == apiBaseUrl + '/solicitudes'
    * match rutas.salud == apiBaseUrl + '/salud'
    * def ruta = rutaEvaluacion('SOL-000001')
    * match ruta == apiBaseUrl + '/solicitudes/SOL-000001/evaluacion'

  Scenario: La fabrica de datos sinteticos produce clientes unicos
    * def fabrica = call read('classpath:data/solicitudes.js')
    * def a = fabrica.inferiorAlLimite()
    * def b = fabrica.inferiorAlLimite()
    * match a.clientName != b.clientName
    * match a.propertyValue == 100000000
    * match a.requestedAmount == 79000000
    # El adapter traduce al payload del contrato (cliente/valorVivienda/monto/plazoMeses).
    * def payload = fabrica.aPayload(a)
    * match payload.valorVivienda == 100000000
    * match payload.monto == 79000000
