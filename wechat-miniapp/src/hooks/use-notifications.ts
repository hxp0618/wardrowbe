import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  createNotificationSetting,
  createSchedule,
  deleteNotificationSetting,
  deleteSchedule,
  getBarkDefaults,
  getNotificationHistory,
  getNotificationSettings,
  getNtfyDefaults,
  getSchedules,
  testNotificationSetting,
  updateNotificationSetting,
  updateSchedule,
} from '../services/notifications'

export function useNotificationSettings() {
  return useQuery({
    queryKey: ['miniapp', 'notification-settings'],
    queryFn: getNotificationSettings,
  })
}

export function useNtfyDefaults() {
  return useQuery({
    queryKey: ['miniapp', 'notification-defaults', 'ntfy'],
    queryFn: getNtfyDefaults,
  })
}

export function useBarkDefaults() {
  return useQuery({
    queryKey: ['miniapp', 'notification-defaults', 'bark'],
    queryFn: getBarkDefaults,
  })
}

export function useSchedules() {
  return useQuery({
    queryKey: ['miniapp', 'schedules'],
    queryFn: getSchedules,
  })
}

export function useNotificationHistory(limit = 20) {
  return useQuery({
    queryKey: ['miniapp', 'notification-history', limit],
    queryFn: () => getNotificationHistory(limit),
  })
}

function invalidateNotifications(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: ['miniapp', 'notification-settings'] })
  void queryClient.invalidateQueries({ queryKey: ['miniapp', 'schedules'] })
  void queryClient.invalidateQueries({ queryKey: ['miniapp', 'notification-history'] })
}

export function useCreateNotificationSetting() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createNotificationSetting,
    onSuccess: () => invalidateNotifications(queryClient),
  })
}

export function useUpdateNotificationSetting() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string
      data: Partial<{ enabled: boolean; priority: number; config: Record<string, unknown> }>
    }) => updateNotificationSetting(id, data),
    onSuccess: () => invalidateNotifications(queryClient),
  })
}

export function useDeleteNotificationSetting() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteNotificationSetting,
    onSuccess: () => invalidateNotifications(queryClient),
  })
}

export function useTestNotificationSetting() {
  return useMutation({
    mutationFn: testNotificationSetting,
  })
}

export function useCreateSchedule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createSchedule,
    onSuccess: () => invalidateNotifications(queryClient),
  })
}

export function useUpdateSchedule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string
      data: Partial<{
        notification_time: string
        occasion: string
        enabled: boolean
        notify_day_before: boolean
      }>
    }) => updateSchedule(id, data),
    onSuccess: () => invalidateNotifications(queryClient),
  })
}

export function useDeleteSchedule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteSchedule,
    onSuccess: () => invalidateNotifications(queryClient),
  })
}
