import 'reflect-metadata';

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  process.env.TZ = process.env.APP_TIMEZONE || 'Europe/Moscow';
  const port = Number(process.env.APP_PORT || 3000);
  await app.listen(port);

  Logger.log(`VK calorie bot is listening on port ${port}`, 'Bootstrap');
}

void bootstrap();
