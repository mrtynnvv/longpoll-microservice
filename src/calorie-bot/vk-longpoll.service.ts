import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';

import { CalorieBotService } from './calorie-bot.service';
import { VkApiService } from './vk-api.service';

type LongPollServer = {
  key: string;
  server: string;
  ts: string;
};

type LongPollResponse = {
  ts?: string;
  failed?: number;
  updates?: Array<{
    type: string;
    object?: {
      message?: {
        text?: string;
        out?: number;
        from_id?: number;
        peer_id?: number;
      };
    };
  }>;
};

@Injectable()
export class VkLongPollService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(VkLongPollService.name);
  private stopped = false;
  private server: LongPollServer | null = null;

  constructor(
    private readonly vkApi: VkApiService,
    private readonly calorieBot: CalorieBotService,
  ) {}

  onModuleInit() {
    if (!this.vkApi.isConfigured()) {
      this.logger.warn(
        `VK long poll is disabled. Missing env vars: ${this.vkApi
          .getMissingConfigKeys()
          .join(', ')}`,
      );
      return;
    }

    if (!this.getAllowedUserId()) {
      this.logger.warn(
        'VK_ALLOWED_USER_ID is empty. Any VK user who can message the bot will write into the configured app account.',
      );
    }

    void this.listen();
  }

  onModuleDestroy() {
    this.stopped = true;
  }

  private async listen() {
    let backoffMs = 1000;
    this.logger.log('Starting VK long poll listener');

    while (!this.stopped) {
      try {
        if (!this.server) {
          this.server = await this.vkApi.getLongPollServer();
          this.logger.log('Long poll server info loaded');
        }

        const url = new URL(this.server.server);
        url.searchParams.set('act', 'a_check');
        url.searchParams.set('key', this.server.key);
        url.searchParams.set('ts', this.server.ts);
        url.searchParams.set('wait', '25');

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Long poll HTTP ${response.status}`);
        }

        const payload = (await response.json()) as LongPollResponse;
        const shouldContinue = this.handleLongPollFailure(payload);
        if (shouldContinue) {
          continue;
        }

        if (payload.ts) {
          this.server.ts = payload.ts;
        }

        for (const update of payload.updates || []) {
          await this.handleUpdate(update);
        }

        backoffMs = 1000;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.error(`Long poll loop failed: ${message}`);
        this.server = null;
        await this.sleep(backoffMs);
        backoffMs = Math.min(backoffMs * 2, 15000);
      }
    }
  }

  private handleLongPollFailure(payload: LongPollResponse) {
    if (!payload.failed) {
      return false;
    }

    if (payload.failed === 1 && payload.ts && this.server) {
      this.server.ts = payload.ts;
      return true;
    }

    this.server = null;
    return true;
  }

  private async handleUpdate(update: NonNullable<LongPollResponse['updates']>[number]) {
    if (update.type !== 'message_new') {
      return;
    }

    const message = update.object?.message;
    if (!message || message.out) {
      return;
    }

    if (!message.from_id || message.from_id <= 0 || !message.peer_id) {
      return;
    }

    const allowedUserId = this.getAllowedUserId();
    if (allowedUserId && String(message.from_id) !== allowedUserId) {
      return;
    }

    const text = message.text?.trim();
    if (!text) {
      await this.vkApi.sendMessage(
        message.peer_id,
        'Напиши либо "100 брокколи с капустой", либо просто событие, например "сделал 100 отжиманий"',
      );
      return;
    }

    try {
      const reply = await this.calorieBot.handleIncomingMessage({
        text,
      });

      await this.vkApi.sendMessage(message.peer_id, reply);
    } catch (error) {
      const details = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to process message: ${details}`);
      await this.vkApi.sendMessage(
        message.peer_id,
        'Что-то сломалось на моей стороне. Попробуй еще раз через пару секунд.',
      );
    }
  }

  private sleep(ms: number) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  private getAllowedUserId() {
    return process.env.VK_ALLOWED_USER_ID?.trim() || '';
  }
}
