import type { QueryClient } from '@tanstack/react-query'

import { listCurrentWeather } from './outfits'
import type { WeatherCoordinates } from './outfits'
import { getUserProfile } from './user'
import type { UserProfile } from './types'

type BootstrapQueryClient = Pick<QueryClient, 'fetchQuery' | 'prefetchQuery'>

function resolveWeatherCoordinates(profile: UserProfile): WeatherCoordinates | null {
  const latitude = profile.location_lat
  const longitude = profile.location_lon

  if (
    typeof latitude !== 'number' ||
    typeof longitude !== 'number' ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    return null
  }

  return { latitude, longitude }
}

export async function bootstrapMiniappSession(
  queryClient: BootstrapQueryClient
): Promise<UserProfile | null> {
  try {
    const profile = await queryClient.fetchQuery({
      queryKey: ['miniapp', 'user-profile'],
      queryFn: getUserProfile,
    })
    const coordinates = resolveWeatherCoordinates(profile)

    if (coordinates) {
      void queryClient.prefetchQuery({
        queryKey: ['miniapp', 'weather', coordinates.latitude, coordinates.longitude],
        queryFn: () => listCurrentWeather(coordinates),
      })
    }

    return profile
  } catch {
    return null
  }
}
