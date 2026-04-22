import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  acknowledgeInsight,
  generateInsights,
  getLearning,
  recomputeLearning,
} from '../services/learning'

export function useLearning() {
  return useQuery({
    queryKey: ['miniapp', 'learning'],
    queryFn: getLearning,
    staleTime: 5 * 60 * 1000,
  })
}

export function useRecomputeLearning() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: recomputeLearning,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['miniapp', 'learning'] })
    },
  })
}

export function useGenerateInsights() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: generateInsights,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['miniapp', 'learning'] })
    },
  })
}

export function useAcknowledgeInsight() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: acknowledgeInsight,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['miniapp', 'learning'] })
    },
  })
}
