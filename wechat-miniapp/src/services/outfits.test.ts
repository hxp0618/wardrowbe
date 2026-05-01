import { beforeEach, describe, expect, it, vi } from 'vitest'

const get = vi.fn()

vi.mock('../lib/api', () => ({
  api: {
    get,
  },
}))

describe('weather services', () => {
  beforeEach(() => {
    get.mockReset()
  })

  it('geocodes a typed location through the backend weather API', async () => {
    get.mockResolvedValue({
      name: 'Shanghai',
      address: 'Shanghai, China',
      latitude: 31.2304,
      longitude: 121.4737,
    })

    const { geocodeWeatherLocation } = await import('./outfits')

    await expect(geocodeWeatherLocation(' Shanghai ')).resolves.toEqual({
      name: 'Shanghai',
      address: 'Shanghai, China',
      latitude: 31.2304,
      longitude: 121.4737,
    })

    expect(get).toHaveBeenCalledWith('/weather/geocode', {
      params: {
        name: 'Shanghai',
      },
    })
  })
})
