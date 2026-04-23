import { api } from '../lib/api'

import type { LearningInsightsData, LearningProfile, StyleInsight } from './types'

export function getLearning(): Promise<LearningInsightsData> {
  return api.get<LearningInsightsData>('/learning')
}

export function recomputeLearning(): Promise<LearningProfile> {
  return api.post<LearningProfile>('/learning/recompute')
}

export function generateInsights(): Promise<StyleInsight[]> {
  return api.post<StyleInsight[]>('/learning/generate-insights')
}

export function acknowledgeInsight(insightId: string): Promise<{ acknowledged: boolean }> {
  return api.post<{ acknowledged: boolean }>(`/learning/insights/${insightId}/acknowledge`)
}

export interface ItemPairSuggestion {
  item: {
    id: string
    type: string
    name: string | null
    primary_color: string | null
    thumbnail_path: string | null
    thumbnail_url: string | null
  }
  compatibility_score: number
}

export function getItemPairSuggestions(
  itemId: string,
  limit = 5
): Promise<ItemPairSuggestion[]> {
  return api.get<ItemPairSuggestion[]>(`/learning/item-pairs/${itemId}`, {
    params: { limit: String(limit) },
  })
}
