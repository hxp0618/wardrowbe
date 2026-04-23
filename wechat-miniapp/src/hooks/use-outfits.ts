import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  acceptOutfit,
  cloneOutfit,
  createManualOutfit,
  deleteOutfit,
  getOutfit,
  listCurrentWeather,
  listOutfits,
  listPendingOutfits,
  listWeatherForecast,
  rejectOutfit,
  submitOutfitFeedback,
  suggestOutfit,
} from '../services/outfits'

import type { OutfitFeedbackRequest, OutfitFilters, SuggestRequest } from '../services/types'

export function useOutfits(filters: OutfitFilters = {}, page = 1, pageSize = 20) {
  return useQuery({
    queryKey: ['miniapp', 'outfits', filters, page, pageSize],
    queryFn: () => listOutfits(filters, page, pageSize),
  })
}

export function useOutfit(id: string) {
  return useQuery({
    queryKey: ['miniapp', 'outfit', id],
    queryFn: () => getOutfit(id),
    enabled: !!id,
  })
}

export function useFamilyOutfits(memberId: string | undefined, page = 1, pageSize = 20) {
  return useQuery({
    queryKey: ['miniapp', 'family-outfits', memberId, page, pageSize],
    queryFn: () =>
      listOutfits(
        {
          family_member_id: memberId,
        },
        page,
        pageSize
      ),
    enabled: !!memberId,
  })
}

export function useCalendarOutfits(
  year: number,
  month: number,
  filters: OutfitFilters = {}
) {
  const dateFrom = `${year}-${String(month).padStart(2, '0')}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const dateTo = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

  return useQuery({
    queryKey: ['miniapp', 'calendar-outfits', year, month, filters],
    queryFn: () =>
      listOutfits(
        {
          ...filters,
          date_from: dateFrom,
          date_to: dateTo,
        },
        1,
        100
      ),
  })
}

export function usePendingOutfits(limit = 3) {
  return useQuery({
    queryKey: ['miniapp', 'pending-outfits', limit],
    queryFn: () => listPendingOutfits(limit),
  })
}

export function useWeather() {
  return useQuery({
    queryKey: ['miniapp', 'weather'],
    queryFn: listCurrentWeather,
    retry: false,
  })
}

export function useWeatherForecast(days: number, enabled = true) {
  return useQuery({
    queryKey: ['miniapp', 'weather-forecast', days],
    queryFn: () => listWeatherForecast(days),
    enabled: enabled && days > 0,
    retry: false,
  })
}

function invalidateOutfits(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: ['miniapp', 'outfits'] })
  void queryClient.invalidateQueries({ queryKey: ['miniapp', 'outfit'] })
  void queryClient.invalidateQueries({ queryKey: ['miniapp', 'pending-outfits'] })
  void queryClient.invalidateQueries({ queryKey: ['miniapp', 'calendar-outfits'] })
}

export function useSuggestOutfit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: SuggestRequest) => suggestOutfit(request),
    onSuccess: () => invalidateOutfits(queryClient),
  })
}

export function useCreateManualOutfit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createManualOutfit,
    onSuccess: () => invalidateOutfits(queryClient),
  })
}

export function useAcceptOutfit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (outfitId: string) => acceptOutfit(outfitId),
    onSuccess: () => invalidateOutfits(queryClient),
  })
}

export function useRejectOutfit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (outfitId: string) => rejectOutfit(outfitId),
    onSuccess: () => invalidateOutfits(queryClient),
  })
}

export function useDeleteOutfit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteOutfit,
    onSuccess: () => invalidateOutfits(queryClient),
  })
}

export function useSubmitOutfitFeedback() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      outfitId,
      feedback,
    }: {
      outfitId: string
      feedback: OutfitFeedbackRequest
    }) => submitOutfitFeedback(outfitId, feedback),
    onSuccess: () => invalidateOutfits(queryClient),
  })
}

export function useCloneOutfit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: cloneOutfit,
    onSuccess: () => invalidateOutfits(queryClient),
  })
}
