import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  acceptOutfit,
  createManualOutfit,
  getPreferences,
  listCurrentWeather,
  listOutfits,
  listPendingOutfits,
  listWeatherForecast,
  rejectOutfit,
  suggestOutfit,
} from '../services/outfits'

import type { OutfitFilters, SuggestRequest } from '../services/types'

export function useOutfits(filters: OutfitFilters = {}, page = 1, pageSize = 20) {
  return useQuery({
    queryKey: ['miniapp', 'outfits', filters, page, pageSize],
    queryFn: () => listOutfits(filters, page, pageSize),
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

export function usePreferences() {
  return useQuery({
    queryKey: ['miniapp', 'preferences'],
    queryFn: getPreferences,
  })
}

export function useSuggestOutfit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: SuggestRequest) => suggestOutfit(request),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['miniapp', 'outfits'] })
      void queryClient.invalidateQueries({ queryKey: ['miniapp', 'pending-outfits'] })
    },
  })
}

export function useCreateManualOutfit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createManualOutfit,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['miniapp', 'outfits'] })
      void queryClient.invalidateQueries({ queryKey: ['miniapp', 'pending-outfits'] })
    },
  })
}

export function useAcceptOutfit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (outfitId: string) => acceptOutfit(outfitId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['miniapp', 'outfits'] })
      void queryClient.invalidateQueries({ queryKey: ['miniapp', 'pending-outfits'] })
    },
  })
}

export function useRejectOutfit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (outfitId: string) => rejectOutfit(outfitId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['miniapp', 'outfits'] })
      void queryClient.invalidateQueries({ queryKey: ['miniapp', 'pending-outfits'] })
    },
  })
}
