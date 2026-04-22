'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import {
  deletePairing as deletePairingRequest,
  generatePairings as generatePairingsRequest,
  listItemPairings,
  listPairings,
} from '@wardrowbe/shared-services';

import { api, setAccessToken } from '@/lib/api';

function useSetTokenIfAvailable() {
  const { data: session } = useSession();
  if (session?.accessToken) {
    setAccessToken(session.accessToken as string);
  }
}

export function usePairings(page = 1, pageSize = 20, sourceType?: string) {
  const { status } = useSession();
  useSetTokenIfAvailable();

  return useQuery({
    queryKey: ['pairings', page, pageSize, sourceType],
    queryFn: () => listPairings(api, page, pageSize, sourceType),
    enabled: status !== 'loading',
  });
}

export function useItemPairings(itemId: string, page = 1, pageSize = 20) {
  const { status } = useSession();
  useSetTokenIfAvailable();

  return useQuery({
    queryKey: ['pairings', 'item', itemId, page, pageSize],
    queryFn: () => listItemPairings(api, itemId, page, pageSize),
    enabled: !!itemId && status !== 'loading',
  });
}

export function useGeneratePairings() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  return useMutation({
    mutationFn: async ({
      itemId,
      numPairings = 3,
    }: {
      itemId: string;
      numPairings?: number;
    }) => {
      if (session?.accessToken) {
        setAccessToken(session.accessToken as string);
      }
      return generatePairingsRequest(api, itemId, { num_pairings: numPairings });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pairings'] });
      queryClient.invalidateQueries({ queryKey: ['pairings', 'item', variables.itemId] });
    },
  });
}

export function useDeletePairing() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  return useMutation({
    mutationFn: async (pairingId: string) => {
      if (session?.accessToken) {
        setAccessToken(session.accessToken as string);
      }
      return deletePairingRequest(api, pairingId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pairings'] });
    },
  });
}
