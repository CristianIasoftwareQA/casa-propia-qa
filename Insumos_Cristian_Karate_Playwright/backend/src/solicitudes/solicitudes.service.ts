import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import {
  DOCUMENTOS_REQUERIDOS,
  PLAZOS_PERMITIDOS,
  PORCENTAJE_FINANCIABLE,
  Solicitud,
  SolicitudRespuesta,
  TipoDocumento,
  aRespuesta,
} from './solicitud.model';
import { SolicitudesRepository } from './solicitudes.repository';
import { ModoProveedor, ProveedorEvaluacionService } from '../simulacion/proveedor-evaluacion.service';

interface ErrorCampo {
  campo: string;
  mensaje: string;
}

const RAZON_RECHAZO = 'El monto solicitado supera el porcentaje financiable del valor de la vivienda.';

@Injectable()
export class SolicitudesService {
  constructor(
    private readonly repo: SolicitudesRepository,
    private readonly proveedor: ProveedorEvaluacionService,
  ) {}

  registrar(body: any): SolicitudRespuesta {
    const errores = this.validarRegistro(body);
    if (errores.length > 0) {
      throw new BadRequestException({
        codigo: 'DATOS_INVALIDOS',
        mensaje: 'La solicitud contiene datos inválidos',
        detalles: errores,
      });
    }
    const ahora = new Date().toISOString();
    const solicitud: Solicitud = {
      id: this.repo.siguienteId(),
      cliente: String(body.cliente).trim(),
      valorVivienda: body.valorVivienda,
      monto: body.monto,
      plazoMeses: body.plazoMeses,
      estado: 'REGISTRADA',
      razonRechazo: null,
      documentos: [],
      creadaEn: ahora,
      evaluadaEn: null,
      confirmadaEn: null,
      actualizadaEn: ahora,
    };
    return aRespuesta(this.repo.guardar(solicitud));
  }

  consultar(id: string): SolicitudRespuesta {
    return aRespuesta(this.obtener(id));
  }

  async evaluar(id: string, modoSolicitado?: ModoProveedor): Promise<SolicitudRespuesta> {
    const inicial = this.obtener(id);
    if (inicial.estado !== 'REGISTRADA') {
      throw this.transicionNoPermitida(inicial, 'Solo se puede evaluar una solicitud en estado REGISTRADA');
    }

    // Puede lanzar 503 PROVEEDOR_NO_DISPONIBLE; en ese caso la solicitud no se modifica.
    await this.proveedor.consultar(modoSolicitado);

    const s = this.obtener(id);
    if (s.estado !== 'REGISTRADA') {
      throw this.transicionNoPermitida(s, 'La solicitud cambió de estado durante la evaluación');
    }

    const dentroDelLimite = s.monto * 100 < s.valorVivienda * PORCENTAJE_FINANCIABLE;
    const ahora = new Date().toISOString();
    s.estado = dentroDelLimite ? 'PREAPROBADA' : 'RECHAZADA';
    s.razonRechazo = dentroDelLimite ? null : RAZON_RECHAZO;
    s.evaluadaEn = ahora;
    s.actualizadaEn = ahora;
    return aRespuesta(this.repo.guardar(s));
  }

  registrarDocumentos(id: string, body: any): SolicitudRespuesta {
    const s = this.obtener(id);
    const docs = body?.documentos;
    if (!Array.isArray(docs) || docs.length === 0) {
      throw new BadRequestException({
        codigo: 'DATOS_INVALIDOS',
        mensaje: 'Debe enviar al menos un documento',
        detalles: [{ campo: 'documentos', mensaje: 'Debe ser una lista no vacía' }],
      });
    }
    const invalidos = docs.filter((d: unknown) => !DOCUMENTOS_REQUERIDOS.includes(d as TipoDocumento));
    if (invalidos.length > 0) {
      throw new BadRequestException({
        codigo: 'DATOS_INVALIDOS',
        mensaje: 'Tipo de documento no reconocido',
        detalles: [{ campo: 'documentos', mensaje: `No reconocidos: ${invalidos.join(', ')}` }],
      });
    }
    if (s.estado !== 'REGISTRADA' && s.estado !== 'PREAPROBADA') {
      throw this.transicionNoPermitida(s, `No se pueden registrar documentos en estado ${s.estado}`);
    }
    for (const d of docs as TipoDocumento[]) {
      if (!s.documentos.includes(d)) s.documentos.push(d);
    }
    s.actualizadaEn = new Date().toISOString();
    return aRespuesta(this.repo.guardar(s));
  }

  confirmar(id: string): SolicitudRespuesta {
    const s = this.obtener(id);
    if (s.estado !== 'PREAPROBADA' && s.estado !== 'CONFIRMADA') {
      throw this.transicionNoPermitida(s, 'Solo se puede confirmar una solicitud PREAPROBADA');
    }
    const pendientes = DOCUMENTOS_REQUERIDOS.filter((d) => !s.documentos.includes(d));
    if (pendientes.length > 0) {
      throw new ConflictException({
        codigo: 'DOCUMENTOS_INCOMPLETOS',
        mensaje: 'Faltan documentos requeridos para confirmar',
        estadoActual: s.estado,
        detalles: pendientes.map((d) => ({ campo: 'documentos', mensaje: `Falta ${d}` })),
      });
    }
    const ahora = new Date().toISOString();
    s.estado = 'CONFIRMADA';
    s.confirmadaEn = ahora;
    s.actualizadaEn = ahora;
    return aRespuesta(this.repo.guardar(s));
  }

  // ---------------------------------------------------------------------------

  private obtener(id: string): Solicitud {
    const s = this.repo.buscar(id);
    if (!s) {
      throw new NotFoundException({ codigo: 'SOLICITUD_NO_ENCONTRADA', mensaje: `No existe la solicitud ${id}` });
    }
    return s;
  }

  private transicionNoPermitida(s: Solicitud, mensaje: string) {
    return new ConflictException({ codigo: 'TRANSICION_NO_PERMITIDA', mensaje, estadoActual: s.estado });
  }

  private validarRegistro(body: any): ErrorCampo[] {
    const errores: ErrorCampo[] = [];
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return [{ campo: 'body', mensaje: 'Debe enviar un objeto JSON' }];
    }
    if (typeof body.cliente !== 'string' || body.cliente.trim().length === 0) {
      errores.push({ campo: 'cliente', mensaje: 'El cliente es obligatorio' });
    } else if (body.cliente.trim().length > 120) {
      errores.push({ campo: 'cliente', mensaje: 'Máximo 120 caracteres' });
    }
    for (const campo of ['valorVivienda', 'monto']) {
      const v = body[campo];
      if (typeof v !== 'number' || !Number.isSafeInteger(v) || v <= 0) {
        errores.push({ campo, mensaje: 'Debe ser un número entero positivo' });
      }
    }
    if (!PLAZOS_PERMITIDOS.includes(body.plazoMeses)) {
      errores.push({ campo: 'plazoMeses', mensaje: `Debe ser uno de: ${PLAZOS_PERMITIDOS.join(', ')}` });
    }
    return errores;
  }
}
