import { expect } from '@playwright/test';
import { When, Then } from '../support/fixtures';
import { desdeSolicitudApi } from '../adapters/credit-api.adapter';
import { compararRegistros, describirDiferencias } from '../utils/comparisons';
import { EstadoSolicitud } from '../models/credit-response.model';

/**
 * Steps de continuidad del proveedor (RF05) desde la interfaz.
 * La UI no envia cabecera por peticion: se usa la configuracion GLOBAL del proveedor.
 * Cada cambio se verifica por API dentro del propio cliente (configurarProveedor).
 */

function aComparable(r: {
  requestId: string;
  clientName: string;
  propertyValue: number;
  requestedAmount: number;
  termMonths: number;
  documentsComplete: boolean;
  state: EstadoSolicitud;
  rejectionReason?: string;
}): Record<string, unknown> {
  return {
    id: r.requestId,
    cliente: r.clientName,
    valorVivienda: r.propertyValue,
    monto: r.requestedAmount,
    plazo: r.termMonths,
    documentos: r.documentsComplete,
    estado: r.state,
    razonRechazo: r.rejectionReason ?? null,
  };
}

When('configuro el proveedor en modo demora con {int} milisegundos', async ({ api }, ms: number) => {
  await api.configurarProveedor('demora', ms);
});

When('configuro el proveedor en modo no disponible', async ({ api }) => {
  await api.configurarNoDisponible();
});

When('restauro el proveedor a modo normal', async ({ api }) => {
  await api.restaurarProveedor();
});

When('guardo el estado inicial de la solicitud por API', async ({ ctx, api }) => {
  expect(ctx.requestId).toBeTruthy();
  const res = await api.consultarSolicitud(ctx.requestId!);
  expect(res.status).toBe(200);
  ctx.stateBefore = desdeSolicitudApi(res.body);
});

Then('al consultar la solicitud por API el estado es preaprobada', async ({ ctx, api }) => {
  const res = await api.consultarSolicitud(ctx.requestId!);
  expect(res.status).toBe(200);
  const actual = desdeSolicitudApi(res.body);
  expect(actual.state).toBe(EstadoSolicitud.PREAPROBADA);
});

Then('al consultar la solicitud por API el estado y los datos no cambiaron', async ({ ctx, api }) => {
  expect(ctx.stateBefore, 'Debe existir el estado inicial').toBeDefined();
  const res = await api.consultarSolicitud(ctx.requestId!);
  expect(res.status).toBe(200);
  const despues = desdeSolicitudApi(res.body);
  const comp = compararRegistros(aComparable(ctx.stateBefore!), aComparable(despues));
  expect(comp.iguales, describirDiferencias(comp)).toBe(true);
  // El estado sigue siendo REGISTRADA (no cambió por la indisponibilidad).
  expect(despues.state).toBe(ctx.stateBefore!.state);
});
