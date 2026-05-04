export function addDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

export function toLocalISODate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function getCurrentYearMonth(date: Date = new Date()): { year: number; month: number } {
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
  }
}

export function formatChineseDate(dateStr: string): string {
  const date = new Date(dateStr)
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
}

export function formatWeekdayLabel(dayOfWeek: number): string {
  const labels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
  return labels[((dayOfWeek % 7) + 7) % 7]
}

export function getForecastDaysForTargetDate(
  targetDate: string,
  currentDate: Date = new Date()
): number {
  const today = toLocalISODate(currentDate)
  if (targetDate <= today) return 0

  const current = new Date(`${today}T00:00:00`)
  const target = new Date(`${targetDate}T00:00:00`)
  const diff = Math.round((target.getTime() - current.getTime()) / (1000 * 60 * 60 * 24))

  return diff > 0 ? diff + 1 : 0
}

export function sortByOutfitDateDescending<T extends {
  scheduled_for: string | null
  created_at: string
}>(outfits: T[]): T[] {
  return [...outfits].sort((left, right) => {
    const leftKey = left.scheduled_for ?? left.created_at
    const rightKey = right.scheduled_for ?? right.created_at
    return rightKey.localeCompare(leftKey)
  })
}
