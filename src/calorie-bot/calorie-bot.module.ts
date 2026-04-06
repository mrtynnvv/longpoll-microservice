import { Module } from '@nestjs/common';

import { CalorieBotService } from './calorie-bot.service';
import { VkApiService } from './vk-api.service';
import { VkLongPollService } from './vk-longpoll.service';

@Module({
  providers: [CalorieBotService, VkApiService, VkLongPollService],
})
export class CalorieBotModule {}
