import { useCallback, useState } from "react";
import { Button, Image, Input, Picker, Text, View } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";

import type { Outfit } from "@wardrowbe/shared-domain";
import {
  acceptOutfit,
  getPreferences,
  rejectOutfit,
  suggestOutfit,
} from "@wardrowbe/shared-services";

import { api } from "@/lib/api";
import { getAccessToken } from "@/lib/auth-storage";
import { resolveMediaUrl } from "@/lib/images";

import "./index.scss";

const OCCASIONS = [
  { value: "casual", label: "休闲" },
  { value: "office", label: "办公" },
  { value: "formal", label: "正式" },
  { value: "date", label: "约会" },
  { value: "sporty", label: "运动" },
  { value: "outdoor", label: "户外" },
];

function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function SuggestPage() {
  const [occIndex, setOccIndex] = useState(0);
  const [targetDate, setTargetDate] = useState(todayISO());
  const [loading, setLoading] = useState(false);
  const [outfit, setOutfit] = useState<Outfit | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const occasion = OCCASIONS[occIndex]?.value || "casual";

  const loadDefaultOccasion = useCallback(async () => {
    if (!getAccessToken()) return;
    try {
      const p = await getPreferences(api);
      const idx = OCCASIONS.findIndex((o) => o.value === p.default_occasion);
      if (idx >= 0) setOccIndex(idx);
    } catch {
      /* ignore */
    }
  }, []);

  useDidShow(() => {
    void loadDefaultOccasion();
  });

  const runSuggest = async () => {
    if (!getAccessToken()) {
      void Taro.redirectTo({ url: "/pages/login/index" });
      return;
    }
    setLoading(true);
    setOutfit(null);
    setErr(null);
    try {
      const o = await suggestOutfit(api, {
        occasion,
        target_date: targetDate.trim() || undefined,
      });
      setOutfit(o);
      Taro.showToast({ title: "已生成", icon: "success" });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "生成失败";
      setErr(msg);
      Taro.showToast({ title: "生成失败", icon: "none" });
    } finally {
      setLoading(false);
    }
  };

  const onAccept = async () => {
    if (!outfit) return;
    try {
      await acceptOutfit(api, outfit.id);
      setOutfit(null);
      Taro.showToast({ title: "已接受", icon: "success" });
    } catch {
      Taro.showToast({ title: "操作失败", icon: "none" });
    }
  };

  const onReject = async () => {
    if (!outfit) return;
    try {
      await rejectOutfit(api, outfit.id);
      setOutfit(null);
      Taro.showToast({ title: "已拒绝", icon: "success" });
    } catch {
      Taro.showToast({ title: "操作失败", icon: "none" });
    }
  };

  return (
    <View className="page">
      <Text className="title">穿搭推荐</Text>
      <Text className="hint">与 Web 相同接口 POST /outfits/suggest（含 target_date）。</Text>

      <Text className="label">场合</Text>
      <Picker mode="selector" range={OCCASIONS} rangeKey="label" value={occIndex} onChange={(e) => setOccIndex(Number(e.detail.value))}>
        <View className="picker-box">{OCCASIONS[occIndex]?.label}</View>
      </Picker>

      <Text className="label">目标日期 (YYYY-MM-DD)</Text>
      <Input className="input" value={targetDate} onInput={(e) => setTargetDate(e.detail.value)} />

      {err ? <Text className="error-text">{err}</Text> : null}

      <Button className="btn" loading={loading} onClick={() => void runSuggest()}>
        生成推荐
      </Button>

      {outfit ? (
        <View className="result">
          <Text className="result-title">{outfit.reasoning || "推荐搭配"}</Text>
          <View className="row-imgs">
            {outfit.items.map((it) => (
              <Image
                key={it.id}
                className="mini"
                mode="aspectFill"
                src={resolveMediaUrl(it.thumbnail_url || it.image_url)}
              />
            ))}
          </View>
          <View className="suggest-actions">
            <Button className="btn-secondary" size="mini" onClick={() => void onReject()}>
              拒绝
            </Button>
            <Button className="btn-accept-inline" size="mini" onClick={() => void onAccept()}>
              接受
            </Button>
          </View>
        </View>
      ) : null}
    </View>
  );
}
