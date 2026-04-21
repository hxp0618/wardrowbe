export interface ItemTags {
  colors: string[];
  primary_color?: string;
  pattern?: string;
  material?: string;
  style: string[];
  season: string[];
  formality?: string;
  fit?: string;
  occasion?: string[];
  brand?: string;
  condition?: string;
  features?: string[];
  logprobs_confidence?: number;
}

export interface Item {
  id: string;
  user_id: string;
  type: string;
  subtype?: string;
  name?: string;
  brand?: string;
  notes?: string;
  purchase_date?: string;
  purchase_price?: number;
  favorite: boolean;
  image_path: string;
  thumbnail_path?: string;
  medium_path?: string;
  image_url?: string;
  thumbnail_url?: string;
  medium_url?: string;
  tags: ItemTags;
  colors: string[];
  primary_color?: string;
  status: 'processing' | 'ready' | 'error' | 'archived';
  ai_processed: boolean;
  ai_confidence?: number;
  ai_description?: string;
  wear_count: number;
  last_worn_at?: string;
  last_suggested_at?: string;
  suggestion_count: number;
  acceptance_count: number;
  wears_since_wash: number;
  last_washed_at?: string;
  wash_interval?: number;
  needs_wash: boolean;
  effective_wash_interval: number;
  quantity: number;
  additional_images: ItemImage[];
  folders: FolderRef[];
  is_archived: boolean;
  archived_at?: string;
  archive_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface FolderRef {
  id: string;
  name: string;
  icon?: string;
  color?: string;
}

export interface Folder extends FolderRef {
  user_id: string;
  position: number;
  item_count: number;
  created_at: string;
  updated_at: string;
}

export interface StyleProfile {
  casual: number;
  formal: number;
  sporty: number;
  minimalist: number;
  bold: number;
}

export interface AIEndpoint {
  name: string;
  url: string;
  vision_model: string;
  text_model: string;
  enabled: boolean;
}

export interface Preferences {
  color_favorites: string[];
  color_avoid: string[];
  style_profile: StyleProfile;
  default_occasion: string;
  temperature_unit: 'celsius' | 'fahrenheit';
  temperature_sensitivity: 'low' | 'normal' | 'high';
  cold_threshold: number;
  hot_threshold: number;
  layering_preference: 'minimal' | 'moderate' | 'heavy';
  avoid_repeat_days: number;
  prefer_underused_items: boolean;
  variety_level: 'low' | 'moderate' | 'high';
  ai_endpoints: AIEndpoint[];
}

// Family types
export interface FamilyMember {
  id: string;
  display_name: string;
  email: string;
  avatar_url?: string;
  role: 'admin' | 'member';
  created_at: string;  // When user joined the family
}

export interface PendingInvite {
  id: string;
  email: string;
  created_at: string;  // When invite was sent
  expires_at: string;
}

export interface Family {
  id: string;
  name: string;
  invite_code: string;
  members: FamilyMember[];
  pending_invites: PendingInvite[];
  created_at: string;
}

// Multi-image types
export interface ItemImage {
  id: string;
  item_id: string;
  image_path: string;
  thumbnail_path?: string;
  medium_path?: string;
  position: number;
  created_at: string;
  image_url: string;
  thumbnail_url?: string;
  medium_url?: string;
}

// Wash tracking types
export interface WashHistoryEntry {
  id: string;
  item_id: string;
  washed_at: string;
  method?: string;
  notes?: string;
  created_at: string;
}

// Family rating types
export interface FamilyRating {
  id: string;
  user_id: string;
  user_display_name: string;
  user_avatar_url?: string;
  rating: number;
  comment?: string;
  created_at: string;
}

// Outfit types
export interface OutfitItem {
  id: string;
  type: string;
  subtype: string | null;
  name: string | null;
  primary_color: string | null;
  colors: string[];
  image_path: string;
  thumbnail_path: string | null;
  image_url?: string;
  thumbnail_url?: string;
  layer_type: string | null;
  position: number;
}

export interface WeatherData extends Record<string, unknown> {
  temperature: number;
  feels_like: number;
  humidity: number;
  precipitation_chance: number;
  condition: string;
}

export interface FeedbackSummary {
  rating: number | null;
  comment: string | null;
  worn_at: string | null;
  actually_worn: boolean | null;
  wore_instead_items: WoreInsteadItem[] | null;
}

export interface WoreInsteadItem {
  id: string;
  type: string;
  name: string | null;
  thumbnail_path: string | null;
  thumbnail_url?: string;
}

export type OutfitSource = 'scheduled' | 'on_demand' | 'manual' | 'pairing';

export interface Outfit {
  id: string;
  occasion: string;
  scheduled_for: string | null;
  status: 'pending' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'skipped' | 'expired';
  source: OutfitSource;
  name: string | null;
  replaces_outfit_id: string | null;
  cloned_from_outfit_id: string | null;
  reasoning: string | null;
  style_notes: string | null;
  highlights: string[] | null;
  weather: WeatherData | null;
  items: OutfitItem[];
  feedback: FeedbackSummary | null;
  family_ratings: FamilyRating[] | null;
  family_rating_average: number | null;
  family_rating_count: number | null;
  is_starter_suggestion?: boolean;
  created_at: string;
}

// Pairing types
export interface SourceItem {
  id: string;
  type: string;
  subtype?: string;
  name?: string;
  primary_color?: string;
  image_path: string;
  thumbnail_path?: string;
  image_url?: string;
  thumbnail_url?: string;
}

export interface Pairing extends Outfit {
  source_item?: SourceItem;
}
