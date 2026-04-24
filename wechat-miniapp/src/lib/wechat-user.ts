const GENERATED_WECHAT_DISPLAY_NAME = /^微信用户(?:-[a-z0-9]+)?$/i

export function isGeneratedWechatDisplayName(displayName?: string | null): boolean {
  const normalized = displayName?.trim()

  if (!normalized) {
    return false
  }

  return GENERATED_WECHAT_DISPLAY_NAME.test(normalized)
}

export function getEditableWechatDisplayName(displayName?: string | null): string {
  const normalized = displayName?.trim() || ''

  if (!normalized || isGeneratedWechatDisplayName(normalized)) {
    return ''
  }

  return normalized
}
