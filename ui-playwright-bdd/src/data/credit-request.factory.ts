import { CreditRequestData } from '../models/credit-request.model';

// Fabrica de datos sinteticos. Cada llamada genera un cliente unico
// (QA-AUTO-timestamp-random); incluye variantes validas e invalidas.

export const VALOR_VIVIENDA_BASE = 100_000_000;
export const MONTO_INFERIOR_AL_LIMITE = 79_000_000;
export const MONTO_LIMITE_INCLUSIVO = 80_000_000;
export const MONTO_SUPERIOR_AL_LIMITE = 80_000_001;
export const PLAZOS_PERMITIDOS: ReadonlyArray<number> = [120, 180, 240];

export function generarNombreSintetico(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `QA-AUTO-${timestamp}-${random}`;
}

function base(overrides: Partial<CreditRequestData>): CreditRequestData {
  return {
    clientName: generarNombreSintetico(),
    propertyValue: VALOR_VIVIENDA_BASE,
    requestedAmount: MONTO_INFERIOR_AL_LIMITE,
    termMonths: 120,
    documentsComplete: false,
    ...overrides,
  };
}

export const CreditRequestFactory = {
  inferiorAlLimite(): CreditRequestData {
    return base({ requestedAmount: MONTO_INFERIOR_AL_LIMITE });
  },

  exactamenteEnElLimite(): CreditRequestData {
    return base({ requestedAmount: MONTO_LIMITE_INCLUSIVO });
  },

  superiorAlLimite(): CreditRequestData {
    return base({ requestedAmount: MONTO_SUPERIOR_AL_LIMITE });
  },

  conPlazo120(): CreditRequestData {
    return base({ termMonths: 120 });
  },

  conPlazo180(): CreditRequestData {
    return base({ termMonths: 180 });
  },

  conPlazo240(): CreditRequestData {
    return base({ termMonths: 240 });
  },

  conClienteAusente(): CreditRequestData {
    const { clientName: _omitido, ...resto } = base({});
    void _omitido;
    return { ...resto, clientName: undefined as unknown as string };
  },

  conClienteVacio(): CreditRequestData {
    return base({ clientName: '' });
  },

  conValorViviendaCero(): CreditRequestData {
    return base({ propertyValue: 0 });
  },

  conValorViviendaNegativo(): CreditRequestData {
    return base({ propertyValue: -1 });
  },

  conMontoCero(): CreditRequestData {
    return base({ requestedAmount: 0 });
  },

  conMontoNegativo(): CreditRequestData {
    return base({ requestedAmount: -1 });
  },

  conValorDecimal(): CreditRequestData {
    return base({ propertyValue: 100_000_000.5, requestedAmount: 79_000_000.25 });
  },

  conPlazoInvalido(): CreditRequestData {
    return base({ termMonths: 99 });
  },
} as const;
