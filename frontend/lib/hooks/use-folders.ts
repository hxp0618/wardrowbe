'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';

import { api, setAccessToken } from '@/lib/api';
import { Folder } from '@/lib/types';

export function useFolders() {
  const { data: session, status } = useSession();
  if (session?.accessToken) {
    setAccessToken(session.accessToken as string);
  }

  return useQuery({
    queryKey: ['folders'],
    queryFn: () => api.get<Folder[]>('/folders'),
    enabled: status !== 'loading',
  });
}

export interface FolderMutationPayload {
  name: string;
  icon?: string | null;
  color?: string | null;
  position?: number;
}

export function useCreateFolder() {
  const qc = useQueryClient();
  const { data: session } = useSession();
  return useMutation({
    mutationFn: (payload: FolderMutationPayload) => {
      if (session?.accessToken) setAccessToken(session.accessToken as string);
      return api.post<Folder>('/folders', payload);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['folders'] }),
  });
}

export function useUpdateFolder() {
  const qc = useQueryClient();
  const { data: session } = useSession();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<FolderMutationPayload> }) => {
      if (session?.accessToken) setAccessToken(session.accessToken as string);
      return api.patch<Folder>(`/folders/${id}`, payload);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['folders'] }),
  });
}

export function useDeleteFolder() {
  const qc = useQueryClient();
  const { data: session } = useSession();
  return useMutation({
    mutationFn: (id: string) => {
      if (session?.accessToken) setAccessToken(session.accessToken as string);
      return api.delete<void>(`/folders/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['folders'] });
      qc.invalidateQueries({ queryKey: ['items'] });
    },
  });
}

export function useAddItemsToFolder() {
  const qc = useQueryClient();
  const { data: session } = useSession();
  return useMutation({
    mutationFn: ({ folderId, itemIds }: { folderId: string; itemIds: string[] }) => {
      if (session?.accessToken) setAccessToken(session.accessToken as string);
      return api.post<Folder>(`/folders/${folderId}/items`, { item_ids: itemIds });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['folders'] });
      qc.invalidateQueries({ queryKey: ['items'] });
    },
  });
}

export function useRemoveItemsFromFolder() {
  const qc = useQueryClient();
  const { data: session } = useSession();
  return useMutation({
    mutationFn: ({ folderId, itemIds }: { folderId: string; itemIds: string[] }) => {
      if (session?.accessToken) setAccessToken(session.accessToken as string);
      return api.delete<Folder>(`/folders/${folderId}/items`, {
        body: JSON.stringify({ item_ids: itemIds }),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['folders'] });
      qc.invalidateQueries({ queryKey: ['items'] });
    },
  });
}

export function useReorderFolders() {
  const qc = useQueryClient();
  const { data: session } = useSession();
  return useMutation({
    mutationFn: (folderIds: string[]) => {
      if (session?.accessToken) setAccessToken(session.accessToken as string);
      return api.post<Folder[]>('/folders/reorder', { folder_ids: folderIds });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['folders'] }),
  });
}
