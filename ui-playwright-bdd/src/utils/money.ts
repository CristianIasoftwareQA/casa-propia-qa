// Normalizacion monetaria: convierte texto de dinero (es-CO) a numero para comparar
// UI vs API. Interpreta el ultimo separador como decimal si lo siguen 1-2 digitos;
// en otro caso trata ',' y '.' como separadores de miles.
export function parseMoney(value: string | number): number {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new Error(`Valor monetario numerico invalido: ${value}`);
    }
    return value;
  }

  const original = value;
  let cleaned = value.trim();

  if (cleaned.length === 0) {
    throw new Error('Valor monetario vacio: no se puede normalizar.');
  }

  const negative = /^-/.test(cleaned) || /^\(.*\)$/.test(cleaned);

  // Quitar todo lo que no sea digito, coma o punto.
  cleaned = cleaned.replace(/[^\d.,]/g, '');

  if (cleaned.length === 0) {
    throw new Error(`Valor monetario no numerico: "${original}".`);
  }

  // Detectar separador decimal: ultimo '.' o ',' seguido de 1 o 2 digitos al final.
  const decimalMatch = cleaned.match(/[.,](\d{1,2})$/);
  let decimalPart = '';
  let integerSource = cleaned;

  if (decimalMatch) {
    const sepIndex = cleaned.lastIndexOf(decimalMatch[0][0]!);
    // Solo tratar como decimal si antes de el hay otro separador o varios digitos.
    const before = cleaned.slice(0, sepIndex);
    const looksLikeThousands = /^\d{1,3}([.,]\d{3})+$/.test(cleaned);
    if (!looksLikeThousands) {
      decimalPart = decimalMatch[1]!;
      integerSource = before;
    }
  }

  const integerDigits = integerSource.replace(/[.,]/g, '');
  const normalized = decimalPart ? `${integerDigits}.${decimalPart}` : integerDigits;

  const result = Number(normalized);
  if (Number.isNaN(result)) {
    throw new Error(`Valor monetario no numerico: "${original}".`);
  }

  return negative ? -result : result;
}

/**
 * Normaliza espacios en blanco de un texto (colapsa espacios y recorta extremos).
 */
export function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}
