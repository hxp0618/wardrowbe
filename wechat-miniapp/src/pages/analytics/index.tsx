import { useCallback, useState } from "react";
import { ScrollView, Text, View } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";

import type { AnalyticsData } from "@wardrowbe/shared-services";
import { getAnalytics } from "@wardrowbe/shared-services";

import { api } from "@/lib/api";
import { getAccessToken } from "@/lib/auth-storage";

import "./index.scss";

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!getAccessToken()) {
      void Taro.redirectTo({ url: "/pages/login/index" });
      return;
    }
    setLoading(true);
    try {
      const d = await getAnalytics(api, 30);
      setData(d);
    } catch {
      Taro.showToast({ title: "加载失败", icon: "none" });
    } finally {
      setLoading(false);
    }
  }, []);

  useDidShow(() => {
    void load();
  });

  const w = data?.wardrobe;

  return (
    <View className="page">
      <ScrollView scrollY style={{ height: "calc(100vh - 40px)" }}>
        {!data && loading ? <Text className="empty">加载中…</Text> : null}
        {w ? (
          <>
            <View className="stat-grid">
              <View className="stat">
                <Text className="stat-value">{w.total_items}</Text>
                <Text className="stat-label">衣物总数</Text>
              </View>
              <View className="stat">
                <Text className="stat-value">{w.total_outfits}</Text>
                <Text className="stat-label">穿搭总数</Text>
              </View>
              <View className="stat">
                <Text className="stat-value">{w.outfits_this_week}</Text>
                <Text className="stat-label">本周穿搭</Text>
              </View>
              <View className="stat">
                <Text className="stat-value">{w.total_wears}</Text>
                <Text className="stat-label">穿着次数</Text>
              </View>
            </View>
            {w.acceptance_rate != null ? (
              <View className="section">
                <Text className="section-title">接受率</Text>
                <Text className="insight">{Math.round(w.acceptance_rate * 100) / 100}%</Text>
              </View>
            ) : null}
          </>
        ) : null}

        {data && data.insights.length > 0 ? (
          <View className="section">
            <Text className="section-title">洞察</Text>
            {data.insights.map((line, i) => (
              <View className="insight" key={i}>
                <Text>{line}</Text>
              </View>
            ))}
          </View>
        ) : data && !loading ? (
          <Text className="empty">暂无洞察数据</Text>
        ) : null}
      </ScrollView>
    </View>
  );
}
