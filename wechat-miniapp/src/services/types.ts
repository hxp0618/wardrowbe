import type {
  Family,
  FamilyMember,
  FolderRef,
  Item,
  Outfit,
  Pairing,
  PendingInvite,
  Preferences,
  SourceItem,
} from '@wardrowbe/shared-domain'

export type {
  Family,
  FamilyMember,
  FolderRef,
  Item,
  Outfit,
  Pairing,
  PendingInvite,
  Preferences,
  SourceItem,
}

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

export interface UpdateItemInput {
  type?: string
  subtype?: string
  name?: string
  brand?: string
  notes?: string
  favorite?: boolean
  needs_wash?: boolean
  quantity?: number
  purchase_date?: string
  purchase_price?: number
  wash_interval?: number
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
  family_member_id?: string
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

export interface OutfitFeedbackRequest {
  rating?: number
  comment?: string
  actually_worn?: boolean
  comfort_rating?: number
  style_rating?: number
}

export interface PairingListResponse {
  pairings: Pairing[]
  total: number
  page: number
  page_size: number
  has_more: boolean
}

export interface GeneratePairingsRequest {
  num_pairings: number
}

export interface GeneratePairingsResponse {
  generated: number
  pairings: Pairing[]
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

export interface FamilyCreateResponse {
  id: string
  name: string
  invite_code: string
  role: string
}

export interface JoinFamilyResponse {
  family_id: string
  family_name: string
  role: string
}

export type NotificationChannelType =
  | 'ntfy'
  | 'mattermost'
  | 'email'
  | 'bark'
  | 'expo_push'
  | 'webhook'

export interface NotificationSettings {
  id: string
  user_id: string
  channel: NotificationChannelType
  enabled: boolean
  priority: number
  config: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface Schedule {
  id: string
  user_id: string
  day_of_week: number
  notification_time: string
  occasion: string
  enabled: boolean
  notify_day_before: boolean
  created_at: string
  updated_at: string
}

export interface NotificationHistory {
  id: string
  user_id: string
  outfit_id?: string
  channel: string
  status: string
  attempts: number
  sent_at?: string
  delivered_at?: string
  error_message?: string
  created_at: string
}

export interface UserProfile {
  id: string
  email: string
  display_name: string
  avatar_url?: string
  timezone: string
  location_lat?: number
  location_lon?: number
  location_name?: string
  family_id?: string
  role: string
  onboarding_completed: boolean
  body_measurements?: Record<string, number | string> | null
}

export interface UserProfileUpdate {
  display_name?: string
  timezone?: string
  location_lat?: number
  location_lon?: number
  location_name?: string
  body_measurements?: Record<string, number | string> | null
}
