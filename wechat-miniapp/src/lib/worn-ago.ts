/**
 * Approximate "days since last worn" for wardrobe cards (Web uses user timezone;
 * here we use calendar-day difference in local time for simplicity).
 */
export function daysSinceDateString(iso: string): number {
  const day = iso.slice(0, 10);
  const then = new Date(`${day}T12:00:00`);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
  const diffMs = today.getTime() - then.getTime();
  return Math.floor(diffMs / 86400000);
}

export function wornAgoLabelZh(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const days = daysSinceDateString(iso);
  if (days <= 0) return "今天穿过";
  if (days === 1) return "昨天穿过";
  return `${days} 天前穿过`;
}
