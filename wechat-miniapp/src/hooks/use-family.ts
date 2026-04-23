import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  cancelInvite,
  createFamily,
  deleteFamilyRating,
  getFamily,
  getFamilyRatings,
  inviteMember,
  joinFamily,
  joinFamilyByToken,
  leaveFamily,
  regenerateInviteCode,
  removeMember,
  submitFamilyRating,
  updateFamily,
  updateMemberRole,
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

export function useUpdateMemberRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: string }) =>
      updateMemberRole(memberId, role),
    onSuccess: () => invalidateFamily(queryClient),
  })
}

export function useRemoveMember() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: removeMember,
    onSuccess: () => invalidateFamily(queryClient),
  })
}

export function useSubmitFamilyRating() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ outfitId, rating, comment }: { outfitId: string; rating: number; comment?: string }) =>
      submitFamilyRating(outfitId, rating, comment),
    onSuccess: () => {
      invalidateFamily(queryClient)
      void queryClient.invalidateQueries({ queryKey: ['miniapp', 'outfits'] })
      void queryClient.invalidateQueries({ queryKey: ['miniapp', 'family-outfits'] })
    },
  })
}

export function useFamilyRatings(outfitId: string | undefined) {
  return useQuery({
    queryKey: ['miniapp', 'family-ratings', outfitId],
    queryFn: () => getFamilyRatings(outfitId!),
    enabled: !!outfitId,
  })
}

export function useDeleteFamilyRating() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteFamilyRating,
    onSuccess: () => {
      invalidateFamily(queryClient)
      void queryClient.invalidateQueries({ queryKey: ['miniapp', 'family-outfits'] })
    },
  })
}
