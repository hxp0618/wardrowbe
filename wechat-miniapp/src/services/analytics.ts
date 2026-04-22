import { api } from '../lib/api'

import type { AnalyticsData } from './types'

export function getAnalytics(days = 60): Promise<AnalyticsData> {
  return api.get<AnalyticsData>('/analytics', {
    params: { days: String(days) },
  })
}
