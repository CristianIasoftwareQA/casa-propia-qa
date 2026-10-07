import { CreditRequestData } from './credit-request.model';
import { CreditResponseData } from './credit-response.model';

export interface CapaResultado {
  readonly state?: string;
  readonly requestId?: string;
  readonly fields?: Readonly<Record<string, unknown>>;
}

/** Contexto por escenario. No se comparte estado mutable entre escenarios. */
export interface TestContext {
  requestData?: CreditRequestData;
  requestId?: string;
  stateBefore?: CreditResponseData;
  stateAfter?: CreditResponseData;
  uiResult?: CapaResultado;
  apiResult?: CreditResponseData;
  errorMessages: string[];
}

export function createTestContext(): TestContext {
  return { errorMessages: [] };
}
