/**
 * Base URL for Wardrowbe API (no trailing slash), e.g. http://192.168.1.10:8000
 * Override in WeChat DevTools: 详情 → 本地设置 → 不校验合法域名 (dev only).
 */
export const API_BASE_URL =
  process.env.TARO_APP_API_BASE_URL || "http://127.0.0.1:8000";
