import type { Item, ItemFilter, ItemListResponse } from "../../shared-domain/src";

import type { WardrowbeApi } from "./types";

export function buildItemsQueryParams(
  filters: ItemFilter,
  page: number,
  pageSize: number,
): Record<string, string> {
  const params: Record<string, string> = {
    page: String(page),
    page_size: String(pageSize),
  };
  if (filters.type) params.type = filters.type;
  if (filters.colors?.length) params.colors = filters.colors.join(",");
  if (filters.search) params.search = filters.search;
  if (filters.favorite !== undefined) params.favorite = String(filters.favorite);
  if (filters.needs_wash !== undefined) params.needs_wash = String(filters.needs_wash);
  if (filters.is_archived !== undefined) params.is_archived = String(filters.is_archived);
  if (filters.sort_by) params.sort_by = filters.sort_by;
  if (filters.sort_order) params.sort_order = filters.sort_order;
  if (filters.folder_id) params.folder_id = filters.folder_id;
  if (filters.ids) params.ids = filters.ids;
  return params;
}

export function listItems(
  api: WardrowbeApi,
  filters: ItemFilter = {},
  page = 1,
  pageSize = 20,
): Promise<ItemListResponse> {
  return api.get<ItemListResponse>("/items", { params: buildItemsQueryParams(filters, page, pageSize) });
}

export function getItem(api: WardrowbeApi, itemId: string): Promise<Item> {
  return api.get<Item>(`/items/${itemId}`);
}
