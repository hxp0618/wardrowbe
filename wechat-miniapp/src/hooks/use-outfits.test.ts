import { beforeEach, describe, expect, it, vi } from 'vitest'

type MockQueryOptions = {
  enabled: boolean
  queryKey: unknown[]
  queryFn: () => Promise<unknown>
}

const useQuery = vi.fn((options) => options)
const useMutation = vi.fn((options) => options)
const invalidateQueries = vi.fn()
const listCurrentWeather = vi.fn()
const listWeatherForecast = vi.fn()
let authQueryEnabled = true

vi.mock('@tanstack/react-query', () => ({
  useMutation,
  useQuery,
  useQueryClient: () => ({
    invalidateQueries,
  }),
}))

vi.mock('../services/outfits', () => ({
  acceptOutfit: vi.fn(),
  cloneOutfit: vi.fn(),
  createManualOutfit: vi.fn(),
  deleteOutfit: vi.fn(),
  getOutfit: vi.fn(),
  listCurrentWeather,
  listOutfits: vi.fn(),
  listPendingOutfits: vi.fn(),
  listWeatherForecast,
  rejectOutfit: vi.fn(),
  submitOutfitFeedback: vi.fn(),
  suggestOutfit: vi.fn(),
}))

vi.mock('./auth-query', () => ({
  useAuthQueryEnabled: vi.fn((enabled = true) => enabled && authQueryEnabled),
}))

describe('weather outfit hooks', () => {
  beforeEach(() => {
    vi.resetModules()
    useQuery.mockClear()
    useMutation.mockClear()
    invalidateQueries.mockClear()
    listCurrentWeather.mockClear()
    listWeatherForecast.mockClear()
    authQueryEnabled = true
  })

  it('waits for saved coordinates before loading current weather', async () => {
    const { useWeather } = await import('./use-outfits')

    const query = useWeather({ location_lat: undefined, location_lon: undefined }) as unknown as MockQueryOptions

    expect(query.enabled).toBe(false)
    expect(query.queryKey).toEqual(['miniapp', 'weather', null, null])
  })

  it('keys and loads current weather with saved coordinates', async () => {
    const { useWeather } = await import('./use-outfits')

    const query = useWeather({ location_lat: 31.2304, location_lon: 121.4737 }) as unknown as MockQueryOptions
    await query.queryFn()

    expect(query.enabled).toBe(true)
    expect(query.queryKey).toEqual(['miniapp', 'weather', 31.2304, 121.4737])
    expect(listCurrentWeather).toHaveBeenCalledWith({
      latitude: 31.2304,
      longitude: 121.4737,
    })
  })

  it('keys and loads forecast weather with saved coordinates', async () => {
    const { useWeatherForecast } = await import('./use-outfits')

    const query = useWeatherForecast(5, true, {
      location_lat: 31.2304,
      location_lon: 121.4737,
    }) as unknown as MockQueryOptions
    await query.queryFn()

    expect(query.enabled).toBe(true)
    expect(query.queryKey).toEqual(['miniapp', 'weather-forecast', 5, 31.2304, 121.4737])
    expect(listWeatherForecast).toHaveBeenCalledWith(5, {
      latitude: 31.2304,
      longitude: 121.4737,
    })
  })

  it('waits for the auth session before loading weather', async () => {
    authQueryEnabled = false

    const { useWeather } = await import('./use-outfits')

    const query = useWeather({ location_lat: 31.2304, location_lon: 121.4737 }) as unknown as MockQueryOptions

    expect(query.enabled).toBe(false)
  })
})
