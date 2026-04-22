import { api } from '../lib/api'

import type { UserProfile, UserProfileUpdate } from './types'

export function getUserProfile(): Promise<UserProfile> {
  return api.get<UserProfile>('/users/me')
}

export function updateUserProfile(data: UserProfileUpdate): Promise<UserProfile> {
  return api.patch<UserProfile>('/users/me', data)
}

export function completeOnboarding(): Promise<{ onboarding_completed: boolean }> {
  return api.post<{ onboarding_completed: boolean }>('/users/me/onboarding/complete')
}
