import { normalizeWhitespace } from '../utils/money';
import { EstadoSolicitud } from '../models/credit-response.model';

/** Mapea la etiqueta de estado visible en la UI (capitalizada) al estado interno. */
export function estadoVisibleAInterno(texto: string): EstadoSolicitud {
  const t = normalizeWhitespace(texto).toUpperCase();
  switch (t) {
    case 'REGISTRADA':
      return EstadoSolicitud.REGISTRADA;
    case 'PREAPROBADA':
      return EstadoSolicitud.PREAPROBADA;
    case 'RECHAZADA':
      return EstadoSolicitud.RECHAZADA;
    case 'CONFIRMADA':
      return EstadoSolicitud.CONFIRMADA;
    default:
      throw new Error(`Etiqueta de estado visible no reconocida: "${texto}".`);
  }
}
