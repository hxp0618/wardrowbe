'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import {
  cancelInvite as cancelInviteRequest,
  createFamily as createFamilyRequest,
  getMyFamily,
  inviteMember as inviteMemberRequest,
  joinFamily as joinFamilyRequest,
  joinFamilyByToken as joinFamilyByTokenRequest,
  leaveFamily as leaveFamilyRequest,
  regenerateInviteCode as regenerateInviteCodeRequest,
  removeMember as removeMemberRequest,
  updateFamily as updateFamilyRequest,
  updateMemberRole as updateMemberRoleRequest,
} from '@wardrowbe/shared-services';

import { api, setAccessToken } from '@/lib/api';

function useSetTokenIfAvailable() {
  const { data: session } = useSession();
  if (session?.accessToken) {
    setAccessToken(session.accessToken as string);
  }
}

export function useFamily() {
  const { status } = useSession();
  useSetTokenIfAvailable();

  return useQuery({
    queryKey: ['family'],
    queryFn: () => getMyFamily(api),
    enabled: status !== 'loading',
    retry: false,
  });
}

export function useCreateFamily() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  return useMutation({
    mutationFn: async (name: string) => {
      if (session?.accessToken) {
        setAccessToken(session.accessToken as string);
      }
      return createFamilyRequest(api, name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family'] });
    },
  });
}

export function useUpdateFamily() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  return useMutation({
    mutationFn: async (name: string) => {
      if (session?.accessToken) {
        setAccessToken(session.accessToken as string);
      }
      return updateFamilyRequest(api, name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family'] });
    },
  });
}

export function useJoinFamily() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  return useMutation({
    mutationFn: async (inviteCode: string) => {
      if (session?.accessToken) {
        setAccessToken(session.accessToken as string);
      }
      return joinFamilyRequest(api, inviteCode);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family'] });
    },
  });
}

export function useJoinFamilyByToken() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  return useMutation({
    mutationFn: async (token: string) => {
      if (session?.accessToken) {
        setAccessToken(session.accessToken as string);
      }
      return joinFamilyByTokenRequest(api, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family'] });
    },
  });
}

export function useLeaveFamily() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  return useMutation({
    mutationFn: async () => {
      if (session?.accessToken) {
        setAccessToken(session.accessToken as string);
      }
      return leaveFamilyRequest(api);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family'] });
    },
  });
}

export function useRegenerateInviteCode() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  return useMutation({
    mutationFn: async () => {
      if (session?.accessToken) {
        setAccessToken(session.accessToken as string);
      }
      return regenerateInviteCodeRequest(api);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family'] });
    },
  });
}

export function useInviteMember() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  return useMutation({
    mutationFn: async ({ email, role }: { email: string; role?: string }) => {
      if (session?.accessToken) {
        setAccessToken(session.accessToken as string);
      }
      return inviteMemberRequest(api, email, role || 'member');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family'] });
    },
  });
}

export function useCancelInvite() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  return useMutation({
    mutationFn: async (inviteId: string) => {
      if (session?.accessToken) {
        setAccessToken(session.accessToken as string);
      }
      return cancelInviteRequest(api, inviteId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family'] });
    },
  });
}

export function useUpdateMemberRole() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  return useMutation({
    mutationFn: async ({ memberId, role }: { memberId: string; role: string }) => {
      if (session?.accessToken) {
        setAccessToken(session.accessToken as string);
      }
      return updateMemberRoleRequest(api, memberId, role);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family'] });
    },
  });
}

export function useRemoveMember() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  return useMutation({
    mutationFn: async (memberId: string) => {
      if (session?.accessToken) {
        setAccessToken(session.accessToken as string);
      }
      return removeMemberRequest(api, memberId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family'] });
    },
  });
}
