import { api } from "@/lib/api";

export interface SessionUser {
  id: string;
  email: string;
  display_name: string;
  onboarding_completed: boolean;
}

export async function fetchSessionUser(): Promise<SessionUser> {
  return api.get<SessionUser>("/auth/session");
}
