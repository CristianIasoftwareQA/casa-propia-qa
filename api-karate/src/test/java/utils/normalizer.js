// Compara una solicitud antes/despues de una operacion. No excluye campos de
// negocio; camposTecnicosVariables queda vacia hasta que el contrato aporte campos
// tecnicos variables (p. ej. timestamps).
function normalizer() {

  var camposTecnicosVariables = [];

  function esTecnico(campo) {
    for (var i = 0; i < camposTecnicosVariables.length; i++) {
      if (camposTecnicosVariables[i] === campo) {
        return true;
      }
    }
    return false;
  }

  function normalizarValor(valor) {
    if (typeof valor === 'string') {
      return valor.replace(/\s+/g, ' ').trim();
    }
    return valor;
  }

  function comparar(a, b) {
    var diferencias = [];
    var claves = {};
    var k;
    for (k in a) { if (a.hasOwnProperty(k)) { claves[k] = true; } }
    for (k in b) { if (b.hasOwnProperty(k)) { claves[k] = true; } }

    for (k in claves) {
      if (!claves.hasOwnProperty(k)) { continue; }
      if (esTecnico(k)) { continue; }
      var va = normalizarValor(a ? a[k] : undefined);
      var vb = normalizarValor(b ? b[k] : undefined);
      if ('' + va !== '' + vb) {
        diferencias.push({ campo: k, valorA: va, valorB: vb });
      }
    }

    return {
      iguales: diferencias.length === 0,
      diferencias: diferencias
    };
  }

  return {
    camposTecnicosVariables: camposTecnicosVariables,
    comparar: comparar
  };
}
