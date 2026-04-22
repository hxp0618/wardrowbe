import { api } from "@/lib/api";

export interface SessionUser {
  id: string;
  email: string;
  display_name: string;
  onboarding_completed: boolean;
  timezone?: string;
  location_lat?: number | null;
  location_lon?: number | null;
  location_name?: string | null;
}

export async function fetchSessionUser(): Promise<SessionUser> {
  return api.get<SessionUser>("/auth/session");
}
