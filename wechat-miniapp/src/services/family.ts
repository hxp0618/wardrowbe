import { api } from '../lib/api'

import type { Family, FamilyCreateResponse, JoinFamilyResponse } from './types'

export function getFamily(): Promise<Family> {
  return api.get<Family>('/families/me')
}

export function createFamily(name: string): Promise<FamilyCreateResponse> {
  return api.post<FamilyCreateResponse>('/families', { name })
}

export function joinFamily(inviteCode: string): Promise<JoinFamilyResponse> {
  return api.post<JoinFamilyResponse>('/families/join', {
    invite_code: inviteCode,
  })
}

export function joinFamilyByToken(token: string): Promise<JoinFamilyResponse> {
  return api.post<JoinFamilyResponse>('/families/join-by-token', { token })
}

export function updateFamily(name: string): Promise<Family> {
  return api.patch<Family>('/families/me', { name })
}

export function regenerateInviteCode(): Promise<{ invite_code: string }> {
  return api.post<{ invite_code: string }>('/families/me/regenerate-code')
}

export function inviteMember(
  email: string,
  role: 'member' | 'admin' = 'member'
): Promise<{ id: string; email: string; expires_at: string }> {
  return api.post<{ id: string; email: string; expires_at: string }>('/families/me/invite', {
    email,
    role,
  })
}

export function cancelInvite(inviteId: string): Promise<void> {
  return api.delete<void>(`/families/me/invites/${inviteId}`)
}

export function leaveFamily(): Promise<{ message: string }> {
  return api.post<{ message: string }>('/families/me/leave')
}
