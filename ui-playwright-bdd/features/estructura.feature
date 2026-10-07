# language: es
@structural
Característica: Prueba estructural de la suite UI

  # Esta prueba NO navega a ninguna URL ni usa servicios externos.
  # Verifica funciones y transformaciones locales para confirmar que
  # TypeScript, playwright-bdd y Playwright Test quedaron integrados.
  # NO es una prueba E2E del producto Casa Propia.

  Escenario: La normalización monetaria convierte texto a número
    Dado un valor monetario en texto "100.000.000"
    Cuando normalizo el valor monetario
    Entonces el número resultante es 100000000

  Escenario: La fábrica genera una solicitud sintética válida
    Dado que solicito una solicitud sintética inferior al límite
    Entonces la solicitud tiene un valor de vivienda de 100000000
    Y la solicitud tiene un monto solicitado de 79000000
