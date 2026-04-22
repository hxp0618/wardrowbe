import { useCallback, useState } from "react";
import { Button, Image, Input, ScrollView, Text, View } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";

import type { Item } from "@wardrowbe/shared-domain";
import { listItems } from "@wardrowbe/shared-services";

import { api } from "@/lib/api";
import { getAccessToken } from "@/lib/auth-storage";
import { resolveMediaUrl } from "@/lib/images";

import "./index.scss";

export default function WardrobePage() {
  const [items, setItems] = useState<Item[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchPage = useCallback(
    async (nextPage: number, append: boolean) => {
      if (!getAccessToken()) {
        void Taro.redirectTo({ url: "/pages/login/index" });
        return;
      }
      setLoading(true);
      try {
        const res = await listItems(api, { search: search.trim() || undefined }, nextPage, 20);
        setHasMore(res.has_more);
        setPage(nextPage);
        setItems((prev) => (append ? [...prev, ...res.items] : res.items));
      } catch {
        Taro.showToast({ title: "加载失败", icon: "none" });
      } finally {
        setLoading(false);
      }
    },
    [search],
  );

  useDidShow(() => {
    void fetchPage(1, false);
  });

  const onSearch = () => {
    void fetchPage(1, false);
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      void fetchPage(page + 1, true);
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

  return (
    <View className="page">
      <Input
        className="search"
        placeholder="搜索名称或备注"
        value={search}
        onInput={(e) => setSearch(e.detail.value)}
        onConfirm={onSearch}
      />
      <Button size="mini" onClick={onSearch} style={{ marginBottom: 16 }}>
        搜索
      </Button>

      <ScrollView scrollY style={{ height: "calc(100vh - 220px)" }} onScrollToLower={loadMore} lowerThreshold={80}>
        <View className="grid">
          {items.map((it) => (
            <View className="cell" key={it.id}>
              <View className="card">
                <View className="thumb-wrap">
                  {it.thumbnail_url || it.image_url ? (
                    <Image
                      className="thumb"
                      mode="aspectFill"
                      src={resolveMediaUrl(it.thumbnail_url || it.image_url)}
                    />
                  ) : null}
                </View>
                <View className="meta">
                  <Text className="name">{it.name || it.type}</Text>
                  <Text className="sub">{it.favorite ? "已收藏 · 点取消" : "点星收藏"}</Text>
                  <Button size="mini" onClick={() => void toggleFavorite(it)}>
                    {it.favorite ? "取消收藏" : "收藏"}
                  </Button>
                </View>
              </View>
            </View>
          ))}
        </View>
        <View className="footer">{hasMore ? (loading ? "加载中…" : "上拉加载更多") : "没有更多了"}</View>
      </ScrollView>
    </View>
  );
}
