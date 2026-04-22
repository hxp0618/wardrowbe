import type { Item, Outfit, Pairing, Preferences } from '@wardrowbe/shared-domain'

export type { Item, Outfit, Pairing, Preferences }

export interface ItemListResponse {
  items: Item[]
  total: number
  page: number
  page_size: number
  has_more: boolean
}

export interface ItemFilter {
  type?: string
  search?: string
  favorite?: boolean
  needs_wash?: boolean
  is_archived?: boolean
  sort_by?: string
  sort_order?: 'asc' | 'desc'
  folder_id?: string
}

export interface ItemTypeCount {
  type: string
  count: number
}

export interface CreateItemInput {
  type?: string
  subtype?: string
  name?: string
  brand?: string
  notes?: string
  favorite?: boolean
  quantity?: number
}

export interface OutfitListResponse {
  outfits: Outfit[]
  total: number
  page: number
  page_size: number
  has_more: boolean
}

export interface OutfitFilters {
  status?: string
  search?: string
  source?: string
  is_lookbook?: boolean
  is_replacement?: boolean
  has_source_item?: boolean
  date_from?: string
  date_to?: string
}

export interface SuggestRequest {
  occasion: string
  weather_override?: {
    temperature: number
    feels_like?: number
    humidity: number
    precipitation_chance: number
    condition: string
  }
  target_date?: string
}

export interface ManualOutfitRequest {
  item_ids: string[]
  occasion: string
  scheduled_for?: string
  name?: string
  notes?: string
  use_for_learning?: boolean
}

export interface PairingListResponse {
  pairings: Pairing[]
  total: number
  page: number
  page_size: number
  has_more: boolean
}

export interface Weather {
  temperature: number
  feels_like: number
  humidity: number
  precipitation_chance: number
  precipitation_mm: number
  wind_speed: number
  condition: string
  condition_code: number
  is_day: boolean
  uv_index: number
  timestamp: string
}

export interface ForecastDay {
  date: string
  temp_min: number
  temp_max: number
  precipitation_chance: number
  condition: string
  condition_code: number
}

export interface ForecastResponse {
  latitude: number
  longitude: number
  forecast: ForecastDay[]
}
