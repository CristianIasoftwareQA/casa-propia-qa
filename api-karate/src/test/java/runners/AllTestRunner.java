package runners;

import com.intuit.karate.junit5.Karate;

/**
 * Ejecuta toda la suite (estructural + RF01-RF06) en una sola pasada, para que el
 * reporte contenga todos los escenarios y ningun runner sobrescriba a otro.
 * Excluye @pendienteContrato.
 */
class AllTestRunner {

    @Karate.Test
    Karate todos() {
        return Karate.run(
                        "classpath:structural",
                        "classpath:features")
                .tags("~@pendienteContrato");
    }
}
