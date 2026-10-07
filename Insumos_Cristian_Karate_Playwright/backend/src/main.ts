import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ErroresFilter } from './errores.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: ['error', 'warn', 'log'] });
  app.setGlobalPrefix('api');
  app.enableCors({ origin: true });
  app.useGlobalFilters(new ErroresFilter());
  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
  console.log(`Casa Propia API escuchando en http://localhost:${port}/api`);
}

bootstrap();
