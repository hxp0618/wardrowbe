const DEFAULT_EN: Record<ApiMessageKey, string> = {
  offline: 'You appear to be offline. Please check your connection.',
  unableToConnect: 'Unable to connect to server. Please try again.',
  generic: 'An error occurred',
  createItemFailed: 'Failed to create item',
  uploadImageFailed: 'Failed to upload image',
  invalidServerResponse: 'Invalid response from server',
  bulkUploadFailed: 'Failed to upload items',
  uploadCancelled: 'Upload was cancelled.',
};

export const API_MESSAGE_KEYS = [
  'offline',
  'unableToConnect',
  'generic',
  'createItemFailed',
  'uploadImageFailed',
  'invalidServerResponse',
  'bulkUploadFailed',
  'uploadCancelled',
] as const;

export type ApiMessageKey = (typeof API_MESSAGE_KEYS)[number];

let override: Partial<Record<ApiMessageKey, string>> | null = null;

export function setApiClientMessages(messages: Partial<Record<ApiMessageKey, string>> | null) {
  override = messages;
}

export function getApiMessage(key: ApiMessageKey): string {
  const fromOverride = override?.[key];
  if (fromOverride) return fromOverride;
  return DEFAULT_EN[key];
}

export function pickApiMessages(messages: Record<string, unknown>): Partial<Record<ApiMessageKey, string>> | null {
  const raw = messages.errors;
  if (!raw || typeof raw !== 'object' || !('api' in raw)) return null;
  const api = (raw as { api?: unknown }).api;
  if (!api || typeof api !== 'object') return null;

  const out: Partial<Record<ApiMessageKey, string>> = {};
  for (const key of API_MESSAGE_KEYS) {
    const value = (api as Record<string, unknown>)[key];
    if (typeof value === 'string' && value.length > 0) {
      out[key] = value;
    }
  }
  return Object.keys(out).length > 0 ? out : null;
}
