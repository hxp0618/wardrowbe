import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  getPreferences,
  resetPreferences,
  updatePreferences,
} from '../services/preferences'

import { useAuthQueryEnabled } from './auth-query'

export function usePreferences() {
  const authQueryEnabled = useAuthQueryEnabled()

  return useQuery({
    queryKey: ['miniapp', 'preferences'],
    queryFn: getPreferences,
    enabled: authQueryEnabled,
  })
}

export function useUpdatePreferences() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updatePreferences,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['miniapp', 'preferences'] })
    },
  })
}

export function useResetPreferences() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: resetPreferences,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['miniapp', 'preferences'] })
    },
  })
}
