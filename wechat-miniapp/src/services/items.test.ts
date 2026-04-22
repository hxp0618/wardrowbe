import { beforeEach, describe, expect, it, vi } from 'vitest'

const apiGet = vi.fn()
const getStorageSync = vi.fn()
const uploadFile = vi.fn()

vi.mock('../lib/api', () => ({
  api: {
    get: apiGet,
  },
  resolveApiOrigin: vi.fn(() => 'https://api.example.com'),
}))

vi.mock('@tarojs/taro', () => ({
  default: {
    getStorageSync,
    uploadFile,
  },
}))

describe('items services', () => {
  beforeEach(() => {
    apiGet.mockReset()
    getStorageSync.mockReset()
    uploadFile.mockReset()
  })

  it('builds list query params for page, search and type filters', async () => {
    const { listItems } = await import('./items')

    await listItems(
      {
        search: 'shirt',
        type: 'shirt',
        is_archived: false,
        sort_by: 'created_at',
        sort_order: 'desc',
      },
      3,
      10
    )

    expect(apiGet).toHaveBeenCalledWith('/items', {
      params: {
        page: '3',
        page_size: '10',
        search: 'shirt',
        type: 'shirt',
        is_archived: 'false',
        sort_by: 'created_at',
        sort_order: 'desc',
      },
    })
  })
})
