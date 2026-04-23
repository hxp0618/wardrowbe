import { useCallback, useMemo, useState } from "react";
import { Button, Image, ScrollView, Text, View } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";

import type { Outfit } from "@wardrowbe/shared-domain";
import { listOutfitsForMonth } from "@wardrowbe/shared-services";

import { api } from "@/lib/api";
import { getAccessToken } from "@/lib/auth-storage";
import { resolveMediaUrl } from "@/lib/images";

import "./index.scss";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export default function HistoryPage() {
  const now = useMemo(() => new Date(), []);
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!getAccessToken()) {
      void Taro.redirectTo({ url: "/pages/login/index" });
      return;
    }
    setLoading(true);
    try {
      const res = await listOutfitsForMonth(api, year, month);
      const sorted = [...res.outfits].sort((a, b) => {
        const da = a.scheduled_for || "";
        const db = b.scheduled_for || "";
        return db.localeCompare(da);
      });
      setOutfits(sorted);
    } catch {
      Taro.showToast({ title: "加载失败", icon: "none" });
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useDidShow(() => {
    void load();
  });

  const prevMonth = () => {
    if (month <= 1) {
      setYear((y) => y - 1);
      setMonth(12);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (month >= 12) {
      setYear((y) => y + 1);
      setMonth(1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  return (
    <View className="page">
      <View className="month-row">
        <Button className="nav-btn" size="mini" onClick={prevMonth}>
          上月
        </Button>
        <Text className="month-text">
          {year} 年 {pad(month)} 月
        </Text>
        <Button className="nav-btn" size="mini" onClick={nextMonth}>
          下月
        </Button>
      </View>

      <ScrollView scrollY style={{ height: "calc(100vh - 200px)" }}>
        {loading && outfits.length === 0 ? (
          <Text className="empty">加载中…</Text>
        ) : outfits.length === 0 ? (
          <Text className="empty">本月暂无穿搭记录</Text>
        ) : (
          outfits.map((o) => (
            <View className="card" key={o.id}>
              <View className="thumbs">
                {o.items.slice(0, 6).map((it) => (
                  <Image
                    key={it.id}
                    className="mini"
                    mode="aspectFill"
                    src={resolveMediaUrl(it.thumbnail_url || it.image_url)}
                  />
                ))}
              </View>
              <Text className="title">
                {o.scheduled_for || "—"} · {o.occasion}
              </Text>
              <Text className="sub">{o.status}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
