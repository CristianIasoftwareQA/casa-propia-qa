/**
 * Estados reales del producto (contrato) y codigos de error.
 */
function estados() {
  return {
    // Estados del ciclo de vida (EstadoSolicitud en el contrato).
    REGISTRADA: 'REGISTRADA',
    PREAPROBADA: 'PREAPROBADA',
    RECHAZADA: 'RECHAZADA',
    CONFIRMADA: 'CONFIRMADA',

    // Codigos de error del contrato (schema Error.codigo).
    error: {
      DATOS_INVALIDOS: 'DATOS_INVALIDOS',
      SOLICITUD_NO_ENCONTRADA: 'SOLICITUD_NO_ENCONTRADA',
      TRANSICION_NO_PERMITIDA: 'TRANSICION_NO_PERMITIDA',
      DOCUMENTOS_INCOMPLETOS: 'DOCUMENTOS_INCOMPLETOS',
      PROVEEDOR_NO_DISPONIBLE: 'PROVEEDOR_NO_DISPONIBLE',
      RECURSO_NO_ENCONTRADO: 'RECURSO_NO_ENCONTRADO',
      ERROR_INTERNO: 'ERROR_INTERNO'
    }
  };
}
