/**
 * Modelo INTERNO de solicitud de credito.
 *
 * Es independiente del contrato real de la API/UI. Los adapters traducen
 * entre este modelo y los payloads/respuestas reales cuando exista contrato.
 */
export interface CreditRequestData {
  /** Nombre del cliente (sintetico, nunca una persona real). */
  readonly clientName: string;
  /** Valor de la vivienda. */
  readonly propertyValue: number;
  /** Monto solicitado de credito. */
  readonly requestedAmount: number;
  /** Plazo en meses. Plazos permitidos conocidos: 120, 180, 240. */
  readonly termMonths: number;
  /** Indica si la documentacion esta completa. */
  readonly documentsComplete: boolean;
}
