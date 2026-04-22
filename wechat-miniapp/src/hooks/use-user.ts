import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  completeOnboarding,
  getUserProfile,
  updateUserProfile,
} from '../services/user'

export function useUserProfile() {
  return useQuery({
    queryKey: ['miniapp', 'user-profile'],
    queryFn: getUserProfile,
  })
}

export function useUpdateUserProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateUserProfile,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['miniapp', 'user-profile'] })
    },
  })
}

export function useCompleteOnboarding() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: completeOnboarding,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['miniapp', 'user-profile'] })
    },
  })
}
