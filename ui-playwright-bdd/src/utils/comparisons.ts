import { parseMoney, normalizeWhitespace } from './money';

// Compara solicitudes campo a campo. No se excluye ningún campo de negocio;
// camposTecnicosVariables queda vacía hasta que el contrato aporte campos técnicos
// legítimamente variables (p. ej. timestamps).
export const camposTecnicosVariables: ReadonlyArray<string> = [];

export interface DiferenciaCampo {
  readonly campo: string;
  readonly valorA: unknown;
  readonly valorB: unknown;
}

export interface ResultadoComparacion {
  readonly iguales: boolean;
  readonly diferencias: ReadonlyArray<DiferenciaCampo>;
}

type Registro = Readonly<Record<string, unknown>>;

function normalizarValor(valor: unknown): unknown {
  if (typeof valor === 'string') {
    const texto = normalizeWhitespace(valor);
    if (/\d/.test(texto) && /^[\s\d.,$-]+$/.test(texto)) {
      try {
        return parseMoney(texto);
      } catch {
        return texto;
      }
    }
    return texto;
  }
  return valor;
}

export function compararRegistros(a: Registro, b: Registro): ResultadoComparacion {
  const diferencias: DiferenciaCampo[] = [];
  const claves = new Set<string>([...Object.keys(a), ...Object.keys(b)]);

  for (const clave of claves) {
    if (camposTecnicosVariables.includes(clave)) {
      continue;
    }
    const valorA = normalizarValor(a[clave]);
    const valorB = normalizarValor(b[clave]);
    if (valorA !== valorB) {
      diferencias.push({ campo: clave, valorA, valorB });
    }
  }

  return { iguales: diferencias.length === 0, diferencias };
}

export function describirDiferencias(resultado: ResultadoComparacion): string {
  if (resultado.iguales) {
    return 'Sin diferencias de negocio.';
  }
  return resultado.diferencias
    .map((d) => `Campo "${d.campo}": A=${JSON.stringify(d.valorA)} vs B=${JSON.stringify(d.valorB)}`)
    .join('; ');
}
