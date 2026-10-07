package runners;

import com.intuit.karate.junit5.Karate;

/**
 * Runner de la prueba ESTRUCTURAL.
 *
 * Objetivo: confirmar que Karate 1.4.1 y JUnit 5 quedaron correctamente integrados
 * y que el proyecto compila y ejecuta Gherkin, SIN consumir ninguna API real.
 *
 * No requiere API_BASE_URL. No valida el producto Casa Propia.
 */
class StructuralTestRunner {

    @Karate.Test
    Karate estructural() {
        // Solo el feature estructural, filtrado adicionalmente por el tag @structural.
        return Karate.run("classpath:structural/estructura.feature")
                .tags("@structural");
    }
}
