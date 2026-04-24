import { beforeEach, describe, expect, it, vi } from 'vitest'

const invalidateQueries = vi.fn()
const setQueryData = vi.fn()
const updateUserProfile = vi.fn()
const completeOnboarding = vi.fn()

vi.mock('@tanstack/react-query', () => ({
  useMutation: (options: {
    mutationFn: (input: unknown) => Promise<unknown>
    onSuccess?: (data: unknown) => void | Promise<void>
  }) => ({
    mutateAsync: async (input: unknown) => {
      const data = await options.mutationFn(input)
      await options.onSuccess?.(data)
      return data
    },
  }),
  useQuery: vi.fn(),
  useQueryClient: () => ({
    invalidateQueries,
    setQueryData,
  }),
}))

vi.mock('../services/user', () => ({
  completeOnboarding,
  getUserProfile: vi.fn(),
  updateUserProfile,
}))

describe('useUpdateUserProfile', () => {
  beforeEach(() => {
    invalidateQueries.mockReset()
    setQueryData.mockReset()
    updateUserProfile.mockReset()
    completeOnboarding.mockReset()
  })

  it('updates cached profile data and refreshes weather queries after saving location', async () => {
    const updatedProfile = {
      id: 'user-1',
      display_name: 'Ada',
      location_name: 'Shanghai',
      location_lat: 31.2304,
      location_lon: 121.4737,
    }
    updateUserProfile.mockResolvedValue(updatedProfile)

    const { useUpdateUserProfile } = await import('./use-user')
    const mutation = useUpdateUserProfile()

    await mutation.mutateAsync({
      location_name: 'Shanghai',
      location_lat: 31.2304,
      location_lon: 121.4737,
    })

    expect(setQueryData).toHaveBeenCalledWith(['miniapp', 'user-profile'], updatedProfile)
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['miniapp', 'user-profile'] })
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['miniapp', 'weather'] })
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['miniapp', 'weather-forecast'] })
  })

  it('refreshes weather queries after completing onboarding', async () => {
    completeOnboarding.mockResolvedValue({ onboarding_completed: true })

    const { useCompleteOnboarding } = await import('./use-user')
    const mutation = useCompleteOnboarding()

    await mutation.mutateAsync(undefined)

    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['miniapp', 'user-profile'] })
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['miniapp', 'weather'] })
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['miniapp', 'weather-forecast'] })
  })
})
