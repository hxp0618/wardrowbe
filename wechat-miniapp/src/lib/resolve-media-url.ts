/** Pure helper: join API origin with a path or absolute URL (no Taro import). */
export function resolveMediaUrlWithBase(baseUrl: string, url?: string | null): string {
  if (!url) {
    return "";
  }
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  const origin = baseUrl.replace(/\/$/, "");
  const path = url.startsWith("/") ? url : `/${url}`;
  return `${origin}${path}`;
}
