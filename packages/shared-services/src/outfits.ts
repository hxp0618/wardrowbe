import type {
  FamilyRating,
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

export function deleteOutfit(api: WardrowbeApi, outfitId: string): Promise<void> {
  return api.delete<void>(`/outfits/${outfitId}`);
}

export function submitFamilyRating(
  api: WardrowbeApi,
  outfitId: string,
  data: { rating: number; comment?: string | null },
): Promise<FamilyRating> {
  return api.post<FamilyRating>(`/outfits/${outfitId}/family-rating`, data);
}

export function listFamilyRatings(api: WardrowbeApi, outfitId: string): Promise<FamilyRating[]> {
  return api.get<FamilyRating[]>(`/outfits/${outfitId}/family-ratings`);
}

export function deleteFamilyRating(api: WardrowbeApi, outfitId: string): Promise<void> {
  return api.delete<void>(`/outfits/${outfitId}/family-rating`);
}

export function submitOutfitFeedback(
  api: WardrowbeApi,
  outfitId: string,
  feedback: Record<string, unknown>,
): Promise<unknown> {
  return api.post<unknown>(`/outfits/${outfitId}/feedback`, feedback);
}

export function suggestOutfit(api: WardrowbeApi, body: SuggestRequest): Promise<Outfit> {
  return api.post<Outfit>("/outfits/suggest", body);
}

/** Outfits in a calendar month (same semantics as Web `useCalendarOutfits`). */
export function listOutfitsForMonth(
  api: WardrowbeApi,
  year: number,
  month: number,
  filters: Pick<OutfitListFilters, "status" | "occasion"> = {},
): Promise<OutfitListResponse> {
  const date_from = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const date_to = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return listOutfits(
    api,
    {
      date_from,
      date_to,
      status: filters.status,
      occasion: filters.occasion,
    },
    1,
    100,
  );
}
