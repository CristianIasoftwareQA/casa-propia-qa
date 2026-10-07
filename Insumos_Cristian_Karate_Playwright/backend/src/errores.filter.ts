import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

/**
 * Normaliza todas las respuestas de error al formato del contrato:
 * { codigo, mensaje, detalles? }
 */
@Catch()
export class ErroresFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse() as any;
      if (body && typeof body === 'object' && body.codigo) {
        return res.status(status).json(body);
      }
      if (status === HttpStatus.NOT_FOUND) {
        return res.status(status).json({ codigo: 'RECURSO_NO_ENCONTRADO', mensaje: 'Recurso no encontrado' });
      }
      if (status === HttpStatus.BAD_REQUEST) {
        return res.status(status).json({ codigo: 'DATOS_INVALIDOS', mensaje: 'La petición no es válida' });
      }
      return res.status(status).json({ codigo: 'ERROR', mensaje: exception.message });
    }

    console.error(exception);
    return res
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .json({ codigo: 'ERROR_INTERNO', mensaje: 'Error interno del servidor' });
  }
}
