import type { WardrowbeApi } from "./types";

export type NotificationChannelType =
  | "ntfy"
  | "mattermost"
  | "email"
  | "bark"
  | "expo_push"
  | "webhook";

export interface NotificationSettings {
  id: string;
  user_id: string;
  channel: NotificationChannelType;
  enabled: boolean;
  priority: number;
  config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Schedule {
  id: string;
  user_id: string;
  day_of_week: number;
  notification_time: string;
  occasion: string;
  enabled: boolean;
  notify_day_before: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationHistory {
  id: string;
  user_id: string;
  outfit_id?: string;
  channel: string;
  status: string;
  attempts: number;
  sent_at?: string;
  delivered_at?: string;
  error_message?: string;
  created_at: string;
}

export function listNotificationSettings(api: WardrowbeApi): Promise<NotificationSettings[]> {
  return api.get<NotificationSettings[]>("/notifications/settings");
}

export function createNotificationSetting(
  api: WardrowbeApi,
  data: {
    channel: NotificationChannelType;
    enabled: boolean;
    priority: number;
    config: Record<string, unknown>;
  },
): Promise<NotificationSettings> {
  return api.post<NotificationSettings>("/notifications/settings", data);
}

export function updateNotificationSetting(
  api: WardrowbeApi,
  id: string,
  data: Partial<{ enabled: boolean; priority: number; config: Record<string, unknown> }>,
): Promise<NotificationSettings> {
  return api.patch<NotificationSettings>(`/notifications/settings/${id}`, data);
}

export function deleteNotificationSetting(api: WardrowbeApi, id: string): Promise<unknown> {
  return api.delete(`/notifications/settings/${id}`);
}

export function testNotificationSetting(
  api: WardrowbeApi,
  id: string,
): Promise<{ success: boolean; message: string }> {
  return api.post<{ success: boolean; message: string }>(`/notifications/settings/${id}/test`);
}

export function listSchedules(api: WardrowbeApi): Promise<Schedule[]> {
  return api.get<Schedule[]>("/notifications/schedules");
}

export function createSchedule(
  api: WardrowbeApi,
  data: {
    day_of_week: number;
    notification_time: string;
    occasion: string;
    enabled: boolean;
    notify_day_before?: boolean;
  },
): Promise<Schedule> {
  return api.post<Schedule>("/notifications/schedules", data);
}

export function updateSchedule(
  api: WardrowbeApi,
  id: string,
  data: Partial<{
    notification_time: string;
    occasion: string;
    enabled: boolean;
    notify_day_before: boolean;
  }>,
): Promise<Schedule> {
  return api.patch<Schedule>(`/notifications/schedules/${id}`, data);
}

export function deleteSchedule(api: WardrowbeApi, id: string): Promise<unknown> {
  return api.delete(`/notifications/schedules/${id}`);
}

export function listNotificationHistory(api: WardrowbeApi, limit = 20): Promise<NotificationHistory[]> {
  return api.get<NotificationHistory[]>(`/notifications/history`, { params: { limit: String(limit) } });
}
