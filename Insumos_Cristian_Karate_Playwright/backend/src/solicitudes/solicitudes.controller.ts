import { BadRequestException, Body, Controller, Get, Headers, HttpCode, Param, Post } from '@nestjs/common';
import { SolicitudesService } from './solicitudes.service';
import { JornadaService } from '../simulacion/jornada.service';
import { MODOS_PROVEEDOR, ModoProveedor } from '../simulacion/proveedor-evaluacion.service';

@Controller('solicitudes')
export class SolicitudesController {
  constructor(
    private readonly servicio: SolicitudesService,
    private readonly jornada: JornadaService,
  ) {}

  @Post()
  @HttpCode(201)
  registrar(@Body() body: unknown) {
    return this.servicio.registrar(body);
  }

  @Get(':id')
  async consultar(@Param('id') id: string, @Headers('x-condicion-atencion') condicion?: string) {
    if (condicion !== undefined && condicion !== 'normal' && condicion !== 'jornada') {
      throw new BadRequestException({
        codigo: 'DATOS_INVALIDOS',
        mensaje: 'X-Condicion-Atencion debe ser "normal" o "jornada"',
      });
    }
    const respuesta = this.servicio.consultar(id);
    if (condicion === 'jornada') {
      await this.jornada.aplicar(id);
    }
    return respuesta;
  }

  @Post(':id/evaluacion')
  @HttpCode(200)
  evaluar(@Param('id') id: string, @Headers('x-simulacion-proveedor') modo?: string) {
    if (modo !== undefined && !MODOS_PROVEEDOR.includes(modo as ModoProveedor)) {
      throw new BadRequestException({
        codigo: 'DATOS_INVALIDOS',
        mensaje: `X-Simulacion-Proveedor debe ser uno de: ${MODOS_PROVEEDOR.join(', ')}`,
      });
    }
    return this.servicio.evaluar(id, modo as ModoProveedor | undefined);
  }

  @Post(':id/documentos')
  @HttpCode(200)
  registrarDocumentos(@Param('id') id: string, @Body() body: unknown) {
    return this.servicio.registrarDocumentos(id, body);
  }

  @Post(':id/confirmacion')
  @HttpCode(200)
  confirmar(@Param('id') id: string) {
    return this.servicio.confirmar(id);
  }
}
