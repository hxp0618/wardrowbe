import { describe, expect, it } from 'vitest'

import {
  applyManualLocationName,
  buildUserProfileUpdate,
  hasResolvedLocation,
  toResolvedLocationDraft,
} from './location-form'

describe('location-form helpers', () => {
  it('creates a resolved draft from user profile coordinates', () => {
    expect(
      toResolvedLocationDraft({
        location_name: 'Shanghai',
        location_lat: 31.2304,
        location_lon: 121.4737,
      })
    ).toEqual({
      locationName: 'Shanghai',
      locationLat: 31.2304,
      locationLon: 121.4737,
    })
  })

  it('clears saved coordinates when the location name is manually edited', () => {
    expect(
      applyManualLocationName(
        {
          locationName: 'Shanghai',
          locationLat: 31.2304,
          locationLon: 121.4737,
        },
        'Hangzhou'
      )
    ).toEqual({
      locationName: 'Hangzhou',
      locationLat: undefined,
      locationLon: undefined,
    })
  })

  it('treats a draft as resolved only when both coordinates are present', () => {
    expect(
      hasResolvedLocation({
        locationName: 'Shanghai',
        locationLat: 31.2304,
        locationLon: 121.4737,
      })
    ).toBe(true)

    expect(
      hasResolvedLocation({
        locationName: 'Shanghai',
        locationLat: 31.2304,
        locationLon: undefined,
      })
    ).toBe(false)
  })

  it('builds a profile update payload with full location coordinates', () => {
    expect(
      buildUserProfileUpdate({
        displayName: 'Ada',
        timezone: 'Asia/Shanghai',
        location: {
          locationName: 'Shanghai',
          locationLat: 31.2304,
          locationLon: 121.4737,
        },
      })
    ).toEqual({
      display_name: 'Ada',
      timezone: 'Asia/Shanghai',
      location_name: 'Shanghai',
      location_lat: 31.2304,
      location_lon: 121.4737,
    })
  })
})
