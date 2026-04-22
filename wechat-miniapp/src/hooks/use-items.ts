import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { createItemWithImages, listItems, listItemTypes } from '../services/items'

import type { CreateItemInput, ItemFilter } from '../services/types'

export function useItems(filters: ItemFilter = {}, page = 1, pageSize = 20) {
  return useQuery({
    queryKey: ['miniapp', 'items', filters, page, pageSize],
    queryFn: () => listItems(filters, page, pageSize),
  })
}

export function useItemTypes() {
  return useQuery({
    queryKey: ['miniapp', 'item-types'],
    queryFn: listItemTypes,
  })
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
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['miniapp', 'items'] })
      void queryClient.invalidateQueries({ queryKey: ['miniapp', 'item-types'] })
    },
  })
}
