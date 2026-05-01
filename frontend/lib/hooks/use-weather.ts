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

export interface ForecastDay {
  date: string;
  temp_min: number;
  temp_max: number;
  precipitation_chance: number;
  condition: string;
  condition_code: number;
}

export interface ForecastResponse {
  latitude: number;
  longitude: number;
  forecast: ForecastDay[];
}

export interface GeocodedLocation {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

function buildWeatherCoordinateParams(latitude: number, longitude: number) {
  return {
    latitude: String(latitude),
    longitude: String(longitude),
  };
}

export function geocodeWeatherLocation(locationName: string) {
  return api.get<GeocodedLocation>('/weather/geocode', {
    params: {
      name: locationName.trim(),
    },
  });
}

export function useWeather() {
  const { status } = useSession();
  const { user, isAuthenticated, isLoading } = useAuth();
  useSetTokenIfAvailable();
  const latitude = user?.location_lat ?? null;
  const longitude = user?.location_lon ?? null;
  const hasLocation = latitude != null && longitude != null;

  return useQuery({
    queryKey: ['weather', user?.id ?? null, latitude, longitude],
    queryFn: () => api.get<Weather>('/weather/current', {
      params: buildWeatherCoordinateParams(latitude!, longitude!),
    }),
    enabled: status === 'authenticated' && isAuthenticated && !isLoading && hasLocation,
    staleTime: 1000 * 60 * 15, // 15 minutes - weather doesn't change that fast
    retry: false, // Don't retry if location not set
  });
}

export function useWeatherForecast(days: number) {
  const { status } = useSession();
  const { user, isAuthenticated, isLoading } = useAuth();
  useSetTokenIfAvailable();
  const latitude = user?.location_lat ?? null;
  const longitude = user?.location_lon ?? null;
  const hasLocation = latitude != null && longitude != null;

  return useQuery({
    queryKey: ['weather-forecast', user?.id ?? null, latitude, longitude, days],
    queryFn: () => api.get<ForecastResponse>('/weather/forecast', {
      params: {
        days: String(days),
        ...buildWeatherCoordinateParams(latitude!, longitude!),
      },
    }),
    enabled: status === 'authenticated' && isAuthenticated && !isLoading && hasLocation && days > 0,
    staleTime: 1000 * 60 * 30,
    retry: false,
  });
}
