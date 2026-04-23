import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import {
  cloneToLookbook as cloneToLookbookRequest,
  createStudioOutfit as createStudioOutfitRequest,
  createWoreInstead as createWoreInsteadRequest,
  patchOutfit as patchOutfitRequest,
  type PatchOutfitPayload,
  type StudioCreatePayload,
  wearTodayOutfit,
  type WoreInsteadPayload,
} from '@wardrowbe/shared-services';

import { api, setAccessToken } from '@/lib/api';

function useSetTokenIfAvailable() {
  const { data: session } = useSession();
  if (session?.accessToken) {
    setAccessToken(session.accessToken as string);
  }
}

export type {
  PatchOutfitPayload,
  StudioCreatePayload,
  WoreInsteadPayload,
} from '@wardrowbe/shared-services';

export function useCreateStudioOutfit() {
  const qc = useQueryClient();
  useSetTokenIfAvailable();
  return useMutation({
    mutationFn: (payload: StudioCreatePayload) => createStudioOutfitRequest(api, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['outfits'] });
      qc.invalidateQueries({ queryKey: ['analytics'] });
      qc.invalidateQueries({ queryKey: ['learning'] });
    },
  });
}

export function useCreateWoreInstead(originalOutfitId: string) {
  const qc = useQueryClient();
  useSetTokenIfAvailable();
  return useMutation({
    mutationFn: (payload: WoreInsteadPayload) => createWoreInsteadRequest(api, originalOutfitId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['outfits'] });
      qc.invalidateQueries({ queryKey: ['outfit', originalOutfitId] });
      qc.invalidateQueries({ queryKey: ['pendingOutfits'] });
      qc.invalidateQueries({ queryKey: ['calendarOutfits'] });
      qc.invalidateQueries({ queryKey: ['analytics'] });
      qc.invalidateQueries({ queryKey: ['learning'] });
    },
  });
}

export function useCloneToLookbook(sourceOutfitId: string) {
  const qc = useQueryClient();
  useSetTokenIfAvailable();
  return useMutation({
    mutationFn: (payload: { name: string }) => cloneToLookbookRequest(api, sourceOutfitId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['outfits'] });
    },
  });
}

export function useWearToday(templateId: string) {
  const qc = useQueryClient();
  useSetTokenIfAvailable();
  return useMutation({
    mutationFn: (payload: { scheduled_for?: string | null }) => wearTodayOutfit(api, templateId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['outfits'] });
      qc.invalidateQueries({ queryKey: ['calendarOutfits'] });
      qc.invalidateQueries({ queryKey: ['items'] });
    },
  });
}

export function usePatchOutfit() {
  const qc = useQueryClient();
  useSetTokenIfAvailable();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: PatchOutfitPayload }) =>
      patchOutfitRequest(api, id, payload),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['outfit', id] });
      qc.invalidateQueries({ queryKey: ['outfits'] });
    },
  });
}
