import { api } from '../lib/api'

import type { Family, FamilyCreateResponse, FamilyMember, JoinFamilyResponse } from './types'

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

export function updateMemberRole(
  memberId: string,
  role: string
): Promise<FamilyMember> {
  return api.patch<FamilyMember>(`/families/me/members/${memberId}`, { role })
}

export function removeMember(memberId: string): Promise<void> {
  return api.delete<void>(`/families/me/members/${memberId}`)
}

export interface FamilyRating {
  id: string
  outfit_id: string
  user_id: string
  display_name: string
  rating: number
  comment?: string
  created_at: string
}

export function submitFamilyRating(
  outfitId: string,
  rating: number,
  comment?: string
): Promise<FamilyRating> {
  return api.post<FamilyRating>(`/outfits/${outfitId}/family-rating`, { rating, comment })
}

export function getFamilyRatings(outfitId: string): Promise<FamilyRating[]> {
  return api.get<FamilyRating[]>(`/outfits/${outfitId}/family-ratings`)
}

export function deleteFamilyRating(outfitId: string): Promise<void> {
  return api.delete<void>(`/outfits/${outfitId}/family-rating`)
}
