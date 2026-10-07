export type EstadoSolicitud = 'REGISTRADA' | 'PREAPROBADA' | 'RECHAZADA' | 'CONFIRMADA';

export const PLAZOS_PERMITIDOS = [120, 180, 240] as const;

export const DOCUMENTOS_REQUERIDOS = ['CEDULA', 'CERTIFICADO_INGRESOS', 'AVALUO_VIVIENDA'] as const;
export type TipoDocumento = (typeof DOCUMENTOS_REQUERIDOS)[number];

/** Porcentaje máximo financiable del valor de la vivienda. */
export const PORCENTAJE_FINANCIABLE = 80;

export interface Solicitud {
  id: string;
  cliente: string;
  valorVivienda: number;
  monto: number;
  plazoMeses: number;
  estado: EstadoSolicitud;
  razonRechazo: string | null;
  documentos: TipoDocumento[];
  creadaEn: string;
  evaluadaEn: string | null;
  confirmadaEn: string | null;
  actualizadaEn: string;
}

export interface SolicitudRespuesta extends Solicitud {
  documentosPendientes: TipoDocumento[];
}

export function aRespuesta(s: Solicitud): SolicitudRespuesta {
  return {
    ...s,
    documentos: [...s.documentos],
    documentosPendientes: DOCUMENTOS_REQUERIDOS.filter((d) => !s.documentos.includes(d)),
  };
}
