// Fabrica de datos sinteticos de solicitudes. Cada llamada genera un cliente unico
// (QA-AUTO-timestamp-random); incluye variantes validas e invalidas.
function fabrica() {

  var VALOR_VIVIENDA_BASE = 100000000;
  var MONTO_INFERIOR_AL_LIMITE = 79000000;
  var MONTO_LIMITE_INCLUSIVO = 80000000;
  var MONTO_SUPERIOR_AL_LIMITE = 80000001;
  var PLAZOS_PERMITIDOS = [120, 180, 240];

  function nombreSintetico() {
    var ts = new Date().getTime();
    var rnd = ('' + Math.random()).slice(2, 8);
    return 'QA-AUTO-' + ts + '-' + rnd;
  }

  function base(overrides) {
    var solicitud = {
      clientName: nombreSintetico(),
      propertyValue: VALOR_VIVIENDA_BASE,
      requestedAmount: MONTO_INFERIOR_AL_LIMITE,
      termMonths: 120,
      documentsComplete: false
    };
    if (overrides) {
      for (var k in overrides) {
        if (overrides.hasOwnProperty(k)) {
          solicitud[k] = overrides[k];
        }
      }
    }
    return solicitud;
  }

  return {
    constantes: {
      VALOR_VIVIENDA_BASE: VALOR_VIVIENDA_BASE,
      MONTO_INFERIOR_AL_LIMITE: MONTO_INFERIOR_AL_LIMITE,
      MONTO_LIMITE_INCLUSIVO: MONTO_LIMITE_INCLUSIVO,
      MONTO_SUPERIOR_AL_LIMITE: MONTO_SUPERIOR_AL_LIMITE,
      PLAZOS_PERMITIDOS: PLAZOS_PERMITIDOS
    },

    // Posicion frente al limite del 80%
    inferiorAlLimite: function () { return base({ requestedAmount: MONTO_INFERIOR_AL_LIMITE }); },
    exactamenteEnElLimite: function () { return base({ requestedAmount: MONTO_LIMITE_INCLUSIVO }); },
    superiorAlLimite: function () { return base({ requestedAmount: MONTO_SUPERIOR_AL_LIMITE }); },

    // Plazos permitidos
    conPlazo120: function () { return base({ termMonths: 120 }); },
    conPlazo180: function () { return base({ termMonths: 180 }); },
    conPlazo240: function () { return base({ termMonths: 240 }); },

    // Datos invalidos
    conClienteAusente: function () { var s = base({}); delete s.clientName; return s; },
    conClienteVacio: function () { return base({ clientName: '' }); },
    conValorViviendaCero: function () { return base({ propertyValue: 0 }); },
    conValorViviendaNegativo: function () { return base({ propertyValue: -1 }); },
    conMontoCero: function () { return base({ requestedAmount: 0 }); },
    conMontoNegativo: function () { return base({ requestedAmount: -1 }); },
    conValorDecimal: function () { return base({ propertyValue: 100000000.5, requestedAmount: 79000000.25 }); },
    conPlazoInvalido: function () { return base({ termMonths: 99 }); },

    // Traduce el modelo interno al payload del contrato. Un campo undefined
    // (p. ej. cliente ausente) no se incluye en el payload.
    aPayload: function (solicitud) {
      var payload = {};
      if (solicitud.clientName !== undefined) { payload.cliente = solicitud.clientName; }
      if (solicitud.propertyValue !== undefined) { payload.valorVivienda = solicitud.propertyValue; }
      if (solicitud.requestedAmount !== undefined) { payload.monto = solicitud.requestedAmount; }
      if (solicitud.termMonths !== undefined) { payload.plazoMeses = solicitud.termMonths; }
      return payload;
    }
  };
}
