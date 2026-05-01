type WeatherLocationSource = {
  location_lat?: number | null
  location_lon?: number | null
} | null | undefined

export type WeatherPanelState = 'loading' | 'ready' | 'missing-location' | 'error' | 'empty'

export function hasWeatherCoordinates(location: WeatherLocationSource): boolean {
  return (
    typeof location?.location_lat === 'number' &&
    typeof location?.location_lon === 'number' &&
    Number.isFinite(location.location_lat) &&
    Number.isFinite(location.location_lon)
  )
}

export function getWeatherErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback
}

export function resolveWeatherPanelState(input: {
  profileLoading: boolean
  weatherLoading: boolean
  hasLocation: boolean
  hasWeather: boolean
  error: unknown
}): WeatherPanelState {
  if (input.profileLoading || input.weatherLoading) return 'loading'
  if (input.hasWeather) return 'ready'
  if (!input.hasLocation) return 'missing-location'
  if (input.error) return 'error'
  return 'empty'
}
