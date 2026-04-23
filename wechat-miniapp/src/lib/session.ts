import { api } from "@/lib/api";

export interface SessionUser {
  id: string;
  /** Same as id; outfit owner checks use this field name in Web types. */
  user_id?: string;
  email: string;
  display_name: string;
  onboarding_completed: boolean;
  timezone?: string;
  location_lat?: number | null;
  location_lon?: number | null;
  location_name?: string | null;
}

export async function fetchSessionUser(): Promise<SessionUser> {
  const raw = await api.get<SessionUser>("/auth/session");
  return { ...raw, user_id: raw.user_id ?? raw.id };
}
