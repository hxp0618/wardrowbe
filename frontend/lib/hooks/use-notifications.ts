'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import type { NotificationChannelType } from '@wardrowbe/shared-services';
import {
  createNotificationSetting as createNotificationSettingRequest,
  createSchedule as createScheduleRequest,
  deleteNotificationSetting as deleteNotificationSettingRequest,
  deleteSchedule as deleteScheduleRequest,
  listNotificationHistory as listNotificationHistoryRequest,
  listNotificationSettings as listNotificationSettingsRequest,
  listSchedules as listSchedulesRequest,
  testNotificationSetting as testNotificationSettingRequest,
  updateNotificationSetting as updateNotificationSettingRequest,
  updateSchedule as updateScheduleRequest,
} from '@wardrowbe/shared-services';

import { api, setAccessToken } from '@/lib/api';

function useSetTokenIfAvailable() {
  const { data: session } = useSession();
  if (session?.accessToken) {
    setAccessToken(session.accessToken as string);
  }
}

export type {
  NotificationChannelType,
  NotificationHistory,
  NotificationSettings,
  Schedule,
} from '@wardrowbe/shared-services';

export function useNotificationSettings() {
  const { status } = useSession();
  useSetTokenIfAvailable();

  return useQuery({
    queryKey: ['notification-settings'],
    queryFn: () => listNotificationSettingsRequest(api),
    enabled: status !== 'loading',
  });
}

export function useCreateNotificationSetting() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  return useMutation({
    mutationFn: async (data: {
      channel: NotificationChannelType;
      enabled: boolean;
      priority: number;
      config: Record<string, unknown>;
    }) => {
      if (session?.accessToken) {
        setAccessToken(session.accessToken as string);
      }
      return createNotificationSettingRequest(api, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-settings'] });
    },
  });
}

export function useUpdateNotificationSetting() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<{ enabled: boolean; priority: number; config: Record<string, unknown> }>;
    }) => {
      if (session?.accessToken) {
        setAccessToken(session.accessToken as string);
      }
      return updateNotificationSettingRequest(api, id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-settings'] });
    },
  });
}

export function useDeleteNotificationSetting() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  return useMutation({
    mutationFn: async (id: string) => {
      if (session?.accessToken) {
        setAccessToken(session.accessToken as string);
      }
      return deleteNotificationSettingRequest(api, id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-settings'] });
    },
  });
}

export function useTestNotificationSetting() {
  const { data: session } = useSession();

  return useMutation({
    mutationFn: async (id: string) => {
      if (session?.accessToken) {
        setAccessToken(session.accessToken as string);
      }
      return testNotificationSettingRequest(api, id);
    },
  });
}

export function useSchedules() {
  const { status } = useSession();
  useSetTokenIfAvailable();

  return useQuery({
    queryKey: ['schedules'],
    queryFn: () => listSchedulesRequest(api),
    enabled: status !== 'loading',
  });
}

export function useCreateSchedule() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  return useMutation({
    mutationFn: async (data: {
      day_of_week: number;
      notification_time: string;
      occasion: string;
      enabled: boolean;
      notify_day_before?: boolean;
    }) => {
      if (session?.accessToken) {
        setAccessToken(session.accessToken as string);
      }
      return createScheduleRequest(api, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
    },
  });
}

export function useUpdateSchedule() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<{
        notification_time: string;
        occasion: string;
        enabled: boolean;
        notify_day_before: boolean;
      }>;
    }) => {
      if (session?.accessToken) {
        setAccessToken(session.accessToken as string);
      }
      return updateScheduleRequest(api, id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
    },
  });
}

export function useDeleteSchedule() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  return useMutation({
    mutationFn: async (id: string) => {
      if (session?.accessToken) {
        setAccessToken(session.accessToken as string);
      }
      return deleteScheduleRequest(api, id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
    },
  });
}

export function useNotificationHistory(limit = 20) {
  const { status } = useSession();
  useSetTokenIfAvailable();

  return useQuery({
    queryKey: ['notification-history', limit],
    queryFn: () => listNotificationHistoryRequest(api, limit),
    enabled: status !== 'loading',
  });
}
