import type {
  GeneratePairingsRequest,
  GeneratePairingsResponse,
  PairingListResponse,
} from "../../shared-domain/src";

import type { WardrowbeApi } from "./types";

export function listPairings(
  api: WardrowbeApi,
  page = 1,
  pageSize = 20,
  sourceType?: string,
): Promise<PairingListResponse> {
  const params: Record<string, string> = {
    page: String(page),
    page_size: String(pageSize),
  };
  if (sourceType) {
    params.source_type = sourceType;
  }
  return api.get<PairingListResponse>("/pairings", { params });
}

export function listItemPairings(
  api: WardrowbeApi,
  itemId: string,
  page = 1,
  pageSize = 20,
): Promise<PairingListResponse> {
  const params: Record<string, string> = {
    page: String(page),
    page_size: String(pageSize),
  };
  return api.get<PairingListResponse>(`/pairings/item/${itemId}`, { params });
}

export function generatePairings(
  api: WardrowbeApi,
  itemId: string,
  body: GeneratePairingsRequest,
): Promise<GeneratePairingsResponse> {
  return api.post<GeneratePairingsResponse>(`/pairings/generate/${itemId}`, body);
}

export function deletePairing(api: WardrowbeApi, pairingId: string): Promise<unknown> {
  return api.delete(`/pairings/${pairingId}`);
}
