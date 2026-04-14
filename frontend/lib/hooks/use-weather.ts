'use client';

import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { api, setAccessToken } from '@/lib/api';
import { useAuth } from '@/lib/hooks/use-auth';

function useSetTokenIfAvailable() {
  const { data: session } = useSession();
  if (session?.accessToken) {
    setAccessToken(session.accessToken as string);
  }
}

export interface Weather {
  temperature: number;
  feels_like: number;
  humidity: number;
  precipitation_chance: number;
  precipitation_mm: number;
  wind_speed: number;
  condition: string;
  condition_code: number;
  is_day: boolean;
  uv_index: number;
  timestamp: string;
}

export function useWeather() {
  const { status } = useSession();
  const { user, isAuthenticated, isLoading } = useAuth();
  useSetTokenIfAvailable();
  const hasLocation = user?.location_lat != null && user?.location_lon != null;

  return useQuery({
    queryKey: ['weather', user?.id ?? null, user?.location_lat ?? null, user?.location_lon ?? null],
    queryFn: () => api.get<Weather>('/weather/current'),
    enabled: status === 'authenticated' && isAuthenticated && !isLoading && hasLocation,
    staleTime: 1000 * 60 * 15, // 15 minutes - weather doesn't change that fast
    retry: false, // Don't retry if location not set
  });
}
