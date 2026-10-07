/**
 * Modelos y helpers para la JORNADA de atencion (carga concurrente acotada).
 *
 * Alcance: cinco asesores, cuatro consultas por asesor, veinte consultas totales.
 * Esto NO es una prueba de carga tipo JMeter/Gatling: es una jornada concurrente acotada.
 *
 * No implementa concurrencia contra rutas inventadas. La funcion real de consulta
 * se inyecta cuando exista contrato (ver ConsultaJornadaFn).
 */

/** Clasificacion del tipo de error observado en una consulta. */
export enum TipoError {
  NINGUNO = 'NINGUNO',
  /** Fallo funcional: datos invalidos o respuesta incorrecta. */
  FUNCIONAL = 'FUNCIONAL',
  /** Incumplimiento temporal: la respuesta excedio el limite de tiempo. */
  TEMPORAL = 'TEMPORAL',
}

/** Umbral temporal por consulta, en milisegundos. */
export const UMBRAL_MS = 800;
export const TOTAL_CONSULTAS_ESPERADAS = 20;
export const MINIMO_EXITOSAS = 19;

/** Resultado de una consulta individual de la jornada. */
export interface ResultadoConsulta {
  readonly advisorId: number;
  readonly queryNumber: number;
  readonly requestId: string;
  readonly durationMs: number;
  readonly statusCode: number;
  /** Indica si los datos de negocio recibidos son validos. */
  readonly validData: boolean;
  /** Indica si la consulta estuvo dentro del umbral temporal (<= 800 ms). */
  readonly withinLimit: boolean;
  readonly errorType: TipoError;
  readonly errorMessage?: string;
}

/**
 * Firma de la funcion REAL de consulta de la jornada.
 * TODO(CONTRATO): se implementara cuando se conozca el endpoint y el mecanismo de jornada.
 */
export type ConsultaJornadaFn = (
  advisorId: number,
  queryNumber: number
) => Promise<ResultadoConsulta>;

/** Metricas agregadas de la jornada. */
export interface MetricasJornada {
  readonly total: number;
  readonly validas: number;
  readonly invalidas: number;
  readonly dentroDelUmbral: number;
  readonly fueraDelUmbral: number;
  readonly tiempoMinimo: number;
  readonly tiempoMaximo: number;
  readonly tiempoPromedio: number;
  readonly tiempoTotal: number;
  readonly cumple19de20: boolean;
}

/**
 * Calcula las metricas agregadas a partir de los resultados individuales.
 * Separa explicitamente fallos funcionales de incumplimientos temporales.
 */
export function calcularMetricas(resultados: ReadonlyArray<ResultadoConsulta>): MetricasJornada {
  const total = resultados.length;
  if (total === 0) {
    return {
      total: 0,
      validas: 0,
      invalidas: 0,
      dentroDelUmbral: 0,
      fueraDelUmbral: 0,
      tiempoMinimo: 0,
      tiempoMaximo: 0,
      tiempoPromedio: 0,
      tiempoTotal: 0,
      cumple19de20: false,
    };
  }

  const duraciones = resultados.map((r) => r.durationMs);
  const validas = resultados.filter((r) => r.validData).length;
  const dentroDelUmbral = resultados.filter((r) => r.withinLimit).length;
  const tiempoTotal = duraciones.reduce((a, b) => a + b, 0);

  // "Exitosa" para el criterio 19/20 = datos validos Y dentro del umbral.
  const exitosas = resultados.filter((r) => r.validData && r.withinLimit).length;

  return {
    total,
    validas,
    invalidas: total - validas,
    dentroDelUmbral,
    fueraDelUmbral: total - dentroDelUmbral,
    tiempoMinimo: Math.min(...duraciones),
    tiempoMaximo: Math.max(...duraciones),
    tiempoPromedio: tiempoTotal / total,
    tiempoTotal,
    cumple19de20: exitosas >= MINIMO_EXITOSAS,
  };
}
