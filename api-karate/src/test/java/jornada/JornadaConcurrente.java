package jornada;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

/**
 * Jornada de atencion ACOTADA (RF06): cinco asesores, cuatro consultas por asesor,
 * veinte consultas CONCURRENTES contra GET /solicitudes/{id} con cabecera
 * X-Condicion-Atencion: jornada.
 *
 * Mide la duracion individual y total, valida la informacion de cada respuesta y
 * clasifica fallos funcionales vs incumplimientos temporales. NO es una prueba de
 * carga formal: es una jornada concurrente acotada.
 *
 * Se invoca desde el feature con Java.type para obtener concurrencia real; Karate
 * conserva las assertions principales sobre las metricas devueltas.
 */
public class JornadaConcurrente {

    public static final int ASESORES = 5;
    public static final int CONSULTAS_POR_ASESOR = 4;
    public static final int TOTAL = ASESORES * CONSULTAS_POR_ASESOR;
    public static final long UMBRAL_MS = 800;
    public static final int MINIMO_EXITOSAS = 19;

    /** Resultado individual de una consulta. */
    public static class Resultado {
        public int advisorId;
        public int queryNumber;
        public String requestId;
        public long durationMs;
        public int statusCode;
        public boolean validData;
        public boolean withinLimit;
        public String errorType;   // NINGUNO | FUNCIONAL | TEMPORAL
        public String errorMessage;
    }

    /**
     * Ejecuta la jornada concurrente.
     *
     * @param urlSolicitud URL completa de GET /solicitudes/{id}
     * @param idEsperado   id de la solicitud creada por la suite (dato correcto esperado)
     * @return mapa con resultados y metricas agregadas (consumible desde Karate)
     */
    public java.util.Map<String, Object> ejecutar(String urlSolicitud, String idEsperado) {
        HttpClient client = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                .build();

        ExecutorService pool = Executors.newFixedThreadPool(TOTAL);
        List<Callable<Resultado>> tareas = new ArrayList<>();

        for (int asesor = 1; asesor <= ASESORES; asesor++) {
            for (int consulta = 1; consulta <= CONSULTAS_POR_ASESOR; consulta++) {
                final int advisorId = asesor;
                final int queryNumber = consulta;
                tareas.add(() -> consultar(client, urlSolicitud, idEsperado, advisorId, queryNumber));
            }
        }

        List<Resultado> resultados = new ArrayList<>();
        long inicioTotal = System.nanoTime();
        try {
            List<Future<Resultado>> futuros = pool.invokeAll(tareas);
            for (Future<Resultado> f : futuros) {
                resultados.add(f.get());
            }
        } catch (Exception e) {
            throw new RuntimeException("Fallo ejecutando la jornada concurrente: " + e.getMessage(), e);
        } finally {
            pool.shutdownNow();
        }
        long tiempoTotalMs = (System.nanoTime() - inicioTotal) / 1_000_000;

        return agregar(resultados, tiempoTotalMs);
    }

    private Resultado consultar(HttpClient client, String url, String idEsperado,
                                int advisorId, int queryNumber) {
        Resultado r = new Resultado();
        r.advisorId = advisorId;
        r.queryNumber = queryNumber;
        r.requestId = idEsperado;
        r.errorType = "NINGUNO";

        HttpRequest req = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .timeout(Duration.ofSeconds(20))
                .header("X-Condicion-Atencion", "jornada")
                .GET()
                .build();

        long inicio = System.nanoTime();
        try {
            HttpResponse<String> resp = client.send(req, HttpResponse.BodyHandlers.ofString());
            r.durationMs = (System.nanoTime() - inicio) / 1_000_000;
            r.statusCode = resp.statusCode();
            // Validacion funcional: 200 y el id correcto presente en el cuerpo.
            boolean ok200 = resp.statusCode() == 200;
            boolean idCorrecto = resp.body() != null
                    && resp.body().contains("\"id\":\"" + idEsperado + "\"");
            r.validData = ok200 && idCorrecto;
            r.withinLimit = r.durationMs <= UMBRAL_MS;
            if (!r.validData) {
                r.errorType = "FUNCIONAL";
                r.errorMessage = "Respuesta funcionalmente invalida (status=" + resp.statusCode() + ")";
            } else if (!r.withinLimit) {
                r.errorType = "TEMPORAL";
                r.errorMessage = "Duracion " + r.durationMs + " ms supera el umbral de " + UMBRAL_MS + " ms";
            }
        } catch (Exception e) {
            r.durationMs = (System.nanoTime() - inicio) / 1_000_000;
            r.statusCode = 0;
            r.validData = false;
            r.withinLimit = false;
            r.errorType = "FUNCIONAL";
            r.errorMessage = "Excepcion de red: " + e.getMessage();
        }
        return r;
    }

    /** Convierte un Resultado (POJO) a Map para que Karate pueda validar el esquema. */
    private java.util.Map<String, Object> aMapa(Resultado r) {
        java.util.Map<String, Object> m = new java.util.LinkedHashMap<>();
        m.put("advisorId", r.advisorId);
        m.put("queryNumber", r.queryNumber);
        m.put("requestId", r.requestId);
        m.put("durationMs", r.durationMs);
        m.put("statusCode", r.statusCode);
        m.put("validData", r.validData);
        m.put("withinLimit", r.withinLimit);
        m.put("errorType", r.errorType);
        m.put("errorMessage", r.errorMessage);
        return m;
    }

    private java.util.Map<String, Object> agregar(List<Resultado> resultados, long tiempoTotalMs) {
        int total = resultados.size();
        int validas = 0;
        int dentroDelUmbral = 0;
        long min = Long.MAX_VALUE;
        long max = Long.MIN_VALUE;
        long suma = 0;
        int exitosas = 0; // validas Y dentro del umbral

        for (Resultado r : resultados) {
            if (r.validData) validas++;
            if (r.withinLimit) dentroDelUmbral++;
            if (r.validData && r.withinLimit) exitosas++;
            min = Math.min(min, r.durationMs);
            max = Math.max(max, r.durationMs);
            suma += r.durationMs;
        }
        if (total == 0) { min = 0; max = 0; }

        java.util.Map<String, Object> m = new java.util.LinkedHashMap<>();
        // Resultados individuales (20) y resumen con los nombres exactos del contrato.
        // Karate compara 'match each ... contains { ... }' contra Maps, no contra POJOs:
        // si se entregan objetos Resultado, falla con "data types don't match (OTHER:MAP)".
        // Por eso cada Resultado se expone como Map con los campos del contrato.
        List<java.util.Map<String, Object>> resultadosMap = new ArrayList<>();
        for (Resultado r : resultados) {
            resultadosMap.add(aMapa(r));
        }
        m.put("resultados", resultadosMap);
        m.put("totalQueries", total);
        m.put("validResponses", validas);
        m.put("invalidResponses", total - validas);
        m.put("within800ms", dentroDelUmbral);
        m.put("over800ms", total - dentroDelUmbral);
        m.put("minimumDurationMs", total == 0 ? 0 : min);
        m.put("maximumDurationMs", total == 0 ? 0 : max);
        m.put("averageDurationMs", total == 0 ? 0 : (suma / total));
        m.put("totalDurationMs", tiempoTotalMs);
        m.put("exitosas", exitosas);
        m.put("serviceCriterionMet", exitosas >= MINIMO_EXITOSAS);
        m.put("umbralMs", UMBRAL_MS);

        // Validacion estructural de la jornada: 5 asesores distintos, 4 consultas c/u,
        // y cada resultado con todos sus campos presentes.
        java.util.Map<Integer, Integer> porAsesor = new java.util.TreeMap<>();
        boolean camposCompletos = true;
        for (Resultado r : resultados) {
            porAsesor.merge(r.advisorId, 1, Integer::sum);
            if (r.requestId == null || r.errorType == null) {
                camposCompletos = false;
            }
        }
        boolean cuatroPorAsesor = porAsesor.values().stream().allMatch(c -> c == CONSULTAS_POR_ASESOR);
        m.put("distinctAdvisors", porAsesor.size());
        m.put("queriesPerAdvisor", porAsesor);
        m.put("fourQueriesEachAdvisor", cuatroPorAsesor);
        m.put("allResultFieldsPresent", camposCompletos);
        return m;
    }

    /**
     * Guarda un resumen legible de la jornada como evidencia en evidence/karate/.
     * Devuelve la ruta del archivo escrito (o un mensaje si no fue posible).
     * No interrumpe la prueba si falla la escritura.
     */
    public String guardarEvidencia(java.util.Map<String, Object> resumen) {
        try {
            Path dir = Paths.get("..", "evidence", "karate");
            Files.createDirectories(dir);
            String ts = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss"));
            Path archivo = dir.resolve("jornada-" + ts + ".txt");

            StringBuilder sb = new StringBuilder();
            sb.append("Jornada de atencion (RF06) - resumen\n");
            sb.append("Generado: ").append(LocalDateTime.now()).append("\n");
            sb.append("Umbral: ").append(UMBRAL_MS).append(" ms | Criterio: >= ")
              .append(MINIMO_EXITOSAS).append("/").append(TOTAL).append("\n\n");

            sb.append("Metricas:\n");
            for (String k : new String[]{
                    "totalQueries", "validResponses", "invalidResponses", "within800ms", "over800ms",
                    "minimumDurationMs", "maximumDurationMs", "averageDurationMs", "totalDurationMs",
                    "serviceCriterionMet"}) {
                sb.append("  ").append(k).append(" = ").append(resumen.get(k)).append("\n");
            }

            sb.append("\nDetalle por consulta (advisorId, queryNumber, durationMs, statusCode, validData, withinLimit, errorType):\n");
            @SuppressWarnings("unchecked")
            List<java.util.Map<String, Object>> rs =
                    (List<java.util.Map<String, Object>>) resumen.get("resultados");
            if (rs != null) {
                for (java.util.Map<String, Object> r : rs) {
                    sb.append(String.format("  asesor-%s #%s  %s ms  http=%s  valid=%s  within=%s  %s%n",
                            r.get("advisorId"), r.get("queryNumber"), r.get("durationMs"),
                            r.get("statusCode"), r.get("validData"), r.get("withinLimit"),
                            r.get("errorType")));
                }
            }

            Files.write(archivo, sb.toString().getBytes(StandardCharsets.UTF_8));
            return archivo.toAbsolutePath().toString();
        } catch (IOException e) {
            return "No se pudo escribir la evidencia de jornada: " + e.getMessage();
        }
    }
}
