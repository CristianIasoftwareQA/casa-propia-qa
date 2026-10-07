/**
 * Esquemas de validacion (match) para respuestas reales de la API (contrato).
 *
 * Uso:
 *   * def schemas = call read('classpath:data/schemas.js')
 *   * match response == schemas.solicitud
 */
function schemas() {

  // Marcadores de tipo Karate; campos opcionales/nullable marcados con '##'.
  var solicitud = {
    id: '#string',
    cliente: '#string',
    valorVivienda: '#number',
    monto: '#number',
    plazoMeses: '#number',
    estado: '#string',
    razonRechazo: '##string',
    documentos: '#[]',
    documentosPendientes: '#[]',
    creadaEn: '#string',
    evaluadaEn: '##string',
    confirmadaEn: '##string',
    actualizadaEn: '#string'
  };

  var error = {
    codigo: '#string',
    mensaje: '#string',
    estadoActual: '##string',
    detalles: '##[]'
  };

  return {
    solicitud: solicitud,
    error: error
  };
}
