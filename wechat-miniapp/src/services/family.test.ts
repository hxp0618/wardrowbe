import { beforeEach, describe, expect, it, vi } from 'vitest'

const apiGet = vi.fn()
const apiPost = vi.fn()
const apiPatch = vi.fn()
const apiDelete = vi.fn()

vi.mock('../lib/api', () => ({
  api: {
    get: apiGet,
    post: apiPost,
    patch: apiPatch,
    delete: apiDelete,
  },
}))

describe('family services', () => {
  beforeEach(() => {
    apiGet.mockReset()
    apiPost.mockReset()
    apiPatch.mockReset()
    apiDelete.mockReset()
  })

  it('loads current family and posts create/join payloads', async () => {
    const {
      createFamily,
      getFamily,
      joinFamily,
      joinFamilyByToken,
    } = await import('./family')

    await getFamily()
    await createFamily('Wardrowbe Home')
    await joinFamily('ABC123')
    await joinFamilyByToken('invite-token-1')

    expect(apiGet).toHaveBeenCalledWith('/families/me')
    expect(apiPost).toHaveBeenNthCalledWith(1, '/families', { name: 'Wardrowbe Home' })
    expect(apiPost).toHaveBeenNthCalledWith(2, '/families/join', { invite_code: 'ABC123' })
    expect(apiPost).toHaveBeenNthCalledWith(3, '/families/join-by-token', { token: 'invite-token-1' })
  })
})
