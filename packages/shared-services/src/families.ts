import type {
  Family,
  FamilyCreateResponse,
  FamilyMember,
  JoinFamilyResponse,
} from "../../shared-domain/src";

import type { WardrowbeApi } from "./types";

export function getMyFamily(api: WardrowbeApi): Promise<Family> {
  return api.get<Family>("/families/me");
}

export function createFamily(api: WardrowbeApi, name: string): Promise<FamilyCreateResponse> {
  return api.post<FamilyCreateResponse>("/families", { name });
}

export function updateFamily(api: WardrowbeApi, name: string): Promise<Family> {
  return api.patch<Family>("/families/me", { name });
}

export function joinFamily(api: WardrowbeApi, inviteCode: string): Promise<JoinFamilyResponse> {
  return api.post<JoinFamilyResponse>("/families/join", { invite_code: inviteCode });
}

export function joinFamilyByToken(api: WardrowbeApi, token: string): Promise<JoinFamilyResponse> {
  return api.post<JoinFamilyResponse>("/families/join-by-token", { token });
}

export function leaveFamily(api: WardrowbeApi): Promise<{ message: string }> {
  return api.post<{ message: string }>("/families/me/leave");
}

export function regenerateInviteCode(api: WardrowbeApi): Promise<{ invite_code: string }> {
  return api.post<{ invite_code: string }>("/families/me/regenerate-code");
}

export function inviteMember(
  api: WardrowbeApi,
  email: string,
  role = "member",
): Promise<{ id: string; email: string; expires_at: string }> {
  return api.post<{ id: string; email: string; expires_at: string }>("/families/me/invite", {
    email,
    role,
  });
}

export function cancelInvite(api: WardrowbeApi, inviteId: string): Promise<unknown> {
  return api.delete(`/families/me/invites/${inviteId}`);
}

export function updateMemberRole(
  api: WardrowbeApi,
  memberId: string,
  role: string,
): Promise<FamilyMember> {
  return api.patch<FamilyMember>(`/families/me/members/${memberId}`, { role });
}

export function removeMember(api: WardrowbeApi, memberId: string): Promise<unknown> {
  return api.delete(`/families/me/members/${memberId}`);
}
