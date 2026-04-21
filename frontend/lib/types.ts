import type { Item, Pairing } from '@wardrowbe/shared-domain/types'

export type {
  AIEndpoint,
  Family,
  FamilyMember,
  FamilyRating,
  FeedbackSummary,
  Folder,
  FolderRef,
  Item,
  ItemImage,
  ItemTags,
  Outfit,
  OutfitItem,
  OutfitSource,
  Pairing,
  PendingInvite,
  Preferences,
  SourceItem,
  StyleProfile,
  WashHistoryEntry,
  WeatherData,
  WoreInsteadItem,
} from '@wardrowbe/shared-domain/types'

export interface ItemListResponse {
  items: Item[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

export interface ItemFilter {
  type?: string;
  subtype?: string;
  colors?: string[];
  status?: string;
  favorite?: boolean;
  needs_wash?: boolean;
  is_archived?: boolean;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  folder_id?: string;
  ids?: string;
}

export interface FamilyCreateResponse {
  id: string;
  name: string;
  invite_code: string;
  role: string;
}

export interface JoinFamilyResponse {
  family_id: string;
  family_name: string;
  role: string;
}

export interface SuggestRequest {
  occasion: string;
  weather_override?: {
    temperature: number;
    feels_like?: number;
    humidity: number;
    precipitation_chance: number;
    condition: string;
  };
  exclude_items?: string[];
  include_items?: string[];
  target_date?: string;
}

export interface ManualOutfitRequest {
  item_ids: string[];
  occasion: string;
  scheduled_for?: string;
  name?: string;
  notes?: string;
  use_for_learning?: boolean;
}

export interface PairingListResponse {
  pairings: Pairing[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

export interface GeneratePairingsRequest {
  num_pairings: number;
}

export interface GeneratePairingsResponse {
  generated: number;
  pairings: Pairing[];
}

// Frontend taxonomy options include display labels and UI metadata.
export const CLOTHING_COLORS = [
  { name: 'Black', value: 'black', hex: '#1a1a1a' },
  { name: 'Charcoal', value: 'charcoal', hex: '#36454F' },
  { name: 'Gray', value: 'gray', hex: '#808080' },
  { name: 'White', value: 'white', hex: '#FAFAFA' },
  { name: 'Cream', value: 'cream', hex: '#F5F5DC' },
  { name: 'Beige', value: 'beige', hex: '#D4C4A8' },
  { name: 'Tan', value: 'tan', hex: '#C9B896' },
  { name: 'Khaki', value: 'khaki', hex: '#A89F6B' },
  { name: 'Olive', value: 'olive', hex: '#707B52' },
  { name: 'Army Green', value: 'army-green', hex: '#5B6340' },
  { name: 'Green', value: 'green', hex: '#4A7C59' },
  { name: 'Teal', value: 'teal', hex: '#367588' },
  { name: 'Navy', value: 'navy', hex: '#1B2A4A' },
  { name: 'Blue', value: 'blue', hex: '#4A7DB8' },
  { name: 'Brown', value: 'brown', hex: '#8B5A3C' },
  { name: 'Dark Brown', value: 'dark-brown', hex: '#5C4033' },
  { name: 'Burgundy', value: 'burgundy', hex: '#722F37' },
  { name: 'Red', value: 'red', hex: '#C44536' },
  { name: 'Pink', value: 'pink', hex: '#E8A0B0' },
  { name: 'Purple', value: 'purple', hex: '#6B5B7A' },
  { name: 'Yellow', value: 'yellow', hex: '#D4A84B' },
  { name: 'Orange', value: 'orange', hex: '#D2691E' },
] as const;

export const CLOTHING_TYPES = [
  { label: 'Shirt', value: 'shirt' },
  { label: 'T-Shirt', value: 't-shirt' },
  { label: 'Top', value: 'top' },
  { label: 'Polo', value: 'polo' },
  { label: 'Blouse', value: 'blouse' },
  { label: 'Tank Top', value: 'tank-top' },
  { label: 'Sweater', value: 'sweater' },
  { label: 'Hoodie', value: 'hoodie' },
  { label: 'Cardigan', value: 'cardigan' },
  { label: 'Vest', value: 'vest' },
  { label: 'Pants', value: 'pants' },
  { label: 'Jeans', value: 'jeans' },
  { label: 'Shorts', value: 'shorts' },
  { label: 'Skirt', value: 'skirt' },
  { label: 'Dress', value: 'dress' },
  { label: 'Jumpsuit', value: 'jumpsuit' },
  { label: 'Jacket', value: 'jacket' },
  { label: 'Blazer', value: 'blazer' },
  { label: 'Coat', value: 'coat' },
  { label: 'Suit', value: 'suit' },
  { label: 'Shoes', value: 'shoes' },
  { label: 'Sneakers', value: 'sneakers' },
  { label: 'Boots', value: 'boots' },
  { label: 'Sandals', value: 'sandals' },
  { label: 'Socks', value: 'socks' },
  { label: 'Tie', value: 'tie' },
  { label: 'Hat', value: 'hat' },
  { label: 'Scarf', value: 'scarf' },
  { label: 'Belt', value: 'belt' },
  { label: 'Bag', value: 'bag' },
  { label: 'Accessories', value: 'accessories' },
] as const;

export const OCCASIONS = [
  { label: 'Casual', value: 'casual' },
  { label: 'Office', value: 'office' },
  { label: 'Formal', value: 'formal' },
  { label: 'Date', value: 'date' },
  { label: 'Sporty', value: 'sporty' },
  { label: 'Outdoor', value: 'outdoor' },
] as const;
