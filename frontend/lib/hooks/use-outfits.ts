import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import {
  acceptOutfit as acceptOutfitRequest,
  deleteFamilyRating as deleteFamilyRatingRequest,
  deleteOutfit as deleteOutfitRequest,
  getOutfit,
  listFamilyRatings as listFamilyRatingsRequest,
  listOutfits,
  listOutfitsForMonth,
  listPendingOutfits,
  rejectOutfit as rejectOutfitRequest,
  submitFamilyRating as submitFamilyRatingRequest,
  submitOutfitFeedback as submitOutfitFeedbackRequest,
} from '@wardrowbe/shared-services';

import { api, setAccessToken } from '@/lib/api';
import { FamilyRating, type WeatherData } from '@/lib/types';

// Helper to set token if available (for NextAuth mode)
function useSetTokenIfAvailable() {
  const { data: session } = useSession();
  if (session?.accessToken) {
    setAccessToken(session.accessToken as string);
  }
}

export interface OutfitItem {
  id: string;
  type: string;
  subtype: string | null;
  name: string | null;
  primary_color: string | null;
  colors: string[];
  image_path: string;
  thumbnail_path: string | null;
  thumbnail_url?: string;
  image_url?: string;
  layer_type: string | null;
  position: number;
}

export interface WoreInsteadItem {
  id: string;
  type: string;
  name: string | null;
  thumbnail_path: string | null;
  thumbnail_url?: string;
}

export interface FeedbackSummary {
  rating: number | null;
  comment: string | null;
  worn_at: string | null;
  actually_worn: boolean | null;
  wore_instead_items: WoreInsteadItem[] | null;
}

export type OutfitSource = 'scheduled' | 'on_demand' | 'manual' | 'pairing';

export interface Outfit {
  id: string;
  user_id: string;
  occasion: string;
  scheduled_for: string | null;
  status: 'pending' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'skipped' | 'expired';
  source: OutfitSource;
  name: string | null;
  replaces_outfit_id: string | null;
  cloned_from_outfit_id: string | null;
  reasoning: string | null;
  style_notes: string | null;
  highlights: string[] | null;
  weather: WeatherData | null;
  items: OutfitItem[];
  feedback: FeedbackSummary | null;
  family_ratings: FamilyRating[] | null;
  family_rating_average: number | null;
  family_rating_count: number | null;
  is_starter_suggestion?: boolean;
  created_at: string;
}

export interface OutfitListResponse {
  outfits: Outfit[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

export interface OutfitFilters {
  status?: string;
  occasion?: string;
  date_from?: string;
  date_to?: string;
  source?: string;
  is_lookbook?: boolean;
  is_replacement?: boolean;
  has_source_item?: boolean;
  search?: string;
  cloned_from_outfit_id?: string;
}

export interface FeedbackData {
  accepted?: boolean;
  rating?: number;
  comfort_rating?: number;
  style_rating?: number;
  comment?: string;
  worn?: boolean;
  worn_with_modifications?: boolean;
  modification_notes?: string;
  actually_worn?: boolean;
  wore_instead_items?: string[];
}

export interface FeedbackResponse {
  id: string;
  outfit_id: string;
  accepted: boolean | null;
  rating: number | null;
  comfort_rating: number | null;
  style_rating: number | null;
  comment: string | null;
  worn_at: string | null;
  worn_with_modifications: boolean;
  modification_notes: string | null;
  actually_worn: boolean | null;
  wore_instead_items: string[] | null;
  created_at: string;
}

export function useOutfits(filters: OutfitFilters = {}, page = 1, pageSize = 20) {
  const { status } = useSession();
  useSetTokenIfAvailable();

  return useQuery({
    queryKey: ['outfits', filters, page, pageSize],
    queryFn: () => listOutfits(api, filters, page, pageSize),
    enabled: status !== 'loading',
  });
}

export function useOutfit(outfitId: string | undefined) {
  const { status } = useSession();
  useSetTokenIfAvailable();

  return useQuery({
    queryKey: ['outfit', outfitId],
    queryFn: () => getOutfit(api, outfitId!),
    enabled: !!outfitId && status !== 'loading',
  });
}

export function useAcceptOutfit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (outfitId: string) => acceptOutfitRequest(api, outfitId),
    onSuccess: (_, outfitId) => {
      queryClient.invalidateQueries({ queryKey: ['outfits'] });
      queryClient.invalidateQueries({ queryKey: ['outfit', outfitId] });
      queryClient.invalidateQueries({ queryKey: ['calendarOutfits'] });
      queryClient.invalidateQueries({ queryKey: ['pendingOutfits'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
}

export function useRejectOutfit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (outfitId: string) => rejectOutfitRequest(api, outfitId),
    onSuccess: (_, outfitId) => {
      queryClient.invalidateQueries({ queryKey: ['outfits'] });
      queryClient.invalidateQueries({ queryKey: ['outfit', outfitId] });
      queryClient.invalidateQueries({ queryKey: ['calendarOutfits'] });
      queryClient.invalidateQueries({ queryKey: ['pendingOutfits'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
}

export function useSubmitFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ outfitId, feedback }: { outfitId: string; feedback: FeedbackData }) =>
      submitOutfitFeedbackRequest(api, outfitId, feedback as unknown as Record<string, unknown>) as Promise<FeedbackResponse>,
    onSuccess: (_, { outfitId }) => {
      queryClient.invalidateQueries({ queryKey: ['outfits'] });
      queryClient.invalidateQueries({ queryKey: ['outfit', outfitId] });
      queryClient.invalidateQueries({ queryKey: ['calendarOutfits'] });
      queryClient.invalidateQueries({ queryKey: ['pendingOutfits'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
}

export function useDeleteOutfit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (outfitId: string) => deleteOutfitRequest(api, outfitId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outfits'] });
      queryClient.invalidateQueries({ queryKey: ['calendarOutfits'] });
      queryClient.invalidateQueries({ queryKey: ['pendingOutfits'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
}

export function useCalendarOutfits(year: number, month: number, filters: OutfitFilters = {}) {
  const { status } = useSession();
  useSetTokenIfAvailable();

  return useQuery({
    queryKey: ['calendarOutfits', year, month, filters],
    queryFn: () =>
      listOutfitsForMonth(api, year, month, {
        status: filters.status,
        occasion: filters.occasion,
      }),
    enabled: status !== 'loading',
  });
}

export function usePendingOutfits(limit = 3) {
  const { status } = useSession();
  useSetTokenIfAvailable();

  return useQuery({
    queryKey: ['pendingOutfits', limit],
    queryFn: () => listPendingOutfits(api, limit),
    enabled: status !== 'loading',
  });
}

// --- Family rating hooks ---

export function useSubmitFamilyRating() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ outfitId, rating, comment }: { outfitId: string; rating: number; comment?: string }) =>
      submitFamilyRatingRequest(api, outfitId, { rating, comment }),
    onSuccess: (_, { outfitId }) => {
      queryClient.invalidateQueries({ queryKey: ['outfits'] });
      queryClient.invalidateQueries({ queryKey: ['outfit', outfitId] });
      queryClient.invalidateQueries({ queryKey: ['familyRatings', outfitId] });
      queryClient.invalidateQueries({ queryKey: ['calendarOutfits'] });
      queryClient.invalidateQueries({ queryKey: ['familyOutfits'] });
    },
  });
}

export function useFamilyRatings(outfitId: string | undefined) {
  const { status } = useSession();
  useSetTokenIfAvailable();

  return useQuery({
    queryKey: ['familyRatings', outfitId],
    queryFn: () => listFamilyRatingsRequest(api, outfitId!),
    enabled: !!outfitId && status !== 'loading',
  });
}

export function useDeleteFamilyRating() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (outfitId: string) => deleteFamilyRatingRequest(api, outfitId),
    onSuccess: (_, outfitId) => {
      queryClient.invalidateQueries({ queryKey: ['outfits'] });
      queryClient.invalidateQueries({ queryKey: ['outfit', outfitId] });
      queryClient.invalidateQueries({ queryKey: ['familyRatings', outfitId] });
      queryClient.invalidateQueries({ queryKey: ['familyOutfits'] });
    },
  });
}

export function useFamilyOutfits(memberId: string | undefined, page = 1, pageSize = 20) {
  const { status } = useSession();
  useSetTokenIfAvailable();

  return useQuery({
    queryKey: ['familyOutfits', memberId, page, pageSize],
    queryFn: () =>
      listOutfits(api, { family_member_id: memberId || '' }, page, pageSize),
    enabled: !!memberId && status !== 'loading',
  });
}
