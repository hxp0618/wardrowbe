import { beforeEach, describe, expect, it, vi } from 'vitest'

const getUserProfile = vi.fn()
const listCurrentWeather = vi.fn()

vi.mock('./user', () => ({
  getUserProfile,
}))

vi.mock('./outfits', () => ({
  listCurrentWeather,
}))

describe('miniapp session bootstrap', () => {
  beforeEach(() => {
    getUserProfile.mockReset()
    listCurrentWeather.mockReset()
  })

  it('loads the saved profile and prefetches weather after login when coordinates exist', async () => {
    const profile = {
      id: 'user-1',
      email: 'ada@example.com',
      display_name: 'Ada',
      timezone: 'Asia/Shanghai',
      location_lat: 31.2304,
      location_lon: 121.4737,
      location_name: 'Shanghai',
      role: 'owner',
      onboarding_completed: true,
    }
    const weather = { temperature: 22 }
    getUserProfile.mockResolvedValue(profile)
    listCurrentWeather.mockResolvedValue(weather)

    const queryClient = {
      fetchQuery: vi.fn(async (options) => options.queryFn()),
      prefetchQuery: vi.fn(async (options) => options.queryFn()),
    }

    const { bootstrapMiniappSession } = await import('./session-bootstrap')

    await expect(bootstrapMiniappSession(queryClient)).resolves.toEqual(profile)

    expect(queryClient.fetchQuery).toHaveBeenCalledWith({
      queryKey: ['miniapp', 'user-profile'],
      queryFn: getUserProfile,
    })
    expect(queryClient.prefetchQuery).toHaveBeenCalledWith({
      queryKey: ['miniapp', 'weather', 31.2304, 121.4737],
      queryFn: expect.any(Function),
    })
    expect(listCurrentWeather).toHaveBeenCalledWith({
      latitude: 31.2304,
      longitude: 121.4737,
    })
  })
})
