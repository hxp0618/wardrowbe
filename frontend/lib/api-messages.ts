import { messagesEn } from "@wardrowbe/shared-i18n";

const DEFAULT_EN: Record<ApiMessageKey, string> = {
  offline: messagesEn.errors.api.offline,
  unableToConnect: messagesEn.errors.api.unableToConnect,
  generic: messagesEn.errors.api.generic,
  createItemFailed: messagesEn.errors.api.createItemFailed,
  uploadImageFailed: messagesEn.errors.api.uploadImageFailed,
  invalidServerResponse: messagesEn.errors.api.invalidServerResponse,
  bulkUploadFailed: messagesEn.errors.api.bulkUploadFailed,
  uploadCancelled: messagesEn.errors.api.uploadCancelled,
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
