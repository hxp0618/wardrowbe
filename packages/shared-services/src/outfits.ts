import type {
  Outfit,
  OutfitListFilters,
  OutfitListResponse,
  SuggestRequest,
} from "../../shared-domain/src";

import type { WardrowbeApi } from "./types";

export function buildOutfitsQueryParams(
  filters: OutfitListFilters,
  page: number,
  pageSize: number,
): Record<string, string> {
  const params: Record<string, string> = {
    page: String(page),
    page_size: String(pageSize),
  };
  if (filters.status) params.status = filters.status;
  if (filters.occasion) params.occasion = filters.occasion;
  if (filters.date_from) params.date_from = filters.date_from;
  if (filters.date_to) params.date_to = filters.date_to;
  if (filters.source) params.source = filters.source;
  if (filters.is_lookbook !== undefined) params.is_lookbook = String(filters.is_lookbook);
  if (filters.is_replacement !== undefined) params.is_replacement = String(filters.is_replacement);
  if (filters.has_source_item !== undefined) params.has_source_item = String(filters.has_source_item);
  if (filters.search) params.search = filters.search;
  if (filters.cloned_from_outfit_id) params.cloned_from_outfit_id = filters.cloned_from_outfit_id;
  if (filters.family_member_id) params.family_member_id = filters.family_member_id;
  return params;
}

export function listOutfits(
  api: WardrowbeApi,
  filters: OutfitListFilters = {},
  page = 1,
  pageSize = 20,
): Promise<OutfitListResponse> {
  return api.get<OutfitListResponse>("/outfits", {
    params: buildOutfitsQueryParams(filters, page, pageSize),
  });
}

export function getOutfit(api: WardrowbeApi, outfitId: string): Promise<Outfit> {
  return api.get<Outfit>(`/outfits/${outfitId}`);
}

export function listPendingOutfits(api: WardrowbeApi, limit = 3): Promise<OutfitListResponse> {
  return listOutfits(api, { status: "pending" }, 1, limit);
}

export function acceptOutfit(api: WardrowbeApi, outfitId: string): Promise<Outfit> {
  return api.post<Outfit>(`/outfits/${outfitId}/accept`);
}

export function rejectOutfit(api: WardrowbeApi, outfitId: string): Promise<Outfit> {
  return api.post<Outfit>(`/outfits/${outfitId}/reject`);
}

export function suggestOutfit(api: WardrowbeApi, body: SuggestRequest): Promise<Outfit> {
  return api.post<Outfit>("/outfits/suggest", body);
}
