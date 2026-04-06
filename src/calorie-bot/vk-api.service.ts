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

type LongPollServer = {
  key: string;
  server: string;
  ts: string;
};

@Injectable()
export class VkApiService {
  constructor(private readonly configService: ConfigService) {}

  isConfigured() {
    return Boolean(this.getGroupToken() && this.getGroupId());
  }

  getMissingConfigKeys() {
    const missing: string[] = [];

    if (!this.getGroupId()) {
      missing.push('VK_GROUP_ID');
    }

    if (!this.getGroupToken()) {
      missing.push('VK_GROUP_TOKEN');
    }

    return missing;
  }

  async sendMessage(peerId: number, message: string) {
    await this.call('messages.send', {
      peer_id: peerId,
      message,
      random_id: this.getRandomId(),
    });
  }

  async getLongPollServer() {
    return this.call<LongPollServer>('groups.getLongPollServer', {
      group_id: this.getGroupId(),
    });
  }

  async call<T>(
    method: string,
    params: Record<string, number | string | undefined>,
  ): Promise<T> {
    const body = new URLSearchParams();
    body.set('access_token', this.getRequiredGroupToken());
    body.set('v', this.getApiVersion());

    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        body.set(key, String(value));
      }
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

  private getRandomId() {
    return Math.floor(Math.random() * 2_147_483_647);
  }

  private getGroupId() {
    const raw = this.configService.get<string>('VK_GROUP_ID');
    return raw ? Number(raw) : 0;
  }

  private getGroupToken() {
    return this.configService.get<string>('VK_GROUP_TOKEN')?.trim() || '';
  }

  private getRequiredGroupToken() {
    const token = this.getGroupToken();
    if (!token) {
      throw new Error('VK_GROUP_TOKEN is not configured');
    }

    return token;
  }

  private getApiVersion() {
    return this.configService.get<string>('VK_API_VERSION') || '5.199';
  }
}
