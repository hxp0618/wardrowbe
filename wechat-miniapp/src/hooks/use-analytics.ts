import { useQuery } from '@tanstack/react-query'

import { getAnalytics } from '../services/analytics'

export function useAnalytics(days = 60) {
  return useQuery({
    queryKey: ['miniapp', 'analytics', days],
    queryFn: () => getAnalytics(days),
    staleTime: 5 * 60 * 1000,
  })
}
