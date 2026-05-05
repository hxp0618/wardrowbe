import Taro from '@tarojs/taro'

/**
 * Shorthand wrappers around Taro.showToast so callers don't have to repeat the
 * `void Taro.showToast({ title, icon: ... })` shape. Toast calls fire-and-forget
 * — the returned promise is intentionally swallowed since failures here aren't
 * actionable and we don't want unhandled rejections in production logs.
 */
export function toastSuccess(title: string): void {
  void Taro.showToast({ title, icon: 'success' })
}

export function toastError(title: string): void {
  void Taro.showToast({ title, icon: 'none' })
}

/**
 * Standard "show the exception's message if it's an Error, otherwise show a
 * static fallback" pattern that appears in nearly every mutation handler.
 */
export function toastErrorFromException(error: unknown, fallback: string): void {
  toastError(error instanceof Error ? error.message : fallback)
}
