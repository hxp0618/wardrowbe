import type { Outfit } from "../../shared-domain/src";

import type { WardrowbeApi } from "./types";

export interface StudioCreatePayload {
  items: string[];
  occasion: string;
  name?: string;
  scheduled_for?: string | null;
  mark_worn?: boolean;
  source_item_id?: string | null;
}

export function createStudioOutfit(api: WardrowbeApi, payload: StudioCreatePayload): Promise<Outfit> {
  return api.post<Outfit>("/outfits/studio", payload);
}

export interface WoreInsteadPayload {
  items: string[];
  rating?: number;
  comment?: string;
  scheduled_for?: string | null;
}

export function createWoreInstead(api: WardrowbeApi, originalOutfitId: string, payload: WoreInsteadPayload): Promise<Outfit> {
  return api.post<Outfit>(`/outfits/${originalOutfitId}/wore-instead`, payload);
}

export function cloneToLookbook(api: WardrowbeApi, sourceOutfitId: string, payload: { name: string }): Promise<Outfit> {
  return api.post<Outfit>(`/outfits/${sourceOutfitId}/clone-to-lookbook`, payload);
}

export function wearTodayOutfit(
  api: WardrowbeApi,
  templateId: string,
  payload: { scheduled_for?: string | null },
): Promise<Outfit> {
  return api.post<Outfit>(`/outfits/${templateId}/wear-today`, payload);
}

export interface PatchOutfitPayload {
  name?: string;
  items?: string[];
}

export function patchOutfit(api: WardrowbeApi, id: string, payload: PatchOutfitPayload): Promise<Outfit> {
  return api.patch<Outfit>(`/outfits/${id}`, payload);
}
