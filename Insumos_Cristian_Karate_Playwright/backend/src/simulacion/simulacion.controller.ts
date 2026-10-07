import { BadRequestException, Body, Controller, Get, Put } from '@nestjs/common';
import {
  DEMORA_MAXIMA_MS,
  DEMORA_POR_DEFECTO_MS,
  MODOS_PROVEEDOR,
  ModoProveedor,
  ProveedorEvaluacionService,
} from './proveedor-evaluacion.service';

@Controller('simulacion')
export class SimulacionController {
  constructor(private readonly proveedor: ProveedorEvaluacionService) {}

  @Get('proveedor')
  obtener() {
    return this.proveedor.obtenerConfiguracion();
  }

  @Put('proveedor')
  configurar(@Body() body: any) {
    const modo = body?.modo;
    if (!MODOS_PROVEEDOR.includes(modo as ModoProveedor)) {
      throw new BadRequestException({
        codigo: 'DATOS_INVALIDOS',
        mensaje: `modo debe ser uno de: ${MODOS_PROVEEDOR.join(', ')}`,
      });
    }
    const demoraMs = body?.demoraMs ?? DEMORA_POR_DEFECTO_MS;
    if (!Number.isInteger(demoraMs) || demoraMs < 0 || demoraMs > DEMORA_MAXIMA_MS) {
      throw new BadRequestException({
        codigo: 'DATOS_INVALIDOS',
        mensaje: `demoraMs debe ser un entero entre 0 y ${DEMORA_MAXIMA_MS}`,
      });
    }
    return this.proveedor.configurar({ modo, demoraMs });
  }
}
