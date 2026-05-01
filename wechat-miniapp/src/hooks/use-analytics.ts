import { useQuery } from '@tanstack/react-query'

import { getAnalytics } from '../services/analytics'

import { useAuthQueryEnabled } from './auth-query'

export function useAnalytics(days = 60) {
  const authQueryEnabled = useAuthQueryEnabled()

  return useQuery({
    queryKey: ['miniapp', 'analytics', days],
    queryFn: () => getAnalytics(days),
    enabled: authQueryEnabled,
    staleTime: 5 * 60 * 1000,
  })
}
