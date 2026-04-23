import type { Folder } from "../../shared-domain/src";

import type { WardrowbeApi } from "./types";

export function listFolders(api: WardrowbeApi): Promise<Folder[]> {
  return api.get<Folder[]>("/folders");
}
