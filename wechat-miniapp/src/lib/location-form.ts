import type { UserProfileUpdate } from '../services/types'

type LocationSource = {
  location_name?: string | null
  location_lat?: number | null
  location_lon?: number | null
}

export type LocationDraft = {
  locationName: string
  locationLat: number | undefined
  locationLon: number | undefined
}

export type ResolvedLocation = {
  name?: string
  address?: string
  latitude: number
  longitude: number
}

export function toResolvedLocationDraft(source?: LocationSource | null): LocationDraft {
  return {
    locationName: source?.location_name || '',
    locationLat: source?.location_lat ?? undefined,
    locationLon: source?.location_lon ?? undefined,
  }
}

export function applyManualLocationName(
  current: LocationDraft,
  nextLocationName: string
): LocationDraft {
  if (nextLocationName === current.locationName) {
    return current
  }

  return {
    locationName: nextLocationName,
    locationLat: undefined,
    locationLon: undefined,
  }
}

export function hasResolvedLocation(location: LocationDraft): boolean {
  return location.locationLat != null && location.locationLon != null
}

export async function resolveLocationDraftForSave(
  location: LocationDraft,
  geocodeLocationName: (locationName: string) => Promise<ResolvedLocation>
): Promise<LocationDraft> {
  const locationName = location.locationName.trim()

  if (hasResolvedLocation(location)) {
    return {
      locationName,
      locationLat: location.locationLat,
      locationLon: location.locationLon,
    }
  }

  if (!locationName) {
    return {
      locationName: '',
      locationLat: undefined,
      locationLon: undefined,
    }
  }

  const resolvedLocation = await geocodeLocationName(locationName)

  return {
    locationName: resolvedLocation.name || resolvedLocation.address || locationName,
    locationLat: resolvedLocation.latitude,
    locationLon: resolvedLocation.longitude,
  }
}

export function buildUserProfileUpdate(input: {
  displayName?: string
  timezone?: string
  location: LocationDraft
}): UserProfileUpdate {
  const locationName = input.location.locationName.trim()
  const hasCoordinates = hasResolvedLocation(input.location)

  return {
    ...(input.displayName !== undefined ? { display_name: input.displayName } : {}),
    ...(input.timezone !== undefined ? { timezone: input.timezone } : {}),
    location_name: locationName || null,
    location_lat: hasCoordinates ? input.location.locationLat! : null,
    location_lon: hasCoordinates ? input.location.locationLon! : null,
  }
}
