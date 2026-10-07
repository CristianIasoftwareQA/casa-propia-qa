/**
 * Modelo INTERNO de respuesta de credito.
 *
 * Representa el estado de una solicitud tal como lo entiende la suite, de forma
 * independiente del contrato real. Los adapters traducen la respuesta real
 * (desconocida) a este modelo.
 *
 * TODO(CONTRATO): los estados literales reales (p. ej. "PREAPROBADO", "RECHAZADO")
 * son desconocidos. Aqui se usan estados internos neutrales; el adapter hara el mapeo.
 */

/**
 * Estados internos neutrales de la solicitud.
 * No son los literales del producto; el CreditApiAdapter traducira desde/hacia ellos.
 */
export enum EstadoSolicitud {
  REGISTRADA = 'REGISTRADA',
  PREAPROBADA = 'PREAPROBADA',
  RECHAZADA = 'RECHAZADA',
  CONFIRMADA = 'CONFIRMADA',
  DESCONOCIDO = 'DESCONOCIDO',
}

export interface CreditResponseData {
  /** Identificador real de la solicitud devuelto por el sistema. */
  readonly requestId: string;
  readonly clientName: string;
  readonly propertyValue: number;
  readonly requestedAmount: number;
  readonly termMonths: number;
  readonly documentsComplete: boolean;
  /** Estado interno (mapeado por el adapter desde el estado literal real). */
  readonly state: EstadoSolicitud;
  /** Razon general de rechazo, cuando aplique. */
  readonly rejectionReason?: string;
}
