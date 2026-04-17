export interface WebhookHeaderPair {
  id: string
  key: string
  value: string
}

const LEGACY_FORMAT_TO_PRESET: Record<string, string> = {
  json: 'generic',
  wecom: 'wechat_work',
}

export function normalizeWebhookPreset(
  preset?: string,
  legacyFormat?: string,
): string {
  if (preset?.trim()) {
    return preset
  }

  if (legacyFormat?.trim()) {
    return LEGACY_FORMAT_TO_PRESET[legacyFormat] ?? legacyFormat
  }

  return 'generic'
}

export function pairsToHeaders(
  pairs: WebhookHeaderPair[],
): Record<string, string> | undefined {
  const headers = pairs.reduce<Record<string, string>>((acc, pair) => {
    const key = pair.key.trim()
    const value = pair.value.trim()

    if (key) {
      acc[key] = value
    }

    return acc
  }, {})

  return Object.keys(headers).length > 0 ? headers : undefined
}

export function headersToPairs(
  headers?: Record<string, unknown> | null,
): WebhookHeaderPair[] {
  if (!headers) {
    return []
  }

  return Object.entries(headers).map(([key, value], index) => ({
    id: `${key}-${index}`,
    key,
    value: String(value ?? ''),
  }))
}
