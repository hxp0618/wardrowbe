import { useCallback, useState } from "react";
import { Image, ScrollView, Text, View } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";

import type { Pairing } from "@wardrowbe/shared-domain";
import { listPairings } from "@wardrowbe/shared-services";

import { api } from "@/lib/api";
import { getAccessToken } from "@/lib/auth-storage";
import { resolveMediaUrl } from "@/lib/images";

import "./index.scss";

export default function PairingsPage() {
  const [list, setList] = useState<Pairing[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const load = useCallback(
    async (p: number, append: boolean) => {
      if (!getAccessToken()) {
        void Taro.redirectTo({ url: "/pages/login/index" });
        return;
      }
      setLoading(true);
      try {
        const res = await listPairings(api, p, 15);
        setHasMore(res.has_more);
        setPage(p);
        setList((prev) => (append ? [...prev, ...res.pairings] : res.pairings));
      } catch {
        Taro.showToast({ title: "加载失败", icon: "none" });
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useDidShow(() => {
    void load(1, false);
  });

  return (
    <View className="page">
      <ScrollView scrollY style={{ height: "calc(100vh - 40px)" }} onScrollToLower={() => !loading && hasMore && void load(page + 1, true)} lowerThreshold={100}>
        {list.map((p) => (
          <View className="card" key={p.id}>
            <View className="row">
              {p.source_item?.thumbnail_url || p.source_item?.image_url ? (
                <Image
                  className="thumb"
                  mode="aspectFill"
                  src={resolveMediaUrl(p.source_item?.thumbnail_url || p.source_item?.image_url)}
                />
              ) : (
                <View className="thumb" />
              )}
              <View className="meta">
                <Text className="title">{p.source_item?.name || p.source_item?.type || "搭配"}</Text>
                <Text className="sub">{p.items.length} 件单品</Text>
              </View>
            </View>
          </View>
        ))}
        <View className="footer">{hasMore ? (loading ? "加载中…" : "上拉加载更多") : "没有更多了"}</View>
      </ScrollView>
    </View>
  );
}
