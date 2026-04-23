import { describe, expect, it, vi } from "vitest";

import {
  cancelInvite,
  createFamily,
  getMyFamily,
  inviteMember,
  joinFamily,
  joinFamilyByToken,
  leaveFamily,
  regenerateInviteCode,
  removeMember,
  updateFamily,
  updateMemberRole,
} from "./families";
import type { WardrowbeApi } from "./types";

function mockApi() {
  const get = vi.fn();
  const post = vi.fn();
  const patch = vi.fn();
  const del = vi.fn();
  return { get, post, patch, delete: del, api: { get, post, patch, delete: del } as WardrowbeApi };
}

describe("families service", () => {
  it("getMyFamily uses /families/me", async () => {
    const { get, api } = mockApi();
    get.mockResolvedValue({ id: "1", name: "x", invite_code: "a", members: [], pending_invites: [], created_at: "" });
    await getMyFamily(api);
    expect(get).toHaveBeenCalledWith("/families/me");
  });

  it("createFamily posts name", async () => {
    const { post, api } = mockApi();
    post.mockResolvedValue({});
    await createFamily(api, "Home");
    expect(post).toHaveBeenCalledWith("/families", { name: "Home" });
  });

  it("joinFamily posts invite_code", async () => {
    const { post, api } = mockApi();
    post.mockResolvedValue({});
    await joinFamily(api, "ABC123");
    expect(post).toHaveBeenCalledWith("/families/join", { invite_code: "ABC123" });
  });

  it("joinFamilyByToken posts token", async () => {
    const { post, api } = mockApi();
    post.mockResolvedValue({});
    await joinFamilyByToken(api, "tok");
    expect(post).toHaveBeenCalledWith("/families/join-by-token", { token: "tok" });
  });

  it("updateFamily patches name", async () => {
    const { patch, api } = mockApi();
    patch.mockResolvedValue({});
    await updateFamily(api, "New");
    expect(patch).toHaveBeenCalledWith("/families/me", { name: "New" });
  });

  it("leaveFamily posts leave endpoint", async () => {
    const { post, api } = mockApi();
    post.mockResolvedValue({ message: "ok" });
    await leaveFamily(api);
    expect(post).toHaveBeenCalledWith("/families/me/leave");
  });

  it("regenerateInviteCode posts regenerate", async () => {
    const { post, api } = mockApi();
    post.mockResolvedValue({ invite_code: "x" });
    await regenerateInviteCode(api);
    expect(post).toHaveBeenCalledWith("/families/me/regenerate-code");
  });

  it("inviteMember posts email and role", async () => {
    const { post, api } = mockApi();
    post.mockResolvedValue({});
    await inviteMember(api, "a@b.com", "admin");
    expect(post).toHaveBeenCalledWith("/families/me/invite", { email: "a@b.com", role: "admin" });
  });

  it("cancelInvite deletes invite path", async () => {
    const { delete: del, api } = mockApi();
    del.mockResolvedValue({});
    await cancelInvite(api, "inv-1");
    expect(del).toHaveBeenCalledWith("/families/me/invites/inv-1");
  });

  it("updateMemberRole patches role", async () => {
    const { patch, api } = mockApi();
    patch.mockResolvedValue({});
    await updateMemberRole(api, "m1", "admin");
    expect(patch).toHaveBeenCalledWith("/families/me/members/m1", { role: "admin" });
  });

  it("removeMember deletes member path", async () => {
    const { delete: del, api } = mockApi();
    del.mockResolvedValue({});
    await removeMember(api, "m1");
    expect(del).toHaveBeenCalledWith("/families/me/members/m1");
  });
});
