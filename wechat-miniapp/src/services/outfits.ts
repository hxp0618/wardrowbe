import { api } from '../lib/api'

import type {
  ForecastResponse,
  ManualOutfitRequest,
  Outfit,
  OutfitFeedbackRequest,
  OutfitFilters,
  OutfitListResponse,
  SuggestRequest,
  Weather,
} from './types'

function buildOutfitParams(
  filters: OutfitFilters,
  page: number,
  pageSize: number
): Record<string, string> {
  const params: Record<string, string> = {
    page: String(page),
    page_size: String(pageSize),
  }

  if (filters.status) params.status = filters.status
  if (filters.search) params.search = filters.search
  if (filters.source) params.source = filters.source
  if (filters.is_lookbook !== undefined) params.is_lookbook = String(filters.is_lookbook)
  if (filters.is_replacement !== undefined) {
    params.is_replacement = String(filters.is_replacement)
  }
  if (filters.has_source_item !== undefined) {
    params.has_source_item = String(filters.has_source_item)
  }
  if (filters.date_from) params.date_from = filters.date_from
  if (filters.date_to) params.date_to = filters.date_to
  if (filters.family_member_id) params.family_member_id = filters.family_member_id

  return params
}

export function listOutfits(
  filters: OutfitFilters = {},
  page = 1,
  pageSize = 20
): Promise<OutfitListResponse> {
  return api.get<OutfitListResponse>('/outfits', {
    params: buildOutfitParams(filters, page, pageSize),
  })
}

export function getOutfit(id: string): Promise<Outfit> {
  return api.get<Outfit>(`/outfits/${id}`)
}

export function listPendingOutfits(limit = 3): Promise<OutfitListResponse> {
  return api.get<OutfitListResponse>('/outfits', {
    params: {
      page: '1',
      page_size: String(limit),
      status: 'pending',
    },
  })
}

export function suggestOutfit(request: SuggestRequest): Promise<Outfit> {
  return api.post<Outfit>('/outfits/suggest', request)
}

export function createManualOutfit(request: ManualOutfitRequest): Promise<Outfit> {
  return api.post<Outfit>('/outfits', request)
}

export function acceptOutfit(outfitId: string): Promise<Outfit> {
  return api.post<Outfit>(`/outfits/${outfitId}/accept`)
}

export function rejectOutfit(outfitId: string): Promise<Outfit> {
  return api.post<Outfit>(`/outfits/${outfitId}/reject`)
}

export function deleteOutfit(outfitId: string): Promise<void> {
  return api.delete<void>(`/outfits/${outfitId}`)
}

export function submitOutfitFeedback(
  outfitId: string,
  feedback: OutfitFeedbackRequest
): Promise<Outfit> {
  return api.post<Outfit>(`/outfits/${outfitId}/feedback`, feedback)
}

export function cloneOutfit(outfitId: string): Promise<Outfit> {
  return api.post<Outfit>(`/outfits/${outfitId}/clone`)
}

export function listCurrentWeather(): Promise<Weather> {
  return api.get<Weather>('/weather/current')
}

export function listWeatherForecast(days: number): Promise<ForecastResponse> {
  return api.get<ForecastResponse>('/weather/forecast', {
    params: { days: String(days) },
  })
}
