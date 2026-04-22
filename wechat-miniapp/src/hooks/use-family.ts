import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  cancelInvite,
  createFamily,
  getFamily,
  inviteMember,
  joinFamily,
  joinFamilyByToken,
  leaveFamily,
  regenerateInviteCode,
  updateFamily,
} from '../services/family'

export function useFamily() {
  return useQuery({
    queryKey: ['miniapp', 'family'],
    queryFn: getFamily,
    retry: false,
  })
}

function invalidateFamily(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: ['miniapp', 'family'] })
  void queryClient.invalidateQueries({ queryKey: ['miniapp', 'user-profile'] })
}

export function useCreateFamily() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createFamily,
    onSuccess: () => invalidateFamily(queryClient),
  })
}

export function useJoinFamily() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: joinFamily,
    onSuccess: () => invalidateFamily(queryClient),
  })
}

export function useJoinFamilyByToken() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: joinFamilyByToken,
    onSuccess: () => invalidateFamily(queryClient),
  })
}

export function useUpdateFamily() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateFamily,
    onSuccess: () => invalidateFamily(queryClient),
  })
}

export function useRegenerateInviteCode() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: regenerateInviteCode,
    onSuccess: () => invalidateFamily(queryClient),
  })
}

export function useInviteMember() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ email, role }: { email: string; role?: 'member' | 'admin' }) =>
      inviteMember(email, role),
    onSuccess: () => invalidateFamily(queryClient),
  })
}

export function useCancelInvite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: cancelInvite,
    onSuccess: () => invalidateFamily(queryClient),
  })
}

export function useLeaveFamily() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: leaveFamily,
    onSuccess: () => invalidateFamily(queryClient),
  })
}
