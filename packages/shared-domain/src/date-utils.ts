export function toLocalISODate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function isFutureISODate(value: string, today = new Date()): boolean {
  if (!value) {
    return false
  }

  return value > toLocalISODate(today)
}

export function getForecastDaysForTargetDate(
  targetDate: string,
  today = new Date(),
): number {
  if (!isFutureISODate(targetDate, today)) {
    return 0
  }

  const start = new Date(`${toLocalISODate(today)}T00:00:00`)
  const end = new Date(`${targetDate}T00:00:00`)
  const diffDays = Math.round((end.getTime() - start.getTime()) / 86_400_000)

  return Math.max(0, diffDays + 1)
}
