import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    await this.$connect();

    try {
      await this.$queryRawUnsafe('PRAGMA journal_mode = WAL;');
    } catch (error) {
      console.warn('WAL PRAGMA failed (safe to ignore in dev):', error);
    }

    try {
      await this.$executeRawUnsafe('PRAGMA foreign_keys = ON;');
    } catch (error) {
      console.warn('foreign_keys PRAGMA failed (safe to ignore in dev):', error);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
