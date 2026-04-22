import { useQuery } from '@tanstack/react-query'

import { listPairings } from '../services/pairings'

export function usePairings(page = 1, pageSize = 20, sourceType?: string) {
  return useQuery({
    queryKey: ['miniapp', 'pairings', page, pageSize, sourceType],
    queryFn: () => listPairings(page, pageSize, sourceType),
  })
}
