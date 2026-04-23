'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import {
  getPreferences,
  resetPreferences as resetPreferencesRequest,
  testAIEndpoint as testAIEndpointRequest,
  updatePreferences as updatePreferencesRequest,
} from '@wardrowbe/shared-services';

import { api, setAccessToken } from '@/lib/api';
import { Preferences } from '@/lib/types';

function useSetTokenIfAvailable() {
  const { data: session } = useSession();
  if (session?.accessToken) {
    setAccessToken(session.accessToken as string);
  }
}

export function usePreferences() {
  const { status } = useSession();
  useSetTokenIfAvailable();

  return useQuery({
    queryKey: ['preferences'],
    queryFn: () => getPreferences(api),
    enabled: status !== 'loading',
  });
}

export function useUpdatePreferences() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  return useMutation({
    mutationFn: (data: Partial<Preferences>) => {
      if (session?.accessToken) {
        setAccessToken(session.accessToken as string);
      }
      return updatePreferencesRequest(api, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preferences'] });
    },
  });
}

export function useResetPreferences() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  return useMutation({
    mutationFn: () => {
      if (session?.accessToken) {
        setAccessToken(session.accessToken as string);
      }
      return resetPreferencesRequest(api);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preferences'] });
    },
  });
}

export function useTestAIEndpoint() {
  const { data: session } = useSession();

  return useMutation({
    mutationFn: (url: string) => {
      if (session?.accessToken) {
        setAccessToken(session.accessToken as string);
      }
      return testAIEndpointRequest(api, url);
    },
  });
}

export type { AITestResult } from '@wardrowbe/shared-services';
