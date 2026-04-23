import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  archiveItem,
  createItemWithImages,
  deleteItem,
  getItem,
  getWashHistory,
  getWearHistory,
  getWearStats,
  listColorDistribution,
  listItems,
  listItemTypes,
  logWash,
  logWear,
  reanalyzeItem,
  toggleFavorite,
  toggleNeedsWash,
  unarchiveItem,
  updateItem,
} from '../services/items'

import type { CreateItemInput, ItemFilter, UpdateItemInput } from '../services/types'

export function useItems(filters: ItemFilter = {}, page = 1, pageSize = 20) {
  return useQuery({
    queryKey: ['miniapp', 'items', filters, page, pageSize],
    queryFn: () => listItems(filters, page, pageSize),
  })
}

export function useItem(id: string) {
  return useQuery({
    queryKey: ['miniapp', 'item', id],
    queryFn: () => getItem(id),
    enabled: !!id,
  })
}

export function useItemTypes() {
  return useQuery({
    queryKey: ['miniapp', 'item-types'],
    queryFn: listItemTypes,
  })
}

function invalidateItems(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: ['miniapp', 'items'] })
  void queryClient.invalidateQueries({ queryKey: ['miniapp', 'item'] })
  void queryClient.invalidateQueries({ queryKey: ['miniapp', 'item-types'] })
}

export function useCreateItemWithImages() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      filePaths,
      fields,
    }: {
      filePaths: string[]
      fields?: CreateItemInput
    }) => createItemWithImages(filePaths, fields),
    onSuccess: () => invalidateItems(queryClient),
  })
}

export function useUpdateItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateItemInput }) =>
      updateItem(id, data),
    onSuccess: () => invalidateItems(queryClient),
  })
}

export function useDeleteItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteItem,
    onSuccess: () => invalidateItems(queryClient),
  })
}

export function useToggleFavorite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, favorite }: { id: string; favorite: boolean }) =>
      toggleFavorite(id, favorite),
    onSuccess: () => invalidateItems(queryClient),
  })
}

export function useToggleNeedsWash() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, needsWash }: { id: string; needsWash: boolean }) =>
      toggleNeedsWash(id, needsWash),
    onSuccess: () => invalidateItems(queryClient),
  })
}

export function useReanalyzeItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: reanalyzeItem,
    onSuccess: () => invalidateItems(queryClient),
  })
}

export function useArchiveItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      archiveItem(id, reason),
    onSuccess: () => invalidateItems(queryClient),
  })
}

export function useUnarchiveItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: unarchiveItem,
    onSuccess: () => invalidateItems(queryClient),
  })
}

export function useLogWear() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      worn_at,
      occasion,
    }: {
      id: string
      worn_at?: string
      occasion?: string
    }) => logWear(id, worn_at, occasion),
    onSuccess: () => invalidateItems(queryClient),
  })
}

export function useLogWash() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      washed_at,
      method,
      notes,
    }: {
      id: string
      washed_at?: string
      method?: string
      notes?: string
    }) => logWash(id, washed_at, method, notes),
    onSuccess: () => invalidateItems(queryClient),
  })
}

export function useWashHistory(itemId: string) {
  return useQuery({
    queryKey: ['miniapp', 'wash-history', itemId],
    queryFn: () => getWashHistory(itemId),
    enabled: !!itemId,
  })
}

export function useWearStats(itemId: string) {
  return useQuery({
    queryKey: ['miniapp', 'wear-stats', itemId],
    queryFn: () => getWearStats(itemId),
    enabled: !!itemId,
  })
}

export function useWearHistory(itemId: string, limit = 10) {
  return useQuery({
    queryKey: ['miniapp', 'wear-history', itemId],
    queryFn: () => getWearHistory(itemId, limit),
    enabled: !!itemId,
  })
}

export function useColorDistribution() {
  return useQuery({
    queryKey: ['miniapp', 'color-distribution'],
    queryFn: listColorDistribution,
  })
}
