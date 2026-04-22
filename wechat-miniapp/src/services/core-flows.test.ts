import { beforeEach, describe, expect, it, vi } from 'vitest'

const apiGet = vi.fn()
const apiPost = vi.fn()
const taroGetStorageSync = vi.fn()
const taroUploadFile = vi.fn()

vi.mock('../lib/api', () => ({
  api: {
    get: apiGet,
    post: apiPost,
  },
  resolveApiOrigin: vi.fn(() => 'https://api.example.com'),
}))

vi.mock('@tarojs/taro', () => ({
  default: {
    getStorageSync: taroGetStorageSync,
    uploadFile: taroUploadFile,
  },
}))

describe('miniapp core flow services', () => {
  beforeEach(() => {
    apiGet.mockReset()
    apiPost.mockReset()
    taroGetStorageSync.mockReset()
    taroUploadFile.mockReset()
  })

  it('lists wardrobe items with pagination and filters', async () => {
    apiGet.mockResolvedValue({ items: [], total: 0, page: 1, page_size: 20, has_more: false })

    const { listItems } = await import('./items')

    await listItems(
      {
        search: 'coat',
        type: 'coat',
        needs_wash: true,
        sort_by: 'created_at',
        sort_order: 'desc',
      },
      2,
      24
    )

    expect(apiGet).toHaveBeenCalledWith('/items', {
      params: {
        page: '2',
        page_size: '24',
        search: 'coat',
        type: 'coat',
        needs_wash: 'true',
        sort_by: 'created_at',
        sort_order: 'desc',
      },
    })
  })

  it('lists outfits and supports suggest / accept / reject actions', async () => {
    apiGet.mockResolvedValue({ outfits: [], total: 0, page: 1, page_size: 20, has_more: false })
    apiPost.mockResolvedValue({ id: 'outfit-1' })

    const {
      acceptOutfit,
      createManualOutfit,
      listOutfits,
      listPendingOutfits,
      rejectOutfit,
      suggestOutfit,
    } = await import('./outfits')

    await listOutfits({ status: 'accepted', search: 'lookbook' }, 3, 12)
    await listPendingOutfits(4)
    await suggestOutfit({ occasion: 'casual', target_date: '2026-04-23' })
    await createManualOutfit({
      item_ids: ['item-1', 'item-2'],
      occasion: 'office',
      use_for_learning: true,
    })
    await acceptOutfit('outfit-1')
    await rejectOutfit('outfit-2')

    expect(apiGet).toHaveBeenNthCalledWith(1, '/outfits', {
      params: {
        page: '3',
        page_size: '12',
        status: 'accepted',
        search: 'lookbook',
      },
    })
    expect(apiGet).toHaveBeenNthCalledWith(2, '/outfits', {
      params: {
        page: '1',
        page_size: '4',
        status: 'pending',
      },
    })
    expect(apiPost).toHaveBeenNthCalledWith(1, '/outfits/suggest', {
      occasion: 'casual',
      target_date: '2026-04-23',
    })
    expect(apiPost).toHaveBeenNthCalledWith(2, '/outfits', {
      item_ids: ['item-1', 'item-2'],
      occasion: 'office',
      use_for_learning: true,
    })
    expect(apiPost).toHaveBeenNthCalledWith(3, '/outfits/outfit-1/accept')
    expect(apiPost).toHaveBeenNthCalledWith(4, '/outfits/outfit-2/reject')
  })

  it('lists pairings with source type filter', async () => {
    apiGet.mockResolvedValue({ pairings: [], total: 0, page: 1, page_size: 20, has_more: false })

    const { listPairings } = await import('./pairings')

    await listPairings(5, 10, 'shirt')

    expect(apiGet).toHaveBeenCalledWith('/pairings', {
      params: {
        page: '5',
        page_size: '10',
        source_type: 'shirt',
      },
    })
  })

  it('creates one item and then uploads additional images for the same item', async () => {
    taroGetStorageSync.mockReturnValue('access-token-1')
    taroUploadFile
      .mockResolvedValueOnce({
        statusCode: 201,
        data: JSON.stringify({ id: 'item-1' }),
      })
      .mockResolvedValueOnce({
        statusCode: 201,
        data: JSON.stringify({ id: 'image-2' }),
      })
      .mockResolvedValueOnce({
        statusCode: 201,
        data: JSON.stringify({ id: 'image-3' }),
      })

    const { createItemWithImages } = await import('./items')

    await createItemWithImages(['cover.jpg', 'detail-1.jpg', 'detail-2.jpg'], {
      type: 'coat',
      name: 'Navy Coat',
      quantity: 2,
    })

    expect(taroUploadFile).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        url: 'https://api.example.com/api/v1/items',
        filePath: 'cover.jpg',
        name: 'image',
        formData: {
          type: 'coat',
          name: 'Navy Coat',
          quantity: '2',
        },
        header: expect.objectContaining({
          Authorization: 'Bearer access-token-1',
        }),
      })
    )
    expect(taroUploadFile).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        url: 'https://api.example.com/api/v1/items/item-1/images',
        filePath: 'detail-1.jpg',
        name: 'image',
      })
    )
    expect(taroUploadFile).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({
        url: 'https://api.example.com/api/v1/items/item-1/images',
        filePath: 'detail-2.jpg',
        name: 'image',
      })
    )
  })
})
