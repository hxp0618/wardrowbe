import { beforeEach, describe, expect, it, vi } from 'vitest'

const get = vi.fn()
const post = vi.fn()

vi.mock('../lib/api', () => ({
  api: {
    get,
    post,
  },
}))

describe('pairing services', () => {
  beforeEach(() => {
    get.mockReset()
    post.mockReset()
  })

  it('generates pairings through the backend item-scoped endpoint', async () => {
    post.mockResolvedValue({ generated: 0, pairings: [] })

    const { generatePairings } = await import('./pairings')

    await generatePairings('item-1', { num_pairings: 5 })

    expect(post).toHaveBeenCalledWith('/pairings/generate/item-1', { num_pairings: 5 })
  })
})
