import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CalorieBotService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async handleIncomingMessage(text: string): Promise<string> {
    const match = text.match(/^(\d+)\s+(.+)$/s);
    const calories = match ? Number(match[1]) : 0;
    const title = match ? match[2] : text;
    const userId = this.configService.getOrThrow<string>('APP_USER_ID');
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        dailyCalorieLimit: true,
        mealScheduleEnabled: true,
        mealScheduleEntries: { orderBy: { timeMinutes: 'asc' } },
      },
    });

    const now = new Date();
    await this.prisma.foodEntry.create({
      data: { userId, title, calories, eatenAt: now },
    });

    let start = new Date(now);
    start.setHours(0, 0, 0, 0);
    let end = new Date(start);
    end.setDate(end.getDate() + 1);
    let limit = user.dailyCalorieLimit ?? 0;
    const meals = user.mealScheduleEntries;

    if (user.mealScheduleEnabled && meals.length) {
      limit = meals[0].calories;
      for (const meal of meals.slice(1)) {
        const boundary = new Date(now);
        boundary.setHours(0, meal.timeMinutes - 60, 0, 0);
        if (now < boundary) {
          end = boundary;
          break;
        }
        start = boundary;
        limit = meal.calories;
      }
    }

    const { _sum } = await this.prisma.foodEntry.aggregate({
      where: { userId, eatenAt: { gte: start, lt: end } },
      _sum: { calories: true },
    });

    const remaining = limit - (_sum.calories ?? 0);
    return remaining < 0
      ? `перебор на ${-remaining} ккал`
      : `осталось ${remaining} ккал`;
  }
}
