import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  addItemsToFolder,
  createFolder,
  deleteFolder,
  listFolders,
  removeItemsFromFolder,
  updateFolder,
} from '../services/folders'

import type { Folder, FolderMutationPayload } from '../services/folders'

import { useAuthQueryEnabled } from './auth-query'

const foldersQueryKey = ['miniapp', 'folders'] as const

export function useFolders() {
  const authQueryEnabled = useAuthQueryEnabled()

  return useQuery({
    queryKey: foldersQueryKey,
    queryFn: listFolders,
    enabled: authQueryEnabled,
  })
}

function invalidateFolders(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: foldersQueryKey })
  void queryClient.invalidateQueries({ queryKey: ['miniapp', 'items'] })
}

function upsertFolder(queryClient: ReturnType<typeof useQueryClient>, folder: Folder) {
  queryClient.setQueryData<Folder[]>(foldersQueryKey, (current) => {
    if (!current) return current
    if (current.some((cachedFolder) => cachedFolder.id === folder.id)) {
      return current.map((cachedFolder) =>
        cachedFolder.id === folder.id ? folder : cachedFolder
      )
    }
    return [...current, folder]
  })
}

function removeFolder(queryClient: ReturnType<typeof useQueryClient>, folderId: string) {
  queryClient.setQueryData<Folder[]>(foldersQueryKey, (current) =>
    current?.filter((folder) => folder.id !== folderId)
  )
}

export function useCreateFolder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: FolderMutationPayload) => createFolder(payload),
    onSuccess: (folder) => {
      upsertFolder(queryClient, folder)
      invalidateFolders(queryClient)
    },
  })
}

export function useUpdateFolder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<FolderMutationPayload> }) =>
      updateFolder(id, payload),
    onSuccess: (folder) => {
      upsertFolder(queryClient, folder)
      invalidateFolders(queryClient)
    },
  })
}

export function useDeleteFolder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteFolder,
    onSuccess: (_result, folderId) => {
      removeFolder(queryClient, folderId)
      invalidateFolders(queryClient)
    },
  })
}

export function useAddItemsToFolder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ folderId, itemIds }: { folderId: string; itemIds: string[] }) =>
      addItemsToFolder(folderId, itemIds),
    onSuccess: (folder) => {
      upsertFolder(queryClient, folder)
      invalidateFolders(queryClient)
    },
  })
}

export function useRemoveItemsFromFolder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ folderId, itemIds }: { folderId: string; itemIds: string[] }) =>
      removeItemsFromFolder(folderId, itemIds),
    onSuccess: (folder) => {
      upsertFolder(queryClient, folder)
      invalidateFolders(queryClient)
    },
  })
}
