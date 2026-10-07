// Configuracion central: URL base (sobrescribible por -DAPI_BASE_URL o variable de
// entorno), rutas del contrato y timeouts. La prueba estructural no abre red.
function fn() {

  var env = karate.env || 'local';
  karate.log('karate.env =', env);

  var apiBaseUrl =
    karate.properties['API_BASE_URL'] ||
    java.lang.System.getenv('API_BASE_URL') ||
    'http://localhost:3000/api';

  var config = {
    env: env,
    apiBaseUrl: apiBaseUrl,

    connectTimeout: 5000,
    // Holgado para tolerar el modo 'demora' del proveedor (hasta 15 s).
    readTimeout: 20000,

    rutas: {
      salud: apiBaseUrl + '/salud',
      solicitudes: apiBaseUrl + '/solicitudes',
      configProveedor: apiBaseUrl + '/simulacion/proveedor'
    },

    rutaSolicitud: function (id) { return apiBaseUrl + '/solicitudes/' + id; },
    rutaEvaluacion: function (id) { return apiBaseUrl + '/solicitudes/' + id + '/evaluacion'; },
    rutaDocumentos: function (id) { return apiBaseUrl + '/solicitudes/' + id + '/documentos'; },
    rutaConfirmacion: function (id) { return apiBaseUrl + '/solicitudes/' + id + '/confirmacion'; },

    documentosRequeridos: ['CEDULA', 'CERTIFICADO_INGRESOS', 'AVALUO_VIVIENDA'],
    umbralJornadaMs: 800
  };

  config.requireBaseUrl = function () {
    if (!config.apiBaseUrl || config.apiBaseUrl.length === 0) {
      throw new Error('Falta API_BASE_URL: definala o pase -DAPI_BASE_URL=...');
    }
    return config.apiBaseUrl;
  };

  karate.configure('connectTimeout', config.connectTimeout);
  karate.configure('readTimeout', config.readTimeout);
  // No seguir redirecciones que puedan ocultar codigos reales.
  karate.configure('followRedirects', false);

  return config;
}
