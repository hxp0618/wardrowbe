'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import {
  getUserProfile,
  type UserProfileUpdate,
  updateUserProfile as updateUserProfileRequest,
} from '@wardrowbe/shared-services';

import { api, setAccessToken } from '@/lib/api';

function useSetTokenIfAvailable() {
  const { data: session } = useSession();
  if (session?.accessToken) {
    setAccessToken(session.accessToken as string);
  }
}

export function useUserProfile() {
  const { status } = useSession();
  useSetTokenIfAvailable();

  return useQuery({
    queryKey: ['user-profile'],
    queryFn: () => getUserProfile(api),
    enabled: status !== 'loading',
  });
}

export function useUpdateUserProfile() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  return useMutation({
    mutationFn: async (data: UserProfileUpdate) => {
      if (session?.accessToken) {
        setAccessToken(session.accessToken as string);
      }
      return updateUserProfileRequest(api, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    },
  });
}

export type { UserProfile, UserProfileUpdate } from '@wardrowbe/shared-services';

