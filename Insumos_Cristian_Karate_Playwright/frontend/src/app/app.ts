import { Component, OnDestroy, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { TimeoutError } from 'rxjs';
import { ErrorApi, Solicitud, SolicitudesApi, TipoDocumento } from './solicitudes.api';

type Aviso = { tipo: 'exito' | 'info' | 'error' | 'advertencia'; texto: string; testId: string };

const AVISO_DEMORA_MS = 2000;

@Component({
  selector: 'app-root',
  imports: [FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnDestroy {
  private readonly api = inject(SolicitudesApi);

  readonly plazos = [120, 180, 240];
  readonly tiposDocumento: { valor: TipoDocumento; etiqueta: string }[] = [
    { valor: 'CEDULA', etiqueta: 'Cédula de ciudadanía' },
    { valor: 'CERTIFICADO_INGRESOS', etiqueta: 'Certificado de ingresos' },
    { valor: 'AVALUO_VIVIENDA', etiqueta: 'Avalúo de la vivienda' },
  ];

  // Formulario de registro
  cliente = '';
  valorVivienda: number | null = null;
  monto: number | null = null;
  plazoMeses: number | null = null;
  idConsulta = '';
  documentosSeleccionados: Partial<Record<TipoDocumento, boolean>> = {};

  readonly solicitud = signal<Solicitud | null>(null);
  readonly aviso = signal<Aviso | null>(null);
  readonly erroresRegistro = signal<string[]>([]);
  readonly ocupado = signal(false);
  readonly evaluando = signal(false);
  readonly evaluacionDemorada = signal(false);
  private temporizadorDemora?: ReturnType<typeof setTimeout>;

  ngOnDestroy(): void {
    clearTimeout(this.temporizadorDemora);
  }

  // ---------------------------------------------------------------- acciones

  registrar(): void {
    this.limpiarMensajes();
    const errores: string[] = [];
    if (!this.cliente.trim()) errores.push('Ingresa el nombre del cliente.');
    if (this.valorVivienda == null) errores.push('Ingresa el valor de la vivienda.');
    if (this.monto == null) errores.push('Ingresa el monto solicitado.');
    if (this.plazoMeses == null) errores.push('Selecciona el plazo.');
    if (errores.length) {
      this.erroresRegistro.set(errores);
      return;
    }
    this.ocupado.set(true);
    this.api
      .registrar({
        cliente: this.cliente,
        valorVivienda: Number(this.valorVivienda),
        monto: Number(this.monto),
        plazoMeses: Number(this.plazoMeses),
      })
      .subscribe({
        next: (s) => {
          this.mostrar(s);
          this.aviso.set({ tipo: 'exito', texto: `Solicitud ${s.id} registrada.`, testId: 'aviso-registro' });
          this.limpiarFormulario();
          this.ocupado.set(false);
        },
        error: (e: HttpErrorResponse) => {
          const err = e.error as ErrorApi | undefined;
          this.erroresRegistro.set(
            err?.detalles?.map((d) => `${this.etiquetaCampo(d.campo)}: ${d.mensaje}`) ?? [
              err?.mensaje ?? 'No fue posible registrar la solicitud.',
            ],
          );
          this.ocupado.set(false);
        },
      });
  }

  consultar(): void {
    const id = this.idConsulta.trim();
    if (!id) return;
    this.limpiarMensajes();
    this.ocupado.set(true);
    this.api.consultar(id).subscribe({
      next: (s) => {
        this.mostrar(s);
        this.ocupado.set(false);
      },
      error: (e: HttpErrorResponse) => {
        this.solicitud.set(null);
        this.aviso.set({
          tipo: 'error',
          texto: e.status === 404 ? `No existe la solicitud ${id}.` : this.mensajeError(e),
          testId: 'error-consulta',
        });
        this.ocupado.set(false);
      },
    });
  }

  evaluar(): void {
    const s = this.solicitud();
    if (!s) return;
    this.limpiarMensajes();
    this.ocupado.set(true);
    this.evaluando.set(true);
    this.evaluacionDemorada.set(false);
    this.temporizadorDemora = setTimeout(() => this.evaluacionDemorada.set(true), AVISO_DEMORA_MS);

    this.api.evaluar(s.id).subscribe({
      next: (r) => {
        this.finEvaluacion();
        this.mostrar(r);
        this.aviso.set(
          r.estado === 'PREAPROBADA'
            ? { tipo: 'exito', texto: 'La solicitud fue preaprobada.', testId: 'resultado-evaluacion' }
            : { tipo: 'advertencia', texto: 'La solicitud fue rechazada.', testId: 'resultado-evaluacion' },
        );
      },
      error: (e: unknown) => {
        this.finEvaluacion();
        if (e instanceof TimeoutError) {
          this.aviso.set({
            tipo: 'error',
            texto: 'No se obtuvo respuesta del proveedor de evaluación. Consulta la solicitud antes de reintentar.',
            testId: 'alerta-proveedor',
          });
          return;
        }
        const http = e as HttpErrorResponse;
        if (http.status === 503) {
          this.aviso.set({
            tipo: 'error',
            texto:
              'El proveedor de evaluación no está disponible en este momento. La solicitud no fue modificada; intenta de nuevo en unos minutos.',
            testId: 'alerta-proveedor',
          });
          return;
        }
        this.aviso.set({ tipo: 'error', texto: this.mensajeError(http), testId: 'error-accion' });
        this.refrescar(s.id);
      },
    });
  }

  registrarDocumentos(): void {
    const s = this.solicitud();
    if (!s) return;
    const docs = (Object.keys(this.documentosSeleccionados) as TipoDocumento[]).filter(
      (d) => this.documentosSeleccionados[d],
    );
    this.limpiarMensajes();
    if (docs.length === 0) {
      this.aviso.set({ tipo: 'error', texto: 'Selecciona al menos un documento.', testId: 'error-accion' });
      return;
    }
    this.ocupado.set(true);
    this.api.registrarDocumentos(s.id, docs).subscribe({
      next: (r) => {
        this.mostrar(r);
        this.aviso.set({ tipo: 'info', texto: 'Documentos registrados.', testId: 'aviso-documentos' });
        this.ocupado.set(false);
      },
      error: (e: HttpErrorResponse) => {
        this.aviso.set({ tipo: 'error', texto: this.mensajeError(e), testId: 'error-accion' });
        this.ocupado.set(false);
      },
    });
  }

  confirmar(): void {
    const s = this.solicitud();
    if (!s) return;
    this.limpiarMensajes();
    this.ocupado.set(true);
    this.api.confirmar(s.id).subscribe({
      next: (r) => {
        this.mostrar(r);
        this.aviso.set({ tipo: 'exito', texto: 'Crédito confirmado.', testId: 'aviso-confirmacion' });
        this.ocupado.set(false);
      },
      error: (e: HttpErrorResponse) => {
        this.aviso.set({ tipo: 'error', texto: this.mensajeError(e), testId: 'error-accion' });
        this.ocupado.set(false);
        this.refrescar(s.id);
      },
    });
  }

  nuevaSolicitud(): void {
    this.solicitud.set(null);
    this.limpiarMensajes();
    this.limpiarFormulario();
  }

  // ---------------------------------------------------------------- vista

  pesos(valor: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(valor);
  }

  plazo(meses: number): string {
    return `${meses} meses (${meses / 12} años)`;
  }

  fecha(iso: string | null): string {
    return iso ? new Date(iso).toLocaleString('es-CO') : '—';
  }

  nombreDocumento(d: TipoDocumento): string {
    return this.tiposDocumento.find((t) => t.valor === d)?.etiqueta ?? d;
  }

  etiquetaEstado(estado: string): string {
    return (
      { REGISTRADA: 'Registrada', PREAPROBADA: 'Preaprobada', RECHAZADA: 'Rechazada', CONFIRMADA: 'Confirmada' }[
        estado
      ] ?? estado
    );
  }

  // ---------------------------------------------------------------- utilidades

  private mostrar(s: Solicitud): void {
    this.solicitud.set(s);
    this.idConsulta = s.id;
    this.documentosSeleccionados = {};
  }

  private refrescar(id: string): void {
    this.api.consultar(id).subscribe({ next: (s) => this.mostrar(s), error: () => undefined });
  }

  private finEvaluacion(): void {
    clearTimeout(this.temporizadorDemora);
    this.evaluando.set(false);
    this.evaluacionDemorada.set(false);
    this.ocupado.set(false);
  }

  private limpiarMensajes(): void {
    this.aviso.set(null);
    this.erroresRegistro.set([]);
  }

  private limpiarFormulario(): void {
    this.cliente = '';
    this.valorVivienda = null;
    this.monto = null;
    this.plazoMeses = null;
  }

  private mensajeError(e: HttpErrorResponse): string {
    const err = e.error as ErrorApi | undefined;
    if (err?.codigo === 'DOCUMENTOS_INCOMPLETOS') {
      return 'No se puede confirmar: faltan documentos requeridos.';
    }
    if (err?.codigo === 'TRANSICION_NO_PERMITIDA') {
      return `Acción no permitida para una solicitud ${this.etiquetaEstado(err.estadoActual ?? '').toLowerCase()}.`;
    }
    if (e.status === 0) return 'No hay conexión con el servidor.';
    return err?.mensaje ?? 'Ocurrió un error inesperado.';
  }

  private etiquetaCampo(campo: string): string {
    return (
      { cliente: 'Cliente', valorVivienda: 'Valor de la vivienda', monto: 'Monto', plazoMeses: 'Plazo' }[campo] ??
      campo
    );
  }
}
