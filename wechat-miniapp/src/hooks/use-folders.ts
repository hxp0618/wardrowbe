import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  addItemsToFolder,
  createFolder,
  deleteFolder,
  listFolders,
  removeItemsFromFolder,
  updateFolder,
} from '../services/folders'

import type { FolderMutationPayload } from '../services/folders'

export function useFolders() {
  return useQuery({
    queryKey: ['miniapp', 'folders'],
    queryFn: listFolders,
  })
}

function invalidateFolders(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: ['miniapp', 'folders'] })
  void queryClient.invalidateQueries({ queryKey: ['miniapp', 'items'] })
}

export function useCreateFolder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: FolderMutationPayload) => createFolder(payload),
    onSuccess: () => invalidateFolders(queryClient),
  })
}

export function useUpdateFolder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<FolderMutationPayload> }) =>
      updateFolder(id, payload),
    onSuccess: () => invalidateFolders(queryClient),
  })
}

export function useDeleteFolder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteFolder,
    onSuccess: () => invalidateFolders(queryClient),
  })
}

export function useAddItemsToFolder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ folderId, itemIds }: { folderId: string; itemIds: string[] }) =>
      addItemsToFolder(folderId, itemIds),
    onSuccess: () => invalidateFolders(queryClient),
  })
}

export function useRemoveItemsFromFolder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ folderId, itemIds }: { folderId: string; itemIds: string[] }) =>
      removeItemsFromFolder(folderId, itemIds),
    onSuccess: () => invalidateFolders(queryClient),
  })
}
