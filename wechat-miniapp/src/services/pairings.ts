import { api } from '../lib/api'

import type { PairingListResponse } from './types'

export function listPairings(
  page = 1,
  pageSize = 20,
  sourceType?: string
): Promise<PairingListResponse> {
  const params: Record<string, string> = {
    page: String(page),
    page_size: String(pageSize),
  }

  if (sourceType) {
    params.source_type = sourceType
  }

  return api.get<PairingListResponse>('/pairings', { params })
}
