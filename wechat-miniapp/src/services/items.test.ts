import { beforeEach, describe, expect, it, vi } from 'vitest'

const post = vi.fn()

vi.mock('../lib/api', () => ({
  api: {
    post,
  },
}))

vi.mock('../lib/api-upload', () => ({
  uploadApiFile: vi.fn(),
}))

describe('item services', () => {
  beforeEach(() => {
    post.mockReset()
  })

  it('queues item reanalysis through the backend analyze endpoint', async () => {
    post.mockResolvedValue({ id: 'item-1', status: 'processing' })

    const { reanalyzeItem } = await import('./items')

    await reanalyzeItem('item-1')

    expect(post).toHaveBeenCalledWith('/items/item-1/analyze')
  })

  it('restores archived items through the backend restore endpoint', async () => {
    post.mockResolvedValue({ id: 'item-1', status: 'ready', is_archived: false })

    const { unarchiveItem } = await import('./items')

    await unarchiveItem('item-1')

    expect(post).toHaveBeenCalledWith('/items/item-1/restore')
  })
})
