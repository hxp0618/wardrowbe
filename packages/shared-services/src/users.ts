import type { WardrowbeApi } from "./types";

export interface UserProfile {
  id: string;
  email: string;
  display_name: string;
  avatar_url?: string;
  timezone: string;
  location_lat?: number;
  location_lon?: number;
  location_name?: string;
  family_id?: string;
  role: string;
  onboarding_completed: boolean;
  body_measurements?: Record<string, number | string> | null;
}

export interface UserProfileUpdate {
  display_name?: string;
  timezone?: string;
  location_lat?: number;
  location_lon?: number;
  location_name?: string;
  body_measurements?: Record<string, number | string> | null;
}

export function getUserProfile(api: WardrowbeApi): Promise<UserProfile> {
  return api.get<UserProfile>("/users/me");
}

export function updateUserProfile(api: WardrowbeApi, data: UserProfileUpdate): Promise<UserProfile> {
  return api.patch<UserProfile>("/users/me", data);
}

export function completeOnboarding(api: WardrowbeApi): Promise<{ onboarding_completed: boolean }> {
  return api.post<{ onboarding_completed: boolean }>("/users/me/onboarding/complete");
}
