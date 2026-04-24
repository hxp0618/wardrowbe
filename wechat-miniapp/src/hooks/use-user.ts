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
    onSuccess: (userProfile) => {
      queryClient.setQueryData(['miniapp', 'user-profile'], userProfile)
      void queryClient.invalidateQueries({ queryKey: ['miniapp', 'user-profile'] })
      void queryClient.invalidateQueries({ queryKey: ['miniapp', 'weather'] })
      void queryClient.invalidateQueries({ queryKey: ['miniapp', 'weather-forecast'] })
    },
  })
}

export function useCompleteOnboarding() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: completeOnboarding,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['miniapp', 'user-profile'] })
      void queryClient.invalidateQueries({ queryKey: ['miniapp', 'weather'] })
      void queryClient.invalidateQueries({ queryKey: ['miniapp', 'weather-forecast'] })
    },
  })
}
