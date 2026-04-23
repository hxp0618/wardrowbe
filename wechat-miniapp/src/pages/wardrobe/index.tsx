import { useCallback, useMemo, useRef, useState } from "react";
import { Button, Image, Input, Picker, ScrollView, Text, View } from "@tarojs/components";
import Taro, { useDidShow, useLoad } from "@tarojs/taro";

import type { Folder, Item, ItemFilter } from "@wardrowbe/shared-domain";
import { CLOTHING_TYPES } from "@wardrowbe/shared-domain";
import { analyzeItem, getItem, listFolders, listItems } from "@wardrowbe/shared-services";

import { api } from "@/lib/api";
import { getAccessToken } from "@/lib/auth-storage";
import { resolveMediaUrl } from "@/lib/images";
import { clothingSubtypeZh, clothingTypeZh } from "@/lib/taxonomy-zh";
import { wornAgoLabelZh } from "@/lib/worn-ago";

import "./index.scss";

const SORT_OPTIONS = [
  { label: "最新添加", value: "created_at" as const, order: "desc" as const },
  { label: "最早添加", value: "created_at", order: "asc" },
  { label: "最近穿过", value: "last_worn", order: "desc" },
  { label: "最久未穿", value: "last_worn", order: "asc" },
  { label: "穿得最多", value: "wear_count", order: "desc" },
  { label: "穿得最少", value: "wear_count", order: "asc" },
  { label: "名称 A-Z", value: "name", order: "asc" },
  { label: "名称 Z-A", value: "name", order: "desc" },
];

const TYPE_PICKER_RANGE = ["全部类型", ...CLOTHING_TYPES.map((t) => t.label)];
const SORT_PICKER_RANGE = SORT_OPTIONS.map((s) => s.label);

function typeValueFromPickerIndex(index: number): string | undefined {
  if (index <= 0) return undefined;
  return CLOTHING_TYPES[index - 1]?.value;
}

function buildItemFilters(
  searchTrimmed: string,
  typePickerIndex: number,
  sortPickerIndex: number,
  needsWashOnly: boolean,
  favoriteOnly: boolean,
  folderPickerIndex: number,
  folders: Folder[],
): ItemFilter {
  const sort = SORT_OPTIONS[sortPickerIndex] ?? SORT_OPTIONS[0];
  return {
    search: searchTrimmed || undefined,
    type: typeValueFromPickerIndex(typePickerIndex),
    needs_wash: needsWashOnly ? true : undefined,
    favorite: favoriteOnly ? true : undefined,
    is_archived: false,
    sort_by: sort.value,
    sort_order: sort.order,
    folder_id: folderPickerIndex > 0 ? folders[folderPickerIndex - 1]?.id : undefined,
  };
}

export default function WardrobePage() {
  const [items, setItems] = useState<Item[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [searchDraft, setSearchDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [typePickerIndex, setTypePickerIndex] = useState(0);
  const [sortPickerIndex, setSortPickerIndex] = useState(0);
  const [needsWashOnly, setNeedsWashOnly] = useState(false);
  const [favoriteOnly, setFavoriteOnly] = useState(false);
  const [folderPickerIndex, setFolderPickerIndex] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [pendingDeepLinkItemId, setPendingDeepLinkItemId] = useState<string | null>(null);
  const deepLinkOpened = useRef(false);

  const folderPickerRange = useMemo(() => ["全部分组", ...folders.map((f) => f.name)], [folders]);

  const loadItems = useCallback(async (nextPage: number, append: boolean, filters: ItemFilter) => {
    if (!getAccessToken()) {
      void Taro.redirectTo({ url: "/pages/login/index" });
      return;
    }
    setLoading(true);
    try {
      const res = await listItems(api, filters, nextPage, 20);
      setHasMore(res.has_more);
      setPage(nextPage);
      setTotal(res.total);
      setItems((prev) => (append ? [...prev, ...res.items] : res.items));
    } catch {
      Taro.showToast({ title: "加载失败", icon: "none" });
    } finally {
      setLoading(false);
    }
  }, []);

  const currentFilters = useCallback((): ItemFilter => {
    return buildItemFilters(
      search.trim(),
      typePickerIndex,
      sortPickerIndex,
      needsWashOnly,
      favoriteOnly,
      folderPickerIndex,
      folders,
    );
  }, [search, typePickerIndex, sortPickerIndex, needsWashOnly, favoriteOnly, folderPickerIndex, folders]);

  const reloadFirstPage = useCallback(() => {
    void loadItems(1, false, currentFilters());
  }, [loadItems, currentFilters]);

  useLoad((opts) => {
    const raw = opts as { item?: string };
    const id = raw.item || Taro.getCurrentInstance().router?.params?.item;
    if (id) {
      setPendingDeepLinkItemId(id);
      deepLinkOpened.current = false;
    }
  });

  const maybeOpenDeepLink = useCallback(async () => {
    if (!pendingDeepLinkItemId || deepLinkOpened.current || !getAccessToken()) return;
    deepLinkOpened.current = true;
    const id = pendingDeepLinkItemId;
    setPendingDeepLinkItemId(null);
    try {
      const it = await getItem(api, id);
      const typeLine = `${clothingTypeZh(it.type)}${it.subtype ? ` · ${clothingSubtypeZh(it.subtype)}` : ""}`;
      const worn = wornAgoLabelZh(it.last_worn_at);
      const lines = [typeLine, worn, `穿着 ${it.wear_count} 次`, `状态：${it.status}`].filter(Boolean);
      const res = await Taro.showModal({
        title: it.name || clothingTypeZh(it.type),
        content: lines.join("\n"),
        confirmText: it.status === "error" ? "重新分析" : "知道了",
        cancelText: it.status === "error" ? "关闭" : undefined,
        showCancel: it.status === "error",
      });
      if (it.status === "error" && res.confirm) {
        await analyzeItem(api, it.id);
        Taro.showToast({ title: "已提交分析", icon: "success" });
        reloadFirstPage();
      }
    } catch {
      Taro.showToast({ title: "无法打开单品", icon: "none" });
    }
  }, [pendingDeepLinkItemId, reloadFirstPage]);

  useDidShow(() => {
    const run = async () => {
      if (!getAccessToken()) {
        void Taro.redirectTo({ url: "/pages/login/index" });
        return;
      }
      let folderList: Folder[] = [];
      try {
        folderList = await listFolders(api);
        setFolders(folderList);
      } catch {
        setFolders([]);
      }
      const filters = buildItemFilters(
        search.trim(),
        typePickerIndex,
        sortPickerIndex,
        needsWashOnly,
        favoriteOnly,
        folderPickerIndex,
        folderList,
      );
      await loadItems(1, false, filters);
      await maybeOpenDeepLink();
    };
    void run();
  });

  const applySearch = () => {
    setSearch(searchDraft);
    const f = buildItemFilters(
      searchDraft.trim(),
      typePickerIndex,
      sortPickerIndex,
      needsWashOnly,
      favoriteOnly,
      folderPickerIndex,
      folders,
    );
    void loadItems(1, false, f);
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      void loadItems(page + 1, true, currentFilters());
    }
  };

  const toggleFavorite = async (it: Item) => {
    try {
      await api.patch<Item>(`/items/${it.id}`, { favorite: !it.favorite });
      setItems((prev) => prev.map((x) => (x.id === it.id ? { ...x, favorite: !x.favorite } : x)));
    } catch {
      Taro.showToast({ title: "更新失败", icon: "none" });
    }
  };

  const onRetryAnalyze = async (it: Item) => {
    try {
      await analyzeItem(api, it.id);
      Taro.showToast({ title: "已提交分析", icon: "success" });
      reloadFirstPage();
    } catch {
      Taro.showToast({ title: "提交失败", icon: "none" });
    }
  };

  const onTypeChange = (e: { detail: { value: string } }) => {
    const idx = Number(e.detail.value);
    setTypePickerIndex(idx);
    void loadItems(
      1,
      false,
      buildItemFilters(search.trim(), idx, sortPickerIndex, needsWashOnly, favoriteOnly, folderPickerIndex, folders),
    );
  };

  const onSortChange = (e: { detail: { value: string } }) => {
    const idx = Number(e.detail.value);
    setSortPickerIndex(idx);
    void loadItems(
      1,
      false,
      buildItemFilters(search.trim(), typePickerIndex, idx, needsWashOnly, favoriteOnly, folderPickerIndex, folders),
    );
  };

  const onFolderChange = (e: { detail: { value: string } }) => {
    const idx = Number(e.detail.value);
    setFolderPickerIndex(idx);
    void loadItems(
      1,
      false,
      buildItemFilters(search.trim(), typePickerIndex, sortPickerIndex, needsWashOnly, favoriteOnly, idx, folders),
    );
  };

  const toggleNeedsWash = () => {
    const next = !needsWashOnly;
    setNeedsWashOnly(next);
    void loadItems(
      1,
      false,
      buildItemFilters(search.trim(), typePickerIndex, sortPickerIndex, next, favoriteOnly, folderPickerIndex, folders),
    );
  };

  const toggleFavoriteOnly = () => {
    const next = !favoriteOnly;
    setFavoriteOnly(next);
    void loadItems(
      1,
      false,
      buildItemFilters(search.trim(), typePickerIndex, sortPickerIndex, needsWashOnly, next, folderPickerIndex, folders),
    );
  };

  return (
    <View className="page">
      <View className="toolbar">
        <Input
          className="search"
          placeholder="搜索名称或备注"
          value={searchDraft}
          onInput={(e) => setSearchDraft(e.detail.value)}
          onConfirm={applySearch}
        />
        <Button className="search-btn" size="mini" onClick={applySearch}>
          搜索
        </Button>
      </View>

      <Button className="filter-toggle" size="mini" onClick={() => setFiltersOpen((v) => !v)}>
        {filtersOpen ? "收起筛选" : "筛选与排序"}
      </Button>

      {filtersOpen ? (
        <View className="filters">
          <Text className="filter-label">类型</Text>
          <Picker mode="selector" range={TYPE_PICKER_RANGE} value={typePickerIndex} onChange={onTypeChange}>
            <View className="picker-display">{TYPE_PICKER_RANGE[typePickerIndex]}</View>
          </Picker>

          <Text className="filter-label">排序</Text>
          <Picker mode="selector" range={SORT_PICKER_RANGE} value={sortPickerIndex} onChange={onSortChange}>
            <View className="picker-display">{SORT_PICKER_RANGE[sortPickerIndex]}</View>
          </Picker>

          {folders.length > 0 ? (
            <>
              <Text className="filter-label">分组</Text>
              <Picker mode="selector" range={folderPickerRange} value={folderPickerIndex} onChange={onFolderChange}>
                <View className="picker-display">{folderPickerRange[folderPickerIndex]}</View>
              </Picker>
            </>
          ) : null}

          <View className="chips">
            <Button className={`chip ${needsWashOnly ? "chip-on" : ""}`} size="mini" onClick={toggleNeedsWash}>
              待洗
            </Button>
            <Button className={`chip ${favoriteOnly ? "chip-on" : ""}`} size="mini" onClick={toggleFavoriteOnly}>
              仅收藏
            </Button>
          </View>
        </View>
      ) : null}

      <Text className="total-line">共 {total} 件（不含归档）</Text>

      <ScrollView scrollY className="scroll" onScrollToLower={loadMore} lowerThreshold={80}>
        <View className="grid">
          {items.map((it) => {
            const typeLabel = clothingTypeZh(it.type);
            const sub = it.subtype ? clothingSubtypeZh(it.subtype) : "";
            const wornLabel = wornAgoLabelZh(it.last_worn_at);
            const processing = it.status === "processing";
            const err = it.status === "error";

            return (
              <View className="cell" key={it.id}>
                <View className="card">
                  <View className="thumb-wrap">
                    {it.thumbnail_url || it.image_url ? (
                      <Image
                        className="thumb"
                        mode="aspectFill"
                        src={resolveMediaUrl(it.thumbnail_url || it.image_url)}
                      />
                    ) : (
                      <Text className="thumb-placeholder">{typeLabel}</Text>
                    )}
                    {it.favorite ? <Text className="fav-dot">♥</Text> : null}
                    {it.needs_wash ? <Text className="wash-badge">洗</Text> : null}
                    {processing ? (
                      <View className="overlay">
                        <Text className="overlay-text">分析中…</Text>
                      </View>
                    ) : null}
                    {err ? (
                      <View className="overlay overlay-err">
                        <Text className="overlay-text">分析失败</Text>
                        <Button className="retry-mini" size="mini" onClick={() => void onRetryAnalyze(it)}>
                          重试
                        </Button>
                      </View>
                    ) : null}
                  </View>
                  <View className="meta">
                    <Text className="name">{it.name || typeLabel}</Text>
                    <Text className="sub">
                      {typeLabel}
                      {sub ? ` · ${sub}` : ""}
                    </Text>
                    {wornLabel ? <Text className="worn">{wornLabel}</Text> : null}
                    {it.wear_count > 0 && !wornLabel ? <Text className="worn">穿着 {it.wear_count} 次</Text> : null}
                    <Button className="fav-btn" size="mini" onClick={() => void toggleFavorite(it)}>
                      {it.favorite ? "取消收藏" : "收藏"}
                    </Button>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
        <View className="footer">{hasMore ? (loading ? "加载中…" : "上拉加载更多") : "没有更多了"}</View>
      </ScrollView>
    </View>
  );
}
