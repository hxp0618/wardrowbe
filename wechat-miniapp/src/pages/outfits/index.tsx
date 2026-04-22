import { useCallback, useState } from "react";
import { Image, ScrollView, Text, View } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";

import type { Outfit } from "@wardrowbe/shared-domain";
import { listOutfits } from "@wardrowbe/shared-services";

import { api } from "@/lib/api";
import { getAccessToken } from "@/lib/auth-storage";
import { resolveMediaUrl } from "@/lib/images";

import "./index.scss";

type Tab = "all" | "pending" | "accepted";

export default function OutfitsPage() {
  const [tab, setTab] = useState<Tab>("all");
  const [list, setList] = useState<Outfit[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const filtersForTab = (t: Tab) => {
    if (t === "pending") return { status: "pending" };
    if (t === "accepted") return { status: "accepted" };
    return {};
  };

  const load = useCallback(
    async (p: number, append: boolean, t: Tab) => {
      if (!getAccessToken()) {
        void Taro.redirectTo({ url: "/pages/login/index" });
        return;
      }
      setLoading(true);
      try {
        const res = await listOutfits(api, filtersForTab(t), p, 15);
        setHasMore(res.has_more);
        setPage(p);
        setList((prev) => (append ? [...prev, ...res.outfits] : res.outfits));
      } catch {
        Taro.showToast({ title: "加载失败", icon: "none" });
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useDidShow(() => {
    void load(1, false, tab);
  });

  const changeTab = (t: Tab) => {
    setTab(t);
    void load(1, false, t);
  };

  return (
    <View className="page">
      <View className="tabs">
        <View className={`tab ${tab === "all" ? "tab-on" : ""}`} onClick={() => changeTab("all")}>
          <Text>全部</Text>
        </View>
        <View className={`tab ${tab === "pending" ? "tab-on" : ""}`} onClick={() => changeTab("pending")}>
          <Text>待处理</Text>
        </View>
        <View className={`tab ${tab === "accepted" ? "tab-on" : ""}`} onClick={() => changeTab("accepted")}>
          <Text>已接受</Text>
        </View>
      </View>

      <ScrollView
        scrollY
        style={{ height: "calc(100vh - 140px)" }}
        onScrollToLower={() => !loading && hasMore && void load(page + 1, true, tab)}
        lowerThreshold={100}
      >
        {list.map((o) => (
          <View className="card" key={o.id}>
            <View className="imgs">
              {o.items.slice(0, 6).map((it) => (
                <Image
                  key={it.id}
                  className="mini"
                  mode="aspectFill"
                  src={resolveMediaUrl(it.thumbnail_url || it.image_url)}
                />
              ))}
            </View>
            <Text className="line1">{o.occasion}</Text>
            <Text className="line2">
              {o.scheduled_for || "—"} · {o.status}
            </Text>
          </View>
        ))}
        <View className="footer">{hasMore ? (loading ? "加载中…" : "上拉加载更多") : "没有更多了"}</View>
      </ScrollView>
    </View>
  );
}
