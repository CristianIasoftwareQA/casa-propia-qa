import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, timeout } from 'rxjs';

export type EstadoSolicitud = 'REGISTRADA' | 'PREAPROBADA' | 'RECHAZADA' | 'CONFIRMADA';
export type TipoDocumento = 'CEDULA' | 'CERTIFICADO_INGRESOS' | 'AVALUO_VIVIENDA';

export interface Solicitud {
  id: string;
  cliente: string;
  valorVivienda: number;
  monto: number;
  plazoMeses: number;
  estado: EstadoSolicitud;
  razonRechazo: string | null;
  documentos: TipoDocumento[];
  documentosPendientes: TipoDocumento[];
  creadaEn: string;
  evaluadaEn: string | null;
  confirmadaEn: string | null;
  actualizadaEn: string;
}

export interface NuevaSolicitud {
  cliente: string;
  valorVivienda: number;
  monto: number;
  plazoMeses: number;
}

export interface ErrorApi {
  codigo: string;
  mensaje: string;
  estadoActual?: EstadoSolicitud;
  detalles?: { campo: string; mensaje: string }[];
}

const BASE = '/api/solicitudes';
const LIMITE_ESPERA_MS = 20000;

@Injectable({ providedIn: 'root' })
export class SolicitudesApi {
  private readonly http = inject(HttpClient);

  registrar(datos: NuevaSolicitud): Observable<Solicitud> {
    return this.http.post<Solicitud>(BASE, datos);
  }

  consultar(id: string): Observable<Solicitud> {
    return this.http.get<Solicitud>(`${BASE}/${encodeURIComponent(id)}`);
  }

  evaluar(id: string): Observable<Solicitud> {
    return this.http
      .post<Solicitud>(`${BASE}/${encodeURIComponent(id)}/evaluacion`, {})
      .pipe(timeout(LIMITE_ESPERA_MS));
  }

  registrarDocumentos(id: string, documentos: TipoDocumento[]): Observable<Solicitud> {
    return this.http.post<Solicitud>(`${BASE}/${encodeURIComponent(id)}/documentos`, { documentos });
  }

  confirmar(id: string): Observable<Solicitud> {
    return this.http.post<Solicitud>(`${BASE}/${encodeURIComponent(id)}/confirmacion`, {});
  }
}
