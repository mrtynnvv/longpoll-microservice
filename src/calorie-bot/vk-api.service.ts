import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type VkApiEnvelope<T> =
  | { response: T }
  | {
      error: {
        error_code: number;
        error_msg: string;
      };
    };

export type LongPollServer = {
  key: string;
  server: string;
  ts: string;
};

@Injectable()
export class VkApiService {
  private readonly groupId: number;
  private readonly groupToken: string;
  private readonly apiVersion: string;

  constructor(configService: ConfigService) {
    this.groupId = Number(configService.get<string>('VK_GROUP_ID')) || 0;
    this.groupToken = configService.get<string>('VK_GROUP_TOKEN')?.trim() || '';
    this.apiVersion = configService.get<string>('VK_API_VERSION') || '5.199';
  }

  isConfigured() {
    return Boolean(this.groupToken && this.groupId);
  }

  async sendMessage(peerId: number, message: string) {
    await this.call('messages.send', {
      peer_id: peerId,
      message,
      random_id: Math.floor(Math.random() * 2_147_483_647),
    });
  }

  async getLongPollServer() {
    return this.call<LongPollServer>('groups.getLongPollServer', {
      group_id: this.groupId,
    });
  }

  private async call<T>(
    method: string,
    params: Record<string, number | string>,
  ): Promise<T> {
    if (!this.groupToken) {
      throw new Error('VK_GROUP_TOKEN is not configured');
    }

    const body = new URLSearchParams();
    body.set('access_token', this.groupToken);
    body.set('v', this.apiVersion);

    for (const [key, value] of Object.entries(params)) {
      body.set(key, String(value));
    }

    const response = await fetch(`https://api.vk.com/method/${method}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });

    if (!response.ok) {
      throw new Error(`VK API HTTP ${response.status}`);
    }

    const payload = (await response.json()) as VkApiEnvelope<T>;
    if ('error' in payload) {
      throw new Error(
        `VK API error ${payload.error.error_code}: ${payload.error.error_msg}`,
      );
    }

    return payload.response;
  }
}
