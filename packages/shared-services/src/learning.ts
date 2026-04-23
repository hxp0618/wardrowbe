import type { WardrowbeApi } from "./types";

export interface LearnedColorScore {
  color: string;
  score: number;
  interpretation: string;
}

export interface LearnedStyleScore {
  style: string;
  score: number;
}

export interface OccasionPattern {
  occasion: string;
  preferred_colors: string[];
  success_rate: number;
}

export interface WeatherPreference {
  weather_type: string;
  preferred_layers: number;
  success_rate: number;
}

export interface LearningProfile {
  has_learning_data: boolean;
  feedback_count: number;
  outfits_rated: number;
  overall_acceptance_rate: number | null;
  average_rating: number | null;
  average_comfort_rating: number | null;
  average_style_rating: number | null;
  color_preferences: LearnedColorScore[];
  style_preferences: LearnedStyleScore[];
  occasion_patterns: OccasionPattern[];
  weather_preferences: WeatherPreference[];
  last_computed_at: string | null;
}

export interface ItemInfo {
  id: string;
  type: string;
  name: string | null;
  primary_color: string | null;
  thumbnail_path: string | null;
  thumbnail_url: string | null;
}

export interface ItemPair {
  item1: ItemInfo;
  item2: ItemInfo;
  compatibility_score: number;
  times_paired: number;
  times_accepted: number;
}

export interface StyleInsight {
  id: string;
  category: string;
  insight_type: string;
  title: string;
  description: string;
  confidence: number;
  created_at: string;
}

export interface PreferenceSuggestions {
  updated: boolean;
  suggestions?: {
    suggested_favorite_colors?: string[];
    suggested_avoid_colors?: string[];
  };
  confidence?: number | null;
  reason?: string;
}

export interface LearningInsightsData {
  profile: LearningProfile;
  best_pairs: ItemPair[];
  insights: StyleInsight[];
  preference_suggestions: PreferenceSuggestions;
}

export interface ItemPairSuggestion {
  item: ItemInfo;
  compatibility_score: number;
}

export function getLearningInsights(api: WardrowbeApi): Promise<LearningInsightsData> {
  return api.get<LearningInsightsData>("/learning");
}

export function recomputeLearning(api: WardrowbeApi): Promise<LearningProfile> {
  return api.post<LearningProfile>("/learning/recompute");
}

export function generateLearningInsights(api: WardrowbeApi): Promise<StyleInsight[]> {
  return api.post<StyleInsight[]>("/learning/generate-insights");
}

export function acknowledgeInsight(api: WardrowbeApi, insightId: string): Promise<{ acknowledged: boolean }> {
  return api.post<{ acknowledged: boolean }>(`/learning/insights/${insightId}/acknowledge`);
}

export function getItemPairSuggestions(
  api: WardrowbeApi,
  itemId: string,
  limit = 5,
): Promise<ItemPairSuggestion[]> {
  return api.get<ItemPairSuggestion[]>(`/learning/item-pairs/${itemId}`, {
    params: { limit: String(limit) },
  });
}
