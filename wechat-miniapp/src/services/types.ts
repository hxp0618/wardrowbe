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
  occasion?: string
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

export interface ColorDistribution {
  color: string
  count: number
  percentage: number
}

export interface TypeDistribution {
  type: string
  count: number
  percentage: number
}

export interface WearStats {
  id: string
  name: string | null
  type: string
  primary_color: string | null
  thumbnail_path: string | null
  thumbnail_url: string | null
  wear_count: number
  last_worn_at: string | null
}

export interface AcceptanceRateTrend {
  period: string
  total: number
  accepted: number
  rejected: number
  rate: number
}

export interface WardrobeStats {
  total_items: number
  items_by_status: Record<string, number>
  total_outfits: number
  outfits_this_week: number
  outfits_this_month: number
  acceptance_rate: number | null
  average_rating: number | null
  total_wears: number
}

export interface AnalyticsData {
  wardrobe: WardrobeStats
  color_distribution: ColorDistribution[]
  type_distribution: TypeDistribution[]
  most_worn: WearStats[]
  least_worn: WearStats[]
  never_worn: WearStats[]
  acceptance_trend: AcceptanceRateTrend[]
  insights: string[]
}

export interface LearnedColorScore {
  color: string
  score: number
  interpretation: string
}

export interface LearnedStyleScore {
  style: string
  score: number
}

export interface OccasionPattern {
  occasion: string
  preferred_colors: string[]
  success_rate: number
}

export interface WeatherPreference {
  weather_type: string
  preferred_layers: number
  success_rate: number
}

export interface LearningProfile {
  has_learning_data: boolean
  feedback_count: number
  outfits_rated: number
  overall_acceptance_rate: number | null
  average_rating: number | null
  average_comfort_rating: number | null
  average_style_rating: number | null
  color_preferences: LearnedColorScore[]
  style_preferences: LearnedStyleScore[]
  occasion_patterns: OccasionPattern[]
  weather_preferences: WeatherPreference[]
  last_computed_at: string | null
}

export interface LearningItemInfo {
  id: string
  type: string
  name: string | null
  primary_color: string | null
  thumbnail_path: string | null
  thumbnail_url: string | null
}

export interface ItemPair {
  item1: LearningItemInfo
  item2: LearningItemInfo
  compatibility_score: number
  times_paired: number
  times_accepted: number
}

export interface StyleInsight {
  id: string
  category: string
  insight_type: string
  title: string
  description: string
  confidence: number
  created_at: string
}

export interface PreferenceSuggestions {
  updated: boolean
  suggestions?: {
    suggested_favorite_colors?: string[]
    suggested_avoid_colors?: string[]
  }
  confidence?: number | null
  reason?: string
}

export interface LearningInsightsData {
  profile: LearningProfile
  best_pairs: ItemPair[]
  insights: StyleInsight[]
  preference_suggestions: PreferenceSuggestions
}
