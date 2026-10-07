import { APIRequestContext, request as pwRequest } from '@playwright/test';
import { requireApiBaseUrl } from '../support/environment';

/**
 * Cliente de API de Casa Propia.
 *
 * Encapsula las operaciones REALES del contrato. La base se recibe por variable de
 * entorno (API_BASE_URL). No duplica URLs en steps ni pages.
 *
 * Para los mecanismos de simulacion (RF05) se usa la configuracion global del
 * proveedor (PUT/GET /simulacion/proveedor): la UI no envia la cabecera por peticion,
 * por lo que la demora/indisponibilidad del flujo real de la UI se activa de forma global.
 */

export type ModoProveedor = 'normal' | 'demora' | 'no-disponible';
export type TipoDocumento = 'CEDULA' | 'CERTIFICADO_INGRESOS' | 'AVALUO_VIVIENDA';

export interface NuevaSolicitudPayload {
  cliente: string;
  valorVivienda: number;
  monto: number;
  plazoMeses: number;
}

export interface ConfiguracionProveedor {
  modo: ModoProveedor;
  demoraMs: number;
}

/** Respuesta cruda de la API (forma del contrato). Se valida en el adapter. */
export interface SolicitudApi {
  id: string;
  cliente: string;
  valorVivienda: number;
  monto: number;
  plazoMeses: number;
  estado: string;
  razonRechazo: string | null;
  documentos: TipoDocumento[];
  documentosPendientes: TipoDocumento[];
  creadaEn: string;
  evaluadaEn: string | null;
  confirmadaEn: string | null;
  actualizadaEn: string;
}

export interface RespuestaApi<T> {
  status: number;
  body: T;
}

export class CreditApiClient {
  private baseUrl: string | null = null;

  private constructor(private readonly ctx: APIRequestContext) {}

  /**
   * Crea un cliente con su propio contexto de red. Recuerda llamar a dispose().
   *
   * NO valida API_BASE_URL en la construccion: la validacion es DIFERIDA al primer
   * metodo que realiza una peticion (requireConfiguredBaseUrl). Asi, una prueba
   * estructural que no haga llamadas API no falla por configuracion, pero una prueba
   * funcional que use la red SI exige API_BASE_URL real.
   */
  static async create(): Promise<CreditApiClient> {
    const ctx = await pwRequest.newContext();
    return new CreditApiClient(ctx);
  }

  /**
   * Resuelve y memoiza la URL base. Falla con mensaje claro si falta API_BASE_URL.
   * Se invoca al inicio de cada operacion HTTP (validacion diferida).
   */
  private requireConfiguredBaseUrl(): string {
    if (this.baseUrl === null) {
      this.baseUrl = requireApiBaseUrl();
    }
    return this.baseUrl;
  }

  async dispose(): Promise<void> {
    await this.ctx.dispose();
  }

  // --------------------------------------------------------------- solicitudes

  async crearSolicitud(payload: NuevaSolicitudPayload): Promise<RespuestaApi<SolicitudApi>> {
    const base = this.requireConfiguredBaseUrl();
    const res = await this.ctx.post(`${base}/solicitudes`, { data: payload });
    return { status: res.status(), body: (await res.json()) as SolicitudApi };
  }

  async consultarSolicitud(id: string): Promise<RespuestaApi<SolicitudApi>> {
    const base = this.requireConfiguredBaseUrl();
    const res = await this.ctx.get(`${base}/solicitudes/${encodeURIComponent(id)}`);
    return { status: res.status(), body: (await res.json()) as SolicitudApi };
  }

  /**
   * Evalua una solicitud. Si se pasa `modo`, usa la cabecera por peticion
   * X-Simulacion-Proveedor (aislado). Si no, usa la configuracion global.
   */
  async evaluarSolicitud(
    id: string,
    modo?: ModoProveedor
  ): Promise<RespuestaApi<SolicitudApi>> {
    const base = this.requireConfiguredBaseUrl();
    const headers = modo ? { 'X-Simulacion-Proveedor': modo } : undefined;
    const res = await this.ctx.post(
      `${base}/solicitudes/${encodeURIComponent(id)}/evaluacion`,
      { data: {}, ...(headers ? { headers } : {}) }
    );
    return { status: res.status(), body: (await res.json()) as SolicitudApi };
  }

  async registrarDocumentos(
    id: string,
    documentos: TipoDocumento[]
  ): Promise<RespuestaApi<SolicitudApi>> {
    const base = this.requireConfiguredBaseUrl();
    const res = await this.ctx.post(
      `${base}/solicitudes/${encodeURIComponent(id)}/documentos`,
      { data: { documentos } }
    );
    return { status: res.status(), body: (await res.json()) as SolicitudApi };
  }

  async confirmarSolicitud(id: string): Promise<RespuestaApi<SolicitudApi>> {
    const base = this.requireConfiguredBaseUrl();
    const res = await this.ctx.post(
      `${base}/solicitudes/${encodeURIComponent(id)}/confirmacion`,
      { data: {} }
    );
    return { status: res.status(), body: (await res.json()) as SolicitudApi };
  }

  // --------------------------------------------------------------- proveedor (RF05)

  async consultarConfiguracionProveedor(): Promise<ConfiguracionProveedor> {
    const base = this.requireConfiguredBaseUrl();
    const res = await this.ctx.get(`${base}/simulacion/proveedor`);
    return (await res.json()) as ConfiguracionProveedor;
  }

  /** Aplica un modo global y VERIFICA el resultado mediante GET. */
  async configurarProveedor(
    modo: ModoProveedor,
    demoraMs = 4000
  ): Promise<ConfiguracionProveedor> {
    const base = this.requireConfiguredBaseUrl();
    await this.ctx.put(`${base}/simulacion/proveedor`, { data: { modo, demoraMs } });
    const verificado = await this.consultarConfiguracionProveedor();
    if (verificado.modo !== modo) {
      throw new Error(
        `No se pudo aplicar el modo del proveedor: esperado "${modo}", obtenido "${verificado.modo}".`
      );
    }
    return verificado;
  }

  configurarNoDisponible(): Promise<ConfiguracionProveedor> {
    return this.configurarProveedor('no-disponible');
  }

  restaurarProveedor(): Promise<ConfiguracionProveedor> {
    return this.configurarProveedor('normal', 4000);
  }
}
