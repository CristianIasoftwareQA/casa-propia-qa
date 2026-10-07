package runners;

import com.intuit.karate.junit5.Karate;

/**
 * Runner de JORNADA (RF06): jornada concurrente acotada de 20 consultas.
 * Ejecuta los escenarios @jornada, excluyendo @pendienteContrato.
 */
class WorkloadTestRunner {

    @Karate.Test
    Karate jornada() {
        return Karate.run("classpath:features/jornada")
                .tags("@jornada", "~@pendienteContrato");
    }
}
