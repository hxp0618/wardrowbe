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
import type { WeatherCoordinates } from '../services/outfits'

import { useAuthQueryEnabled } from './auth-query'

type WeatherLocationSource = {
  location_lat?: number | null
  location_lon?: number | null
} | null | undefined

function resolveWeatherCoordinates(
  location: WeatherLocationSource
): WeatherCoordinates | null {
  const latitude = location?.location_lat
  const longitude = location?.location_lon

  if (
    typeof latitude !== 'number' ||
    typeof longitude !== 'number' ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    return null
  }

  return { latitude, longitude }
}

export function useOutfits(filters: OutfitFilters = {}, page = 1, pageSize = 20) {
  return useQuery({
    queryKey: ['miniapp', 'outfits', filters, page, pageSize],
    queryFn: () => listOutfits(filters, page, pageSize),
    enabled: useAuthQueryEnabled(),
  })
}

export function useOutfit(id: string) {
  return useQuery({
    queryKey: ['miniapp', 'outfit', id],
    queryFn: () => getOutfit(id),
    enabled: useAuthQueryEnabled(!!id),
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
    enabled: useAuthQueryEnabled(!!memberId),
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
    enabled: useAuthQueryEnabled(),
  })
}

export function usePendingOutfits(limit = 3) {
  return useQuery({
    queryKey: ['miniapp', 'pending-outfits', limit],
    queryFn: () => listPendingOutfits(limit),
    enabled: useAuthQueryEnabled(),
  })
}

export function useWeather(location?: WeatherLocationSource, enabled = true) {
  const coordinates = resolveWeatherCoordinates(location)
  const latitude = coordinates?.latitude ?? null
  const longitude = coordinates?.longitude ?? null

  return useQuery({
    queryKey: ['miniapp', 'weather', latitude, longitude],
    queryFn: () => {
      if (!coordinates) {
        throw new Error('Location coordinates are required before loading weather.')
      }

      return listCurrentWeather(coordinates)
    },
    enabled: useAuthQueryEnabled(enabled && coordinates !== null),
    retry: false,
  })
}

export function useWeatherForecast(
  days: number,
  enabled = true,
  location?: WeatherLocationSource
) {
  const coordinates = resolveWeatherCoordinates(location)
  const latitude = coordinates?.latitude ?? null
  const longitude = coordinates?.longitude ?? null

  return useQuery({
    queryKey: ['miniapp', 'weather-forecast', days, latitude, longitude],
    queryFn: () => {
      if (!coordinates) {
        throw new Error('Location coordinates are required before loading weather.')
      }

      return listWeatherForecast(days, coordinates)
    },
    enabled: useAuthQueryEnabled(enabled && days > 0 && coordinates !== null),
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
