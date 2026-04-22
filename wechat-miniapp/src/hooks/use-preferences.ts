import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  getPreferences,
  resetPreferences,
  updatePreferences,
} from '../services/preferences'

export function usePreferences() {
  return useQuery({
    queryKey: ['miniapp', 'preferences'],
    queryFn: getPreferences,
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
