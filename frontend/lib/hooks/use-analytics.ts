import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { getAnalytics } from '@wardrowbe/shared-services';

import { api, setAccessToken } from '@/lib/api';

// Helper to set token if available (for NextAuth mode)
function useSetTokenIfAvailable() {
  const { data: session } = useSession();
  if (session?.accessToken) {
    setAccessToken(session.accessToken as string);
  }
}

export type {
  AcceptanceRateTrend,
  AnalyticsData,
  ColorDistribution,
  TypeDistribution,
  WardrobeStats,
  WearStats,
} from '@wardrowbe/shared-services';

export function useAnalytics(days = 30) {
  const { status } = useSession();
  useSetTokenIfAvailable();

  return useQuery({
    queryKey: ['analytics', days],
    queryFn: () => getAnalytics(api, days),
    enabled: status !== 'loading',
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
