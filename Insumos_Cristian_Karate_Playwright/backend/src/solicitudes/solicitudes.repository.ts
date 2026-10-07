import { Injectable } from '@nestjs/common';
import { Solicitud } from './solicitud.model';

/** Almacenamiento en memoria. Los datos se pierden al reiniciar la aplicación. */
@Injectable()
export class SolicitudesRepository {
  private readonly datos = new Map<string, Solicitud>();
  private secuencia = 0;

  siguienteId(): string {
    this.secuencia += 1;
    return `SOL-${String(this.secuencia).padStart(6, '0')}`;
  }

  guardar(s: Solicitud): Solicitud {
    this.datos.set(s.id, structuredClone(s));
    return structuredClone(s);
  }

  buscar(id: string): Solicitud | undefined {
    const s = this.datos.get(id);
    return s ? structuredClone(s) : undefined;
  }
}
