import { Controller, Get, Module } from '@nestjs/common';
import { SolicitudesController } from './solicitudes/solicitudes.controller';
import { SolicitudesService } from './solicitudes/solicitudes.service';
import { SolicitudesRepository } from './solicitudes/solicitudes.repository';
import { ProveedorEvaluacionService } from './simulacion/proveedor-evaluacion.service';
import { SimulacionController } from './simulacion/simulacion.controller';
import { JornadaService } from './simulacion/jornada.service';

@Controller('salud')
class SaludController {
  @Get()
  salud() {
    return { estado: 'OK', servicio: 'casa-propia-api', version: '1.4.0' };
  }
}

@Module({
  controllers: [SaludController, SolicitudesController, SimulacionController],
  providers: [SolicitudesService, SolicitudesRepository, ProveedorEvaluacionService, JornadaService],
})
export class AppModule {}
