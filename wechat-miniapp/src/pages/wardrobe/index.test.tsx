// @vitest-environment jsdom

import React from 'react'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  createFolderMutateAsync: vi.fn(),
  createItem: vi.fn(),
  deleteFolderMutateAsync: vi.fn(),
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
  itemTypes: [] as Array<{ type: string; count: number }>,
  updateFolderMutateAsync: vi.fn(),
  useItems: vi.fn(),
}))

const messages: Record<string, string> = {
  page_wardrobe_title: '衣橱',
  wardrobe_add_action: '添加单品',
  wardrobe_add_first_item: '添加第一件单品',
  wardrobe_all_folders: '全部文件夹',
  wardrobe_all_types: '全部类型',
  wardrobe_empty_description: '拍照上传你的第一件单品，开始智能穿搭之旅。',
  wardrobe_empty_title: '衣橱还是空的',
  wardrobe_filter_archived: '已归档',
  wardrobe_filter_favorite: '收藏',
  wardrobe_filter_needs_wash: '需清洗',
  wardrobe_filter_sort_title: '筛选与排序',
  wardrobe_folder_cancel: '取消',
  wardrobe_folder_confirm_delete: '确认删除',
  wardrobe_folder_create: '新建文件夹',
  wardrobe_folder_create_failed: '创建文件夹失败',
  wardrobe_folder_created: '文件夹已创建',
  wardrobe_folder_delete: '删除',
  wardrobe_folder_delete_failed: '删除文件夹失败',
  wardrobe_folder_deleted: '文件夹已删除',
  wardrobe_folder_edit: '编辑',
  wardrobe_folder_empty: '还没有文件夹',
  wardrobe_folder_manage: '管理文件夹',
  wardrobe_folder_name_placeholder: '新文件夹名称',
  wardrobe_folder_save: '保存',
  wardrobe_folder_title: '文件夹管理',
  wardrobe_folder_update_failed: '更新文件夹失败',
  wardrobe_folder_updated: '文件夹已更新',
  wardrobe_filtered_empty_description: '调整筛选条件或清除筛选后再试。',
  wardrobe_filtered_empty_title: '没有符合条件的单品',
  wardrobe_loading: '正在加载衣橱...',
  wardrobe_loading_title: '加载中',
  wardrobe_sort_created_asc: '最早添加',
  wardrobe_sort_created_desc: '最新添加',
  wardrobe_sort_last_worn: '最近穿着',
  wardrobe_sort_name_asc: '名称 A-Z',
  wardrobe_sort_wear_count_asc: '最少穿着',
  wardrobe_sort_wear_count_desc: '最多穿着',
}

vi.mock('@tarojs/components', () => ({
  Input: ({
    onInput,
    placeholder,
    style,
    value,
  }: {
    onInput?: (event: { detail: { value: string } }) => void
    placeholder?: string
    style?: React.CSSProperties
    value?: string
  }) => (
    <input
      placeholder={placeholder}
      style={style}
      value={value}
      onChange={(event) => onInput?.({ detail: { value: event.currentTarget.value } })}
    />
  ),
  Picker: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  Text: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
  View: ({
    ariaLabel,
    ariaRole,
    children,
    onClick,
    style,
  }: {
    ariaLabel?: string
    ariaRole?: string
    children?: React.ReactNode
    onClick?: () => void
    style?: React.CSSProperties
  }) => <div aria-label={ariaLabel} role={ariaRole} onClick={onClick} style={style}>{children}</div>,
}))

vi.mock('@tarojs/taro', () => ({
  default: {
    chooseImage: vi.fn(),
    showToast: vi.fn(),
  },
}))

vi.mock('../../components/empty-state', () => ({
  EmptyState: ({
    action,
    description,
    title,
  }: {
    action?: React.ReactNode
    description: string
    title: string
  }) => (
    <div>
      <h2>{title}</h2>
      <p>{description}</p>
      {action}
    </div>
  ),
}))

vi.mock('../../components/item-card', () => ({
  ItemCard: () => <article>item-card</article>,
}))

vi.mock('../../components/item-detail-sheet', () => ({
  ItemDetailSheet: () => null,
}))

vi.mock('../../components/page-shell', () => ({
  PageShell: ({
    actions,
    children,
    subtitle,
    title,
  }: {
    actions?: React.ReactNode
    children?: React.ReactNode
    subtitle?: string
    title: string
  }) => (
    <main>
      <h1>{title}</h1>
      <p>{subtitle}</p>
      <div>{actions}</div>
      {children}
    </main>
  ),
}))

vi.mock('../../components/section-card', () => ({
  SectionCard: ({ children, title }: { children?: React.ReactNode; title: string }) => (
    <section>
      <h2>{title}</h2>
      {children}
    </section>
  ),
}))

vi.mock('../../components/ui-theme', () => ({
  colors: {
    accentText: '#fff',
    text: '#111',
    textMuted: '#666',
  },
  inputStyle: {},
  primaryButtonStyle: {},
  secondaryButtonStyle: {},
  toneSurfaceStyle: (tone: string) => ({
    backgroundColor: tone,
    border: tone,
  }),
}))

vi.mock('../../hooks/use-auth-guard', () => ({
  useAuthGuard: () => true,
}))

vi.mock('../../hooks/use-folders', () => ({
  useCreateFolder: () => ({ mutateAsync: mocks.createFolderMutateAsync }),
  useDeleteFolder: () => ({ mutateAsync: mocks.deleteFolderMutateAsync }),
  useFolders: () => ({ data: mocks.folders }),
  useUpdateFolder: () => ({ mutateAsync: mocks.updateFolderMutateAsync }),
}))

vi.mock('../../hooks/use-items', () => ({
  useCreateItemWithImages: () => ({ mutateAsync: mocks.createItem }),
  useItems: mocks.useItems,
  useItemTypes: () => ({ data: mocks.itemTypes }),
}))

vi.mock('../../lib/i18n', () => ({
  useI18n: () => ({
    t: (key: string) => messages[key] ?? key,
    tf: (key: string, values?: Record<string, string | number>) =>
      key === 'wardrobe_subtitle' ? `共 ${values?.count ?? 0} 件单品` : messages[key] ?? key,
  }),
}))

describe('WardrobePage', () => {
  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    vi.clearAllMocks()
    mocks.folders = []
    mocks.itemTypes = []
    mocks.useItems.mockReturnValue({
      data: {
        has_more: false,
        items: [],
        page: 1,
        page_size: 20,
        total: 0,
      },
      isLoading: false,
    })
  })

  it('shows a filtered empty state after filters produce no matches', async () => {
    const { default: WardrobePage } = await import('./index')

    render(<WardrobePage />)

    fireEvent.click(screen.getByText('收藏'))

    expect(screen.getByText('没有符合条件的单品')).toBeTruthy()
    expect(screen.queryByText('衣橱还是空的')).toBeNull()
    expect(screen.queryByText('添加第一件单品')).toBeNull()
  })

  it('filters by folder from compact folder chips', async () => {
    mocks.folders = [
      {
        id: 'folder-1',
        name: 'Workwear',
        icon: null,
        color: null,
        item_count: 2,
        position: 0,
        user_id: 'user-1',
        created_at: '2026-05-01T00:00:00Z',
        updated_at: '2026-05-01T00:00:00Z',
      },
    ]
    const { default: WardrobePage } = await import('./index')

    render(<WardrobePage />)

    fireEvent.click(screen.getByText('Workwear'))

    expect(mocks.useItems).toHaveBeenLastCalledWith(
      expect.objectContaining({ folder_id: 'folder-1' }),
      1,
      20
    )
  })

  it('filters and sorts from compact option chips', async () => {
    mocks.itemTypes = [{ type: 'coat', count: 2 }]
    const { default: WardrobePage } = await import('./index')

    render(<WardrobePage />)

    fireEvent.click(screen.getByText('大衣'))
    expect(mocks.useItems).toHaveBeenLastCalledWith(
      expect.objectContaining({ type: 'coat' }),
      1,
      20
    )

    fireEvent.click(screen.getByText('最近穿着'))
    expect(mocks.useItems).toHaveBeenLastCalledWith(
      expect.objectContaining({ sort_by: 'last_worn', sort_order: 'desc', type: 'coat' }),
      1,
      20
    )
  })

  it('labels wardrobe item cards as direct detail actions', async () => {
    mocks.useItems.mockReturnValue({
      data: {
        has_more: false,
        items: [
          {
            id: 'item-1',
            name: '蓝色衬衫',
            type: 'shirt',
          },
        ],
        page: 1,
        page_size: 20,
        total: 1,
      },
      isLoading: false,
    })
    const { default: WardrobePage } = await import('./index')

    render(<WardrobePage />)

    const itemAction = screen.getByLabelText('查看蓝色衬衫详情')
    expect(itemAction.getAttribute('role')).toBe('button')
  })

  it('creates, edits, and confirms deleting folders from wardrobe management', async () => {
    mocks.folders = [
      {
        id: 'folder-1',
        name: 'Workwear',
        icon: null,
        color: null,
        item_count: 2,
        position: 0,
        user_id: 'user-1',
        created_at: '2026-05-01T00:00:00Z',
        updated_at: '2026-05-01T00:00:00Z',
      },
    ]
    mocks.createFolderMutateAsync.mockResolvedValue(mocks.folders[0])
    mocks.updateFolderMutateAsync.mockResolvedValue({ ...mocks.folders[0], name: 'Office' })
    mocks.deleteFolderMutateAsync.mockResolvedValue(undefined)
    const { default: WardrobePage } = await import('./index')

    render(<WardrobePage />)

    fireEvent.click(screen.getByText('管理文件夹'))
    expect(screen.getByPlaceholderText('新文件夹名称').style.minHeight).toBe('44px')
    fireEvent.change(screen.getByPlaceholderText('新文件夹名称'), {
      target: { value: 'Travel' },
    })
    fireEvent.click(screen.getByText('新建文件夹'))

    expect(mocks.createFolderMutateAsync).toHaveBeenCalledWith({ name: 'Travel' })

    fireEvent.click(screen.getByText('编辑'))
    const editInput = screen.getByDisplayValue('Workwear')
    expect(editInput.style.height).toBe('44px')
    expect(editInput.style.minHeight).toBe('44px')

    fireEvent.change(editInput, {
      target: { value: 'Office' },
    })
    fireEvent.click(screen.getByText('保存'))

    await waitFor(() => {
      expect(mocks.updateFolderMutateAsync).toHaveBeenCalledWith({
        id: 'folder-1',
        payload: { name: 'Office' },
      })
    })

    fireEvent.click(screen.getByText('删除'))
    fireEvent.click(screen.getByText('确认删除'))

    expect(mocks.deleteFolderMutateAsync).toHaveBeenCalledWith('folder-1')
  })

  it('shows disabled folder actions when required names are empty', async () => {
    mocks.folders = [
      {
        id: 'folder-1',
        name: 'Workwear',
        icon: null,
        color: null,
        item_count: 2,
        position: 0,
        user_id: 'user-1',
        created_at: '2026-05-01T00:00:00Z',
        updated_at: '2026-05-01T00:00:00Z',
      },
    ]
    const { default: WardrobePage } = await import('./index')

    render(<WardrobePage />)

    fireEvent.click(screen.getByText('管理文件夹'))
    const createButton = screen.getByText('新建文件夹').parentElement!
    expect(createButton.style.opacity).toBe('0.7')
    fireEvent.click(createButton)
    expect(mocks.createFolderMutateAsync).not.toHaveBeenCalled()

    fireEvent.click(screen.getByText('编辑'))
    fireEvent.change(screen.getByDisplayValue('Workwear'), {
      target: { value: '' },
    })
    const saveButton = screen.getByText('保存').parentElement!
    expect(saveButton.style.opacity).toBe('0.7')
    fireEvent.click(saveButton)
    expect(mocks.updateFolderMutateAsync).not.toHaveBeenCalled()
  })
})
