import { api } from '../lib/api'

import type {
  GeneratePairingsRequest,
  GeneratePairingsResponse,
  PairingListResponse,
} from './types'

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

export function generatePairings(
  request: GeneratePairingsRequest
): Promise<GeneratePairingsResponse> {
  return api.post<GeneratePairingsResponse>('/pairings/generate', request)
}

export function deletePairing(pairingId: string): Promise<void> {
  return api.delete<void>(`/pairings/${pairingId}`)
}

export function listItemPairings(
  itemId: string,
  page = 1,
  pageSize = 20
): Promise<PairingListResponse> {
  return api.get<PairingListResponse>(`/pairings/item/${itemId}`, {
    params: { page: String(page), page_size: String(pageSize) },
  })
}
