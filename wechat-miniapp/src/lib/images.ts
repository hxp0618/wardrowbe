import { API_BASE_URL } from "@/lib/config";
import { resolveMediaUrlWithBase } from "@/lib/resolve-media-url";

/** Resolve image URL from API (handles relative paths when backend returns paths only). */
export function resolveMediaUrl(url?: string | null): string {
  return resolveMediaUrlWithBase(API_BASE_URL, url);
}
