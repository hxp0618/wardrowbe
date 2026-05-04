export const NOTIFICATION_CHANNEL_OPTIONS = ['email', 'webhook', 'ntfy', 'mattermost', 'bark'] as const
export const WEBHOOK_PRESET_OPTIONS = ['generic', 'telegram', 'discord', 'slack', 'feishu', 'wechat_work'] as const
export const WEBHOOK_METHOD_OPTIONS = ['POST', 'PUT'] as const
export const WEBHOOK_CONTENT_TYPE_OPTIONS = ['application/json', 'application/x-www-form-urlencoded'] as const

export type NotificationChannelOption = (typeof NOTIFICATION_CHANNEL_OPTIONS)[number]
export type WebhookPresetOption = (typeof WEBHOOK_PRESET_OPTIONS)[number]
export type WebhookMethodOption = (typeof WEBHOOK_METHOD_OPTIONS)[number]
export type WebhookContentTypeOption = (typeof WEBHOOK_CONTENT_TYPE_OPTIONS)[number]

export function getDefaultBarkServer(server?: string): string {
  return server || 'https://api.day.app'
}
