import { API_BASE_URL } from "@/lib/config";

/** Resolve image URL from API (handles relative paths when backend returns paths only). */
export function resolveMediaUrl(url?: string | null): string {
  if (!url) {
    return "";
  }
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  const path = url.startsWith("/") ? url : `/${url}`;
  return `${API_BASE_URL.replace(/\/$/, "")}${path}`;
}
