import { useCallback, useState } from "react";
import { Button, ScrollView, Text, View } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";

import type { LearningInsightsData, StyleInsight } from "@wardrowbe/shared-services";
import {
  generateLearningInsights,
  getLearningInsights,
  recomputeLearning,
} from "@wardrowbe/shared-services";

import { api } from "@/lib/api";
import { getAccessToken } from "@/lib/auth-storage";

import "./index.scss";

export default function LearningPage() {
  const [data, setData] = useState<LearningInsightsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!getAccessToken()) {
      void Taro.redirectTo({ url: "/pages/login/index" });
      return;
    }
    setLoading(true);
    try {
      setData(await getLearningInsights(api));
    } catch {
      Taro.showToast({ title: "加载失败", icon: "none" });
    } finally {
      setLoading(false);
    }
  }, []);

  useDidShow(() => {
    void load();
  });

  const onRecompute = async () => {
    setBusy(true);
    try {
      await recomputeLearning(api);
      Taro.showToast({ title: "已重新计算", icon: "success" });
      void load();
    } catch {
      Taro.showToast({ title: "失败", icon: "none" });
    } finally {
      setBusy(false);
    }
  };

  const onGenerate = async () => {
    setBusy(true);
    try {
      const insights: StyleInsight[] = await generateLearningInsights(api);
      Taro.showToast({ title: `生成 ${insights.length} 条`, icon: "success" });
      void load();
    } catch {
      Taro.showToast({ title: "失败", icon: "none" });
    } finally {
      setBusy(false);
    }
  };

  const p = data?.profile;

  return (
    <View className="page">
      <View className="actions">
        <Button className="action-btn" size="mini" loading={busy} onClick={() => void onRecompute()}>
          重新计算画像
        </Button>
        <Button className="action-btn" size="mini" loading={busy} onClick={() => void onGenerate()}>
          生成洞察
        </Button>
      </View>

      <ScrollView scrollY style={{ height: "calc(100vh - 200px)" }}>
        {loading && !data ? <Text className="empty">加载中…</Text> : null}
        {p ? (
          <View className="profile">
            <Text className="line">反馈条数：{p.feedback_count}</Text>
            <Text className="line">已评分穿搭：{p.outfits_rated}</Text>
            <Text className="line">
              整体接受率：
              {p.overall_acceptance_rate != null ? `${Math.round(p.overall_acceptance_rate * 100) / 100}%` : "—"}
            </Text>
            <Text className="line">
              平均评分：{p.average_rating != null ? p.average_rating.toFixed(1) : "—"}
            </Text>
          </View>
        ) : null}

        {data && data.insights.length > 0 ? (
          <>
            <Text className="section-title">风格洞察</Text>
            {data.insights.map((ins) => (
              <View className="card" key={ins.id}>
                <Text className="card-title">{ins.title}</Text>
                <Text className="card-desc">{ins.description}</Text>
              </View>
            ))}
          </>
        ) : data && !loading ? (
          <Text className="empty">暂无风格洞察，可点击「生成洞察」</Text>
        ) : null}
      </ScrollView>
    </View>
  );
}
