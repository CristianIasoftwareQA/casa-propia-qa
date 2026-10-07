import { Injectable, ServiceUnavailableException } from '@nestjs/common';

export const MODOS_PROVEEDOR = ['normal', 'demora', 'no-disponible'] as const;
export type ModoProveedor = (typeof MODOS_PROVEEDOR)[number];

export interface ConfiguracionProveedor {
  modo: ModoProveedor;
  demoraMs: number;
}

const LATENCIA_NORMAL_MS = 150;
const LATENCIA_FALLO_MS = 300;
export const DEMORA_POR_DEFECTO_MS = 4000;
export const DEMORA_MAXIMA_MS = 15000;

const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Simula el proveedor externo de evaluación crediticia.
 * El modo se toma de la cabecera X-Simulacion-Proveedor (si viene) o de la configuración global.
 */
@Injectable()
export class ProveedorEvaluacionService {
  private config: ConfiguracionProveedor = { modo: 'normal', demoraMs: DEMORA_POR_DEFECTO_MS };

  obtenerConfiguracion(): ConfiguracionProveedor {
    return { ...this.config };
  }

  configurar(config: ConfiguracionProveedor): ConfiguracionProveedor {
    this.config = { ...config };
    return this.obtenerConfiguracion();
  }

  async consultar(modoSolicitado?: ModoProveedor): Promise<void> {
    const modo = modoSolicitado ?? this.config.modo;
    switch (modo) {
      case 'normal':
        await esperar(LATENCIA_NORMAL_MS);
        return;
      case 'demora':
        await esperar(this.config.demoraMs);
        return;
      case 'no-disponible':
        await esperar(LATENCIA_FALLO_MS);
        throw new ServiceUnavailableException({
          codigo: 'PROVEEDOR_NO_DISPONIBLE',
          mensaje: 'El proveedor de evaluación no está disponible. Intente de nuevo más tarde.',
        });
    }
  }
}
