import { api } from '../lib/api'

import type {
  NotificationHistory,
  NotificationSettings,
  NotificationSettings as NotificationSettingsType,
  NotificationChannelType,
  Schedule,
} from './types'

export type { NotificationChannelType, NotificationSettingsType, Schedule }

export function getNtfyDefaults(): Promise<{ server: string; has_token: boolean }> {
  return api.get<{ server: string; has_token: boolean }>('/notifications/defaults/ntfy')
}

export function getBarkDefaults(): Promise<{ server: string }> {
  return api.get<{ server: string }>('/notifications/defaults/bark')
}

export function getNotificationSettings(): Promise<NotificationSettings[]> {
  return api.get<NotificationSettings[]>('/notifications/settings')
}

export function createNotificationSetting(payload: {
  channel: NotificationChannelType
  enabled: boolean
  priority: number
  config: Record<string, unknown>
}): Promise<NotificationSettings> {
  return api.post<NotificationSettings>('/notifications/settings', payload)
}

export function updateNotificationSetting(
  id: string,
  payload: Partial<{
    enabled: boolean
    priority: number
    config: Record<string, unknown>
  }>
): Promise<NotificationSettings> {
  return api.patch<NotificationSettings>(`/notifications/settings/${id}`, payload)
}

export function deleteNotificationSetting(id: string): Promise<{ message: string }> {
  return api.delete<{ message: string }>(`/notifications/settings/${id}`)
}

export function testNotificationSetting(id: string): Promise<{ success: boolean; message: string }> {
  return api.post<{ success: boolean; message: string }>(
    `/notifications/settings/${id}/test`
  )
}

export function getSchedules(): Promise<Schedule[]> {
  return api.get<Schedule[]>('/notifications/schedules')
}

export function createSchedule(payload: {
  day_of_week: number
  notification_time: string
  occasion: string
  enabled: boolean
  notify_day_before?: boolean
}): Promise<Schedule> {
  return api.post<Schedule>('/notifications/schedules', payload)
}

export function updateSchedule(
  id: string,
  payload: Partial<{
    notification_time: string
    occasion: string
    enabled: boolean
    notify_day_before: boolean
  }>
): Promise<Schedule> {
  return api.patch<Schedule>(`/notifications/schedules/${id}`, payload)
}

export function deleteSchedule(id: string): Promise<{ message: string }> {
  return api.delete<{ message: string }>(`/notifications/schedules/${id}`)
}

export function getNotificationHistory(limit = 20): Promise<NotificationHistory[]> {
  return api.get<NotificationHistory[]>('/notifications/history', {
    params: { limit: String(limit) },
  })
}
