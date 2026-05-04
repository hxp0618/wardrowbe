// @vitest-environment jsdom

import React from 'react'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { Item } from '../services/types'

const mocks = vi.hoisted(() => ({
  addItemsToFolderMutateAsync: vi.fn(),
  archiveMutateAsync: vi.fn(),
  deleteMutateAsync: vi.fn(),
  favoriteMutateAsync: vi.fn(),
  folders: [] as Array<{
    id: string
    name: string
    icon?: string | null
    color?: string | null
    item_count: number
    position: number
    user_id: string
    created_at: string
    updated_at: string
  }>,
  generatePairingsMutateAsync: vi.fn(),
  logWashMutateAsync: vi.fn(),
  logWearMutateAsync: vi.fn(),
  needsWashMutateAsync: vi.fn(),
  pending: {
    addFolder: false,
    archive: false,
    delete: false,
    favorite: false,
    generatePairings: false,
    logWash: false,
    logWear: false,
    needsWash: false,
    reanalyze: false,
    removeFolder: false,
    unarchive: false,
  },
  previewImage: vi.fn(),
  reanalyzeMutateAsync: vi.fn(),
  removeItemsFromFolderMutateAsync: vi.fn(),
  hideTabBar: vi.fn(() => Promise.resolve()),
  showTabBar: vi.fn(() => Promise.resolve()),
  showToast: vi.fn(),
  unarchiveMutateAsync: vi.fn(),
}))

vi.mock('@tarojs/components', () => ({
  Image: ({
    ariaLabel,
    onClick,
    src,
    style,
  }: {
    ariaLabel?: string
    onClick?: React.MouseEventHandler<HTMLImageElement>
    src?: string
    style?: React.CSSProperties
  }) => <img alt={ariaLabel ?? ''} aria-label={ariaLabel} data-height={style?.height} onClick={onClick} src={src} />,
  Picker: ({ children, range }: { children?: React.ReactNode; range?: string[] }) => (
    <div>
      {children}
      {range?.map((option) => <span key={option}>{option}</span>)}
    </div>
  ),
  ScrollView: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid='native-scroll-view'>{children}</div>
  ),
  Text: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
  View: ({
    ariaLabel,
    ariaRole,
    catchMove,
    children,
    onClick,
    style,
  }: {
    ariaLabel?: string
    ariaRole?: string
    catchMove?: boolean
    children?: React.ReactNode
    onClick?: () => void
    style?: React.CSSProperties
  }) => <div aria-label={ariaLabel} data-catch-move={catchMove == null ? undefined : String(catchMove)} role={ariaRole} onClick={onClick} style={style}>{children}</div>,
}))

vi.mock('@tarojs/taro', () => ({
  default: {
    hideTabBar: mocks.hideTabBar,
    previewImage: mocks.previewImage,
    showTabBar: mocks.showTabBar,
    showToast: mocks.showToast,
  },
}))

vi.mock('../hooks/use-items', () => ({
  useArchiveItem: () => ({ isPending: mocks.pending.archive, mutateAsync: mocks.archiveMutateAsync }),
  useDeleteItem: () => ({ isPending: mocks.pending.delete, mutateAsync: mocks.deleteMutateAsync }),
  useLogWash: () => ({ isPending: mocks.pending.logWash, mutateAsync: mocks.logWashMutateAsync }),
  useLogWear: () => ({ isPending: mocks.pending.logWear, mutateAsync: mocks.logWearMutateAsync }),
  useReanalyzeItem: () => ({ isPending: mocks.pending.reanalyze, mutateAsync: mocks.reanalyzeMutateAsync }),
  useToggleFavorite: () => ({ isPending: mocks.pending.favorite, mutateAsync: mocks.favoriteMutateAsync }),
  useToggleNeedsWash: () => ({ isPending: mocks.pending.needsWash, mutateAsync: mocks.needsWashMutateAsync }),
  useUnarchiveItem: () => ({ isPending: mocks.pending.unarchive, mutateAsync: mocks.unarchiveMutateAsync }),
}))

vi.mock('../hooks/use-folders', () => ({
  useAddItemsToFolder: () => ({ isPending: mocks.pending.addFolder, mutateAsync: mocks.addItemsToFolderMutateAsync }),
  useFolders: () => ({ data: mocks.folders }),
  useRemoveItemsFromFolder: () => ({ isPending: mocks.pending.removeFolder, mutateAsync: mocks.removeItemsFromFolderMutateAsync }),
}))

vi.mock('../hooks/use-pairings', () => ({
  useGeneratePairings: () => ({
    isPending: mocks.pending.generatePairings,
    mutateAsync: mocks.generatePairingsMutateAsync,
  }),
}))

function makeItem(overrides: Partial<Item> = {}): Item {
  return {
    id: 'item-1',
    type: 'shirt',
    subtype: '短袖衬衫',
    name: 'Shirt',
    brand: null,
    image_path: '/shirt.jpg',
    thumbnail_path: null,
    medium_path: null,
    image_url: 'http://example.test/shirt.jpg',
    thumbnail_url: null,
    medium_url: null,
    additional_images: [],
    tags: {
      style: ['casual'],
      season: ['春季'],
      material: '棉',
      pattern: '格纹',
    },
    colors: [],
    primary_color: null,
    status: 'ready',
    ai_confidence: null,
    ai_description: '棕色短袖衬衫',
    wear_count: 0,
    last_worn_at: null,
    name_source: 'manual',
    favorite: false,
    is_archived: false,
    archived_at: null,
    archive_reason: null,
    notes: null,
    quantity: 1,
    needs_wash: false,
    wears_since_wash: 0,
    last_washed_at: null,
    wash_interval: null,
    folders: [],
    created_at: '2026-05-01T00:00:00Z',
    updated_at: '2026-05-01T00:00:00Z',
    ...overrides,
  } as Item
}

describe('ItemDetailSheet', () => {
  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    vi.clearAllMocks()
    mocks.folders = []
    mocks.pending = {
      addFolder: false,
      archive: false,
      delete: false,
      favorite: false,
      generatePairings: false,
      logWash: false,
      logWear: false,
      needsWash: false,
      reanalyze: false,
      removeFolder: false,
      unarchive: false,
    }
  })

  it('renders the updated favorite state returned by the mutation', async () => {
    mocks.favoriteMutateAsync
      .mockResolvedValueOnce(makeItem({ favorite: true }))
      .mockResolvedValueOnce(makeItem({ favorite: false }))

    const { ItemDetailSheet } = await import('./item-detail-sheet')

    render(
      <ItemDetailSheet
        item={makeItem({ favorite: false })}
        visible
        onClose={vi.fn()}
      />
    )

    fireEvent.click(screen.getByText('收藏'))

    await waitFor(() => {
      expect(screen.getByText('已收藏')).toBeTruthy()
    })

    fireEvent.click(screen.getByText('已收藏'))

    await waitFor(() => {
      expect(mocks.favoriteMutateAsync).toHaveBeenLastCalledWith({
        id: 'item-1',
        favorite: false,
      })
    })
    expect(screen.getByText('收藏')).toBeTruthy()
  })

  it('renders localized wear occasion picker options', async () => {
    const { ItemDetailSheet } = await import('./item-detail-sheet')

    render(
      <ItemDetailSheet
        item={makeItem()}
        visible
        onClose={vi.fn()}
      />
    )

    fireEvent.click(screen.getByText('记录穿着'))

    expect(screen.getAllByText('休闲').length).toBeGreaterThan(0)
    expect(screen.queryByText('casual')).toBeNull()
  })

  it('generates pairings from the current ready item', async () => {
    mocks.generatePairingsMutateAsync.mockResolvedValue({ generated: 2, pairings: [] })
    const { ItemDetailSheet } = await import('./item-detail-sheet')

    render(
      <ItemDetailSheet
        item={makeItem({ status: 'ready' })}
        visible
        onClose={vi.fn()}
      />
    )

    fireEvent.click(screen.getByText('生成搭配'))

    await waitFor(() => {
      expect(mocks.generatePairingsMutateAsync).toHaveBeenCalledWith({
        itemId: 'item-1',
        num_pairings: 5,
      })
    })
    expect(mocks.showToast).toHaveBeenCalledWith({
      title: '已生成 2 套搭配',
      icon: 'success',
    })
  })

  it('requires confirmation before archiving an item', async () => {
    mocks.archiveMutateAsync.mockResolvedValue(makeItem({ is_archived: true, status: 'archived' }))
    const { ItemDetailSheet } = await import('./item-detail-sheet')

    render(
      <ItemDetailSheet
        item={makeItem({ is_archived: false, status: 'ready' })}
        visible
        onClose={vi.fn()}
      />
    )

    fireEvent.click(screen.getByText('归档'))

    expect(mocks.archiveMutateAsync).not.toHaveBeenCalled()
    expect(screen.getByText('确认归档')).toBeTruthy()

    fireEvent.click(screen.getByText('确认归档'))

    await waitFor(() => {
      expect(mocks.archiveMutateAsync).toHaveBeenCalledWith({ id: 'item-1' })
    })
  })

  it('previews original item images from the detail carousel', async () => {
    const { ItemDetailSheet } = await import('./item-detail-sheet')

    const { container } = render(
      <ItemDetailSheet
        item={makeItem({
          image_url: 'https://cdn.test/item-full.jpg',
          medium_url: 'https://cdn.test/item-medium.jpg',
          thumbnail_url: 'https://cdn.test/item-thumb.jpg',
          additional_images: [
            {
              id: 'image-2',
              item_id: 'item-1',
              image_path: '/item-side.jpg',
              thumbnail_path: '/item-side-thumb.jpg',
              medium_path: '/item-side-medium.jpg',
              position: 1,
              created_at: '2026-05-01T00:00:00Z',
              image_url: 'https://cdn.test/item-side-full.jpg',
              thumbnail_url: 'https://cdn.test/item-side-thumb.jpg',
              medium_url: 'https://cdn.test/item-side-medium.jpg',
            },
          ],
        })}
        visible
        onClose={vi.fn()}
      />
    )

    const image = container.querySelector('img')
    const imageSurface = container.querySelector('[aria-label="查看 Shirt 第 1 张大图"]') as HTMLElement | null
    expect(image).toBeNull()
    expect(imageSurface).not.toBeNull()
    expect(imageSurface?.tagName).toBe('DIV')
    expect(imageSurface?.style.height).toBe('220px')
    expect(imageSurface?.style.backgroundImage).toContain('https://cdn.test/item-medium.jpg')

    fireEvent.click(imageSurface!)

    expect(mocks.previewImage).toHaveBeenCalledWith({
      current: 'https://cdn.test/item-full.jpg',
      urls: ['https://cdn.test/item-full.jpg', 'https://cdn.test/item-side-full.jpg'],
    })
  })

  it('uses plain view scrolling instead of scroll-view in the detail sheet', async () => {
    const { ItemDetailSheet } = await import('./item-detail-sheet')

    const { container } = render(
      <ItemDetailSheet
        item={makeItem({
          additional_images: [
            {
              id: 'image-2',
              item_id: 'item-1',
              image_path: '/item-side.jpg',
              thumbnail_path: '/item-side-thumb.jpg',
              medium_path: '/item-side-medium.jpg',
              position: 1,
              created_at: '2026-05-01T00:00:00Z',
              image_url: 'https://cdn.test/item-side-full.jpg',
              thumbnail_url: 'https://cdn.test/item-side-thumb.jpg',
              medium_url: 'https://cdn.test/item-side-medium.jpg',
            },
          ],
        })}
        visible
        onClose={vi.fn()}
      />
    )

    expect(screen.queryByTestId('native-scroll-view')).toBeNull()
    expect(container.firstElementChild?.getAttribute('data-catch-move')).toBe('true')
    const backdrop = Array.from(container.querySelectorAll('div')).find((element) => element.style.backgroundColor === 'rgba(0, 0, 0, 0.5)')
    expect(backdrop?.dataset.catchMove).toBe('true')
    const sheetPanel = Array.from(container.querySelectorAll('div')).find((element) => element.style.maxHeight === '82vh')
    expect(sheetPanel?.dataset.catchMove).toBe('true')
    const scrollBody = Array.from(container.querySelectorAll('div')).find((element) => element.style.overflowY === 'auto')
    expect(scrollBody?.dataset.catchMove).toBe('true')
    expect(scrollBody?.style.overscrollBehavior).toBe('contain')
  })

  it('adds and removes the current item from folders', async () => {
    mocks.folders = [
      {
        id: 'folder-1',
        name: 'Office',
        icon: null,
        color: null,
        item_count: 0,
        position: 0,
        user_id: 'user-1',
        created_at: '2026-05-01T00:00:00Z',
        updated_at: '2026-05-01T00:00:00Z',
      },
    ]
    mocks.addItemsToFolderMutateAsync.mockResolvedValue(mocks.folders[0])
    mocks.removeItemsFromFolderMutateAsync.mockResolvedValue(mocks.folders[0])
    const { ItemDetailSheet } = await import('./item-detail-sheet')

    render(
      <ItemDetailSheet
        item={makeItem()}
        visible
        onClose={vi.fn()}
      />
    )

    const addToFolderButton = screen.getByLabelText('加入文件夹 Office')
    expect(addToFolderButton.style.minHeight).toBe('44px')

    fireEvent.click(screen.getByText('+ Office'))

    await waitFor(() => {
      expect(mocks.addItemsToFolderMutateAsync).toHaveBeenCalledWith({
        folderId: 'folder-1',
        itemIds: ['item-1'],
      })
    })
    expect(screen.getByText('Office')).toBeTruthy()

    const removeFromFolderButton = screen.getByLabelText('移出 Office')
    expect(removeFromFolderButton.style.minHeight).toBe('44px')
    expect(removeFromFolderButton.parentElement?.style.minHeight).toBe('44px')

    fireEvent.click(screen.getByText('移出'))

    await waitFor(() => {
      expect(mocks.removeItemsFromFolderMutateAsync).toHaveBeenCalledWith({
        folderId: 'folder-1',
        itemIds: ['item-1'],
      })
    })
    expect(screen.getByText('未加入文件夹')).toBeTruthy()
  })

  it('keeps folder management as a flat compact section', async () => {
    mocks.folders = [
      {
        id: 'folder-2',
        name: 'Travel',
        icon: null,
        color: null,
        item_count: 0,
        position: 0,
        user_id: 'user-1',
        created_at: '2026-05-01T00:00:00Z',
        updated_at: '2026-05-01T00:00:00Z',
      },
    ]
    const { ItemDetailSheet } = await import('./item-detail-sheet')

    render(
      <ItemDetailSheet
        item={makeItem()}
        visible
        onClose={vi.fn()}
      />
    )

    const folderSectionStyle = screen.getByText('文件夹').closest('div')?.getAttribute('style') ?? ''

    expect(folderSectionStyle).toContain('border-top')
    expect(folderSectionStyle).not.toContain('background-color')
    expect(folderSectionStyle).not.toContain('border-radius')
  })

  it('does not open or submit item actions while the matching mutation is pending', async () => {
    mocks.pending = {
      addFolder: true,
      archive: true,
      delete: true,
      favorite: true,
      generatePairings: true,
      logWash: true,
      logWear: true,
      needsWash: true,
      reanalyze: true,
      removeFolder: false,
      unarchive: false,
    }
    mocks.folders = [
      {
        id: 'folder-1',
        name: 'Office',
        icon: null,
        color: null,
        item_count: 0,
        position: 0,
        user_id: 'user-1',
        created_at: '2026-05-01T00:00:00Z',
        updated_at: '2026-05-01T00:00:00Z',
      },
    ]

    const { ItemDetailSheet } = await import('./item-detail-sheet')

    render(
      <ItemDetailSheet
        item={makeItem({ status: 'ready' })}
        visible
        onClose={vi.fn()}
      />
    )

    const favoriteButton = screen.getByRole('button', { name: '收藏' })
    const cleanButton = screen.getByRole('button', { name: '已干净' })
    const wearButton = screen.getByRole('button', { name: '记录穿着' })
    const washButton = screen.getByRole('button', { name: '记录清洗' })
    const reanalyzeButton = screen.getByRole('button', { name: '重新分析' })
    const generateButton = screen.getByRole('button', { name: '生成搭配' })
    const archiveButton = screen.getByRole('button', { name: '归档' })
    const deleteButton = screen.getByRole('button', { name: '删除' })
    const addFolderButton = screen.getByRole('button', { name: '加入文件夹 Office' })

    for (const button of [
      favoriteButton,
      cleanButton,
      wearButton,
      washButton,
      reanalyzeButton,
      generateButton,
      archiveButton,
      deleteButton,
      addFolderButton,
    ]) {
      expect(button.style.opacity).toBe('0.7')
      fireEvent.click(button)
    }

    expect(mocks.favoriteMutateAsync).not.toHaveBeenCalled()
    expect(mocks.needsWashMutateAsync).not.toHaveBeenCalled()
    expect(mocks.reanalyzeMutateAsync).not.toHaveBeenCalled()
    expect(mocks.generatePairingsMutateAsync).not.toHaveBeenCalled()
    expect(mocks.addItemsToFolderMutateAsync).not.toHaveBeenCalled()
    expect(screen.queryByText('场景')).toBeNull()
    expect(screen.queryByText('方式')).toBeNull()
    expect(screen.queryByText('确认归档')).toBeNull()
    expect(screen.queryByText('确认删除')).toBeNull()
  })

  it('renders item narrative details as flat sections instead of nested cards', async () => {
    const { ItemDetailSheet } = await import('./item-detail-sheet')

    render(
      <ItemDetailSheet
        item={makeItem({
          ai_description: 'AI 描述正文',
          notes: '用户备注正文',
        })}
        visible
        onClose={vi.fn()}
      />
    )

    const aiDescriptionStyle = screen.getByText('AI 描述').closest('div')?.getAttribute('style') ?? ''
    const notesStyle = screen.getByText('备注').closest('div')?.getAttribute('style') ?? ''

    expect(aiDescriptionStyle).toContain('border-top')
    expect(aiDescriptionStyle).not.toContain('background-color')
    expect(aiDescriptionStyle).not.toContain('border-radius')
    expect(notesStyle).toContain('border-top')
    expect(notesStyle).not.toContain('background-color')
    expect(notesStyle).not.toContain('border-radius')
  })

  it('renders item metrics as a flat row instead of nested stat cards', async () => {
    const { ItemDetailSheet } = await import('./item-detail-sheet')

    render(
      <ItemDetailSheet
        item={makeItem({ last_worn_at: '2026-05-01T00:00:00Z' })}
        visible
        onClose={vi.fn()}
      />
    )

    const wearCountMetricStyle = screen.getByText('穿着次数').closest('div')?.getAttribute('style') ?? ''

    expect(wearCountMetricStyle).toContain('border-right')
    expect(wearCountMetricStyle).not.toContain('background-color')
    expect(wearCountMetricStyle).not.toContain('border-radius')
  })

  it('renders temporary wear and wash forms as flat sheet sections', async () => {
    const { ItemDetailSheet } = await import('./item-detail-sheet')

    render(
      <ItemDetailSheet
        item={makeItem()}
        visible
        onClose={vi.fn()}
      />
    )

    fireEvent.click(screen.getByText('记录穿着'))

    const logWearFormStyle = screen.getByText('场景').closest('div')?.getAttribute('style') ?? ''

    expect(logWearFormStyle).toContain('border-top')
    expect(logWearFormStyle).not.toContain('background-color')
    expect(logWearFormStyle).not.toContain('border-radius')

    fireEvent.click(screen.getByText('取消'))
    fireEvent.click(screen.getByText('记录清洗'))

    const logWashFormStyle = screen.getByText('方式').closest('div')?.getAttribute('style') ?? ''

    expect(logWashFormStyle).toContain('border-top')
    expect(logWashFormStyle).not.toContain('background-color')
    expect(logWashFormStyle).not.toContain('border-radius')
  })
})
