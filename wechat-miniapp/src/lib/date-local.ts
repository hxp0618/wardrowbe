/** Same semantics as `frontend/lib/date-utils.ts` for suggest target dates. */

export function toLocalISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function isFutureISODate(value: string, today = new Date()): boolean {
  if (!value) return false;
  return value > toLocalISODate(today);
}

export function getForecastDaysForTargetDate(targetDate: string, today = new Date()): number {
  if (!isFutureISODate(targetDate, today)) return 0;
  const start = new Date(`${toLocalISODate(today)}T00:00:00`);
  const end = new Date(`${targetDate}T00:00:00`);
  const diffDays = Math.round((end.getTime() - start.getTime()) / 86400000);
  return Math.max(0, diffDays + 1);
}
