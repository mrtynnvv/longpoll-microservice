import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { PrismaService } from '../prisma/prisma.service';

type IncomingMessage = {
  text: string;
};

type DayStats = {
  limit: number | null;
  eaten: number;
  remaining: number | null;
};

type TargetUser = {
  id: string;
  dailyCalorieLimit: number | null;
};

@Injectable()
export class CalorieBotService {
  private readonly defaultUserId = 'cmgrx68p30000yguffpaiqzt4';

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async handleIncomingMessage(input: IncomingMessage): Promise<string> {
    const text = input.text.trim();

    if (!text) {
      return this.getFormatHint();
    }

    const food = this.parseFoodCommand(text);
    if (food) {
      return this.handleFoodCommand(food.title, food.calories);
    }

    return this.getFormatHint();
  }

  private parseFoodCommand(text: string) {
    const match = text.match(/^(\d{1,5})\s+(.+)$/u);
    if (!match) {
      return null;
    }

    const calories = Number(match[1]);
    const title = match[2].trim().replace(/\s+/g, ' ');

    if (!title || !Number.isInteger(calories) || calories < 1 || calories > 20000) {
      return null;
    }

    return { title, calories };
  }

  private async handleFoodCommand(title: string, calories: number) {
    const user = await this.getTargetUser();

    await this.prisma.foodEntry.create({
      data: {
        userId: user.id,
        title,
        calories,
      },
    });

    const stats = await this.getTodayStats(user);
    const base = `Добавил ${calories} ккал: ${title}.`;

    if (stats.limit === null) {
      return `${base}\nЛимит калорий в аккаунте пока не задан.`;
    }

    return `${base}\n${this.formatStats(stats)}`;
  }

  private async getTargetUser() {
    const userId = this.configService.get<string>('APP_USER_ID') || this.defaultUserId;
    const users = await this.prisma.$queryRaw<TargetUser[]>`
      SELECT "id", "dailyCalorieLimit"
      FROM "User"
      WHERE "id" = ${userId}
      LIMIT 1
    `;
    const user = users[0];

    if (!user) {
      throw new Error(`APP_USER_ID ${userId} was not found in the database`);
    }

    return user;
  }

  private async getTodayStats(user: TargetUser): Promise<DayStats> {
    const { start, end } = this.getDayRange(this.getDefaultTimezone());

    const aggregate = await this.prisma.foodEntry.aggregate({
      where: {
        userId: user.id,
        eatenAt: {
          gte: start,
          lt: end,
        },
      },
      _sum: { calories: true },
    });

    const eaten = aggregate._sum.calories ?? 0;
    const limit = user.dailyCalorieLimit ?? null;

    return {
      limit,
      eaten,
      remaining: limit === null ? null : limit - eaten,
    };
  }

  private getDayRange(timezone: string) {
    const now = new Date();
    const parts = this.getDateParts(now, timezone);
    const utcMidnight = new Date(
      Date.UTC(parts.year, parts.month - 1, parts.day, 0, 0, 0, 0),
    );
    const offsetMs = this.getTimeZoneOffsetMs(utcMidnight, timezone);
    const start = new Date(utcMidnight.getTime() - offsetMs);
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

    return { start, end };
  }

  private getDateParts(date: Date, timezone: string) {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    });

    const entries = formatter.formatToParts(date).reduce<Record<string, string>>(
      (acc, part) => {
        if (part.type !== 'literal') {
          acc[part.type] = part.value;
        }
        return acc;
      },
      {},
    );

    return {
      year: Number(entries.year),
      month: Number(entries.month),
      day: Number(entries.day),
      hour: Number(entries.hour),
      minute: Number(entries.minute),
      second: Number(entries.second),
    };
  }

  private getTimeZoneOffsetMs(date: Date, timezone: string) {
    const parts = this.getDateParts(date, timezone);
    const asUtc = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second,
      0,
    );

    return asUtc - date.getTime();
  }

  private formatStats(stats: DayStats) {
    const remaining = stats.remaining ?? 0;
    const base = `Сегодня съедено: ${stats.eaten} из ${stats.limit} ккал.`;

    if (remaining >= 0) {
      return `${base}\nНа сегодня осталось ${remaining} ккал.`;
    }

    return `${base}\nПеребор на ${Math.abs(remaining)} ккал.`;
  }

  private getFormatHint() {
    return 'Нужен формат: 100 брокколи с капустой';
  }

  private getDefaultTimezone() {
    return this.configService.get<string>('APP_TIMEZONE') || 'Europe/Moscow';
  }
}
