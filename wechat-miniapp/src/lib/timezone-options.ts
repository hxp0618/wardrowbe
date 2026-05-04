export const TIMEZONE_OPTIONS = [
  {
    value: 'Asia/Shanghai',
    zh: '北京时间 (Asia/Shanghai)',
    en: 'Beijing Time (Asia/Shanghai)',
  },
  {
    value: 'Asia/Tokyo',
    zh: '东京时间 (Asia/Tokyo)',
    en: 'Tokyo Time (Asia/Tokyo)',
  },
  {
    value: 'America/New_York',
    zh: '纽约时间 (America/New_York)',
    en: 'New York Time (America/New_York)',
  },
  {
    value: 'America/Los_Angeles',
    zh: '洛杉矶时间 (America/Los_Angeles)',
    en: 'Los Angeles Time (America/Los_Angeles)',
  },
  {
    value: 'Europe/London',
    zh: '伦敦时间 (Europe/London)',
    en: 'London Time (Europe/London)',
  },
  {
    value: 'UTC',
    zh: '协调世界时 (UTC)',
    en: 'Coordinated Universal Time (UTC)',
  },
] as const

export type TimezoneOption = (typeof TIMEZONE_OPTIONS)[number]

export function findTimezoneOption(value: string): TimezoneOption | undefined {
  return TIMEZONE_OPTIONS.find((timezone) => timezone.value === value)
}
