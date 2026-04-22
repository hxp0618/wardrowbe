'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import {
  acknowledgeInsight as acknowledgeInsightRequest,
  generateLearningInsights as generateLearningInsightsRequest,
  getItemPairSuggestions,
  getLearningInsights,
  recomputeLearning as recomputeLearningRequest,
} from '@wardrowbe/shared-services';

import { api, setAccessToken } from '@/lib/api';

function useSetTokenIfAvailable() {
  const { data: session } = useSession();
  if (session?.accessToken) {
    setAccessToken(session.accessToken as string);
  }
}

export type {
  ItemInfo,
  ItemPair,
  ItemPairSuggestion,
  LearnedColorScore,
  LearnedStyleScore,
  LearningInsightsData,
  LearningProfile,
  OccasionPattern,
  PreferenceSuggestions,
  StyleInsight,
  WeatherPreference,
} from '@wardrowbe/shared-services';

/**
 * Hook to fetch learning insights for the current user.
 */
export function useLearning() {
  const { status } = useSession();
  useSetTokenIfAvailable();

  return useQuery({
    queryKey: ['learning'],
    queryFn: () => getLearningInsights(api),
    enabled: status !== 'loading',
    staleTime: 5 * 60 * 1000,
  });
}

export function useRecomputeLearning() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  return useMutation({
    mutationFn: async () => {
      if (session?.accessToken) {
        setAccessToken(session.accessToken as string);
      }
      return recomputeLearningRequest(api);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learning'] });
    },
  });
}

export function useGenerateInsights() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  return useMutation({
    mutationFn: async () => {
      if (session?.accessToken) {
        setAccessToken(session.accessToken as string);
      }
      return generateLearningInsightsRequest(api);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learning'] });
    },
  });
}

export function useAcknowledgeInsight() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  return useMutation({
    mutationFn: async (insightId: string) => {
      if (session?.accessToken) {
        setAccessToken(session.accessToken as string);
      }
      return acknowledgeInsightRequest(api, insightId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learning'] });
    },
  });
}

export function useItemPairSuggestions(itemId: string, limit = 5) {
  const { status } = useSession();
  useSetTokenIfAvailable();

  return useQuery({
    queryKey: ['learning', 'item-pairs', itemId, limit],
    queryFn: () => getItemPairSuggestions(api, itemId, limit),
    enabled: status !== 'loading' && !!itemId,
    staleTime: 5 * 60 * 1000,
  });
}
