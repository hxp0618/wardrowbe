import type { Preferences } from "../../shared-domain/src";

import type { WardrowbeApi } from "./types";

export function getPreferences(api: WardrowbeApi): Promise<Preferences> {
  return api.get<Preferences>("/users/me/preferences");
}

export function updatePreferences(api: WardrowbeApi, data: Partial<Preferences>): Promise<Preferences> {
  return api.patch<Preferences>("/users/me/preferences", data);
}

export function resetPreferences(api: WardrowbeApi): Promise<Preferences> {
  return api.post<Preferences>("/users/me/preferences/reset");
}

export interface AITestResult {
  status: "connected" | "error";
  available_models?: string[];
  vision_models?: string[];
  text_models?: string[];
  error?: string;
}

export function testAIEndpoint(api: WardrowbeApi, url: string): Promise<AITestResult> {
  return api.post<AITestResult>("/users/me/preferences/test-ai-endpoint", { url });
}
