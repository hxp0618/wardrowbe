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
