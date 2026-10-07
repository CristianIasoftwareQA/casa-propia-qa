import { CreditRequestData } from '../models/credit-request.model';
import { CreditResponseData, EstadoSolicitud } from '../models/credit-response.model';
import { NuevaSolicitudPayload, SolicitudApi } from '../api/credit-api.client';

/**
 * Adapter de API: traduce entre el modelo interno de negocio y el contrato real.
 *
 * Usa validaciones de tipo (type guards) y falla claramente cuando falta un mapeo.
 * No usa `any`.
 */

/** Modelo interno -> payload del contrato. */
export function aPayloadApi(data: CreditRequestData): NuevaSolicitudPayload {
  return {
    cliente: data.clientName,
    valorVivienda: data.propertyValue,
    monto: data.requestedAmount,
    plazoMeses: data.termMonths,
  };
}

/** Mapea el estado literal real al estado interno neutral. */
function mapearEstado(literal: string): EstadoSolicitud {
  switch (literal) {
    case 'REGISTRADA':
      return EstadoSolicitud.REGISTRADA;
    case 'PREAPROBADA':
      return EstadoSolicitud.PREAPROBADA;
    case 'RECHAZADA':
      return EstadoSolicitud.RECHAZADA;
    case 'CONFIRMADA':
      return EstadoSolicitud.CONFIRMADA;
    default:
      throw new Error(`Estado literal no reconocido en la respuesta: "${literal}".`);
  }
}

function esObjeto(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

/**
 * Respuesta desconocida -> modelo interno, con type guards.
 * Lanza error descriptivo si falta un campo contractual obligatorio.
 */
export function aModeloInterno(raw: unknown): CreditResponseData {
  if (!esObjeto(raw)) {
    throw new Error('Respuesta de solicitud invalida: no es un objeto.');
  }
  const faltante = (campo: string): never => {
    throw new Error(`Respuesta de solicitud invalida: falta o es invalido el campo "${campo}".`);
  };

  const id = raw['id'];
  const cliente = raw['cliente'];
  const valorVivienda = raw['valorVivienda'];
  const monto = raw['monto'];
  const plazoMeses = raw['plazoMeses'];
  const estado = raw['estado'];
  const documentosPendientes = raw['documentosPendientes'];
  const razonRechazo = raw['razonRechazo'];

  if (typeof id !== 'string') faltante('id');
  if (typeof cliente !== 'string') faltante('cliente');
  if (typeof valorVivienda !== 'number') faltante('valorVivienda');
  if (typeof monto !== 'number') faltante('monto');
  if (typeof plazoMeses !== 'number') faltante('plazoMeses');
  if (typeof estado !== 'string') faltante('estado');
  if (!Array.isArray(documentosPendientes)) faltante('documentosPendientes');

  const docsCompletos = (documentosPendientes as unknown[]).length === 0;

  return {
    requestId: id as string,
    clientName: cliente as string,
    propertyValue: valorVivienda as number,
    requestedAmount: monto as number,
    termMonths: plazoMeses as number,
    documentsComplete: docsCompletos,
    state: mapearEstado(estado as string),
    ...(typeof razonRechazo === 'string' ? { rejectionReason: razonRechazo } : {}),
  };
}

/** Conveniencia: desde la forma tipada SolicitudApi. */
export function desdeSolicitudApi(s: SolicitudApi): CreditResponseData {
  return aModeloInterno(s);
}
