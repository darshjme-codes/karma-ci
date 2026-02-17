/**
 * notifier.ts — Slack/Discord webhook notifications
 */

import * as https from 'https';
import * as http from 'http';

export interface NotificationPayload {
  title: string;
  status: 'success' | 'failure' | 'healed' | 'retrying';
  message: string;
  details?: string;
  url?: string;
  attempt?: number;
  maxAttempts?: number;
}

export interface NotifierOptions {
  slackWebhook?: string;
  discordWebhook?: string;
}

export class Notifier {
  private slackUrl?: string;
  private discordUrl?: string;

  constructor(options: NotifierOptions = {}) {
    this.slackUrl = options.slackWebhook;
    this.discordUrl = options.discordWebhook;
  }

  async notify(payload: NotificationPayload): Promise<void> {
    const promises: Promise<void>[] = [];
    if (this.slackUrl) promises.push(this.sendSlack(payload));
    if (this.discordUrl) promises.push(this.sendDiscord(payload));
    await Promise.allSettled(promises);
  }

  private async sendSlack(payload: NotificationPayload): Promise<void> {
    const emoji = { success: '✅', failure: '❌', healed: '🔱', retrying: '🔄' }[payload.status];
    const body = {
      blocks: [
        { type: 'header', text: { type: 'plain_text', text: `${emoji} ${payload.title}` } },
        { type: 'section', text: { type: 'mrkdwn', text: payload.message } },
        ...(payload.details ? [{ type: 'section', text: { type: 'mrkdwn', text: `\`\`\`${payload.details}\`\`\`` } }] : []),
        ...(payload.url ? [{ type: 'actions', elements: [{ type: 'button', text: { type: 'plain_text', text: 'View Run' }, url: payload.url }] }] : []),
      ],
    };
    await this.postJSON(this.slackUrl!, body);
  }

  private async sendDiscord(payload: NotificationPayload): Promise<void> {
    const color = { success: 0x22c55e, failure: 0xef4444, healed: 0xa855f7, retrying: 0xf59e0b }[payload.status];
    const body = {
      embeds: [{
        title: payload.title,
        description: payload.message,
        color,
        fields: payload.details ? [{ name: 'Details', value: `\`\`\`${payload.details.slice(0, 1000)}\`\`\`` }] : [],
        url: payload.url,
        footer: payload.attempt ? { text: `Attempt ${payload.attempt}/${payload.maxAttempts}` } : undefined,
      }],
    };
    await this.postJSON(this.discordUrl!, body);
  }

  private postJSON(url: string, body: object): Promise<void> {
    return new Promise((resolve, reject) => {
      const data = JSON.stringify(body);
      const parsed = new URL(url);
      const mod = parsed.protocol === 'https:' ? https : http;
      const req = mod.request(parsed, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } }, (res) => {
        res.resume();
        res.statusCode && res.statusCode < 400 ? resolve() : reject(new Error(`Webhook returned ${res.statusCode}`));
      });
      req.on('error', reject);
      req.end(data);
    });
  }
}
