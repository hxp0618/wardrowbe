import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { deletePairing, generatePairings, listItemPairings, listPairings } from '../services/pairings'

import type { GeneratePairingsRequest } from '../services/types'

export function usePairings(page = 1, pageSize = 20, sourceType?: string) {
  return useQuery({
    queryKey: ['miniapp', 'pairings', page, pageSize, sourceType],
    queryFn: () => listPairings(page, pageSize, sourceType),
  })
}

export function useGeneratePairings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: GeneratePairingsRequest) => generatePairings(request),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['miniapp', 'pairings'] })
    },
  })
}

export function useDeletePairing() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deletePairing,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['miniapp', 'pairings'] })
    },
  })
}

export function useItemPairings(itemId: string, page = 1, pageSize = 20) {
  return useQuery({
    queryKey: ['miniapp', 'pairings', 'item', itemId, page, pageSize],
    queryFn: () => listItemPairings(itemId, page, pageSize),
    enabled: !!itemId,
  })
}
