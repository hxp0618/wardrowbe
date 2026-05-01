import { describe, expect, it, vi } from 'vitest'

import { resolveLocationDraftForSave } from './location-form'

describe('location form save resolution', () => {
  it('resolves a manually typed location name into saved weather coordinates', async () => {
    const geocodeLocationName = vi.fn().mockResolvedValue({
      name: 'Shanghai',
      address: 'Shanghai',
      latitude: 31.2304,
      longitude: 121.4737,
    })

    await expect(
      resolveLocationDraftForSave(
        {
          locationName: ' Shanghai ',
          locationLat: undefined,
          locationLon: undefined,
        },
        geocodeLocationName
      )
    ).resolves.toEqual({
      locationName: 'Shanghai',
      locationLat: 31.2304,
      locationLon: 121.4737,
    })

    expect(geocodeLocationName).toHaveBeenCalledWith('Shanghai')
  })

  it('keeps coordinates from location picker even when the picker returns no name', async () => {
    const geocodeLocationName = vi.fn()

    await expect(
      resolveLocationDraftForSave(
        {
          locationName: '',
          locationLat: 39.9075,
          locationLon: 116.39723,
        },
        geocodeLocationName
      )
    ).resolves.toEqual({
      locationName: '',
      locationLat: 39.9075,
      locationLon: 116.39723,
    })

    expect(geocodeLocationName).not.toHaveBeenCalled()
  })
})
