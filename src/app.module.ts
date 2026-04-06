import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { CalorieBotModule } from './calorie-bot/calorie-bot.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    CalorieBotModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
