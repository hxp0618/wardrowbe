import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Folder } from '../services/folders'

type MutationOptions<TData, TVariables> = {
  mutationFn: (variables: TVariables) => Promise<TData>
  onSuccess?: (data: TData, variables: TVariables) => void
}

const useMutation = vi.fn((options) => options)
const useQuery = vi.fn((options) => options)
const invalidateQueries = vi.fn()
const setQueryData = vi.fn()

vi.mock('@tanstack/react-query', () => ({
  useMutation,
  useQuery,
  useQueryClient: () => ({
    invalidateQueries,
    setQueryData,
  }),
}))

vi.mock('../services/folders', () => ({
  addItemsToFolder: vi.fn(),
  createFolder: vi.fn(),
  deleteFolder: vi.fn(),
  listFolders: vi.fn(),
  removeItemsFromFolder: vi.fn(),
  updateFolder: vi.fn(),
}))

vi.mock('./auth-query', () => ({
  useAuthQueryEnabled: vi.fn(() => true),
}))

const folder: Folder = {
  id: 'folder-1',
  user_id: 'user-1',
  name: 'Workwear',
  icon: null,
  color: null,
  position: 0,
  item_count: 2,
  created_at: '2026-05-01T00:00:00Z',
  updated_at: '2026-05-01T00:00:00Z',
}

describe('folder hooks', () => {
  beforeEach(() => {
    useMutation.mockClear()
    useQuery.mockClear()
    invalidateQueries.mockClear()
    setQueryData.mockClear()
  })

  it('updates the cached folder list immediately after edits', async () => {
    const updatedFolder = { ...folder, name: 'Office' }
    const { useUpdateFolder } = await import('./use-folders')

    const mutation = useUpdateFolder() as MutationOptions<
      Folder,
      { id: string; payload: { name: string } }
    >
    mutation.onSuccess?.(updatedFolder, { id: folder.id, payload: { name: 'Office' } })

    expect(setQueryData).toHaveBeenCalledWith(['miniapp', 'folders'], expect.any(Function))
    const updateCachedFolders = setQueryData.mock.calls[0][1] as (
      current: Folder[] | undefined
    ) => Folder[] | undefined

    expect(updateCachedFolders([folder])).toEqual([updatedFolder])
    expect(updateCachedFolders(undefined)).toBeUndefined()
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['miniapp', 'folders'] })
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['miniapp', 'items'] })
  })

  it('removes deleted folders from the cached folder list immediately', async () => {
    const { useDeleteFolder } = await import('./use-folders')

    const mutation = useDeleteFolder() as MutationOptions<void, string>
    mutation.onSuccess?.(undefined, folder.id)

    expect(setQueryData).toHaveBeenCalledWith(['miniapp', 'folders'], expect.any(Function))
    const updateCachedFolders = setQueryData.mock.calls[0][1] as (
      current: Folder[] | undefined
    ) => Folder[] | undefined

    expect(updateCachedFolders([folder, { ...folder, id: 'folder-2' }])).toEqual([
      { ...folder, id: 'folder-2' },
    ])
    expect(updateCachedFolders(undefined)).toBeUndefined()
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['miniapp', 'folders'] })
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['miniapp', 'items'] })
  })

  it('adds newly created folders to the cached folder list immediately', async () => {
    const { useCreateFolder } = await import('./use-folders')

    const mutation = useCreateFolder() as MutationOptions<Folder, { name: string }>
    mutation.onSuccess?.(folder, { name: folder.name })

    const updateCachedFolders = setQueryData.mock.calls[0][1] as (
      current: Folder[] | undefined
    ) => Folder[] | undefined

    expect(updateCachedFolders([])).toEqual([folder])
  })
})
