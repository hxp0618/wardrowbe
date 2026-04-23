import { useEffect, useState } from "react";
import { Button, Input, Picker, Text, View } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";

import { createStudioOutfit, getPreferences } from "@wardrowbe/shared-services";

import { api } from "@/lib/api";
import { getAccessToken } from "@/lib/auth-storage";

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

export default function OutfitNewPage() {
  const [name, setName] = useState("");
  const [occasion, setOccasion] = useState("casual");
  const [occIndex, setOccIndex] = useState(0);
  const [itemIdsRaw, setItemIdsRaw] = useState("");
  const [busy, setBusy] = useState(false);
  const [scheduledFor, setScheduledFor] = useState(todayISO());

  useDidShow(() => {
    void (async () => {
      if (!getAccessToken()) return;
      try {
        const p = await getPreferences(api);
        const idx = OCCASIONS.findIndex((o) => o.value === p.default_occasion);
        if (idx >= 0) {
          setOccIndex(idx);
          setOccasion(OCCASIONS[idx].value);
        }
      } catch {
        /* ignore */
      }
    })();
  });

  useEffect(() => {
    setOccasion(OCCASIONS[occIndex]?.value || "casual");
  }, [occIndex]);

  const submit = async () => {
    if (!getAccessToken()) {
      void Taro.redirectTo({ url: "/pages/login/index" });
      return;
    }
    const ids = itemIdsRaw
      .split(/[\s,，]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (ids.length === 0) {
      Taro.showToast({ title: "请填写衣物 ID", icon: "none" });
      return;
    }
    setBusy(true);
    try {
      const o = await createStudioOutfit(api, {
        items: ids,
        occasion,
        name: name.trim() || undefined,
        scheduled_for: scheduledFor || null,
      });
      Taro.showToast({ title: "已创建", icon: "success" });
      void Taro.redirectTo({ url: `/pages/outfit-detail/index?id=${o.id}` });
    } catch {
      Taro.showToast({ title: "创建失败", icon: "none" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <View className="page">
      <Text className="hint">
        与 Web「手动/Studio 穿搭」相同接口 POST /outfits/studio。请填写衣橱中已有衣物的 UUID（可在 Web 详情或开发者工具网络请求中查看）。
      </Text>
      <Text className="label">名称（可选）</Text>
      <Input className="input" value={name} onInput={(e) => setName(e.detail.value)} />
      <Text className="label">场合</Text>
      <Picker mode="selector" range={OCCASIONS} rangeKey="label" value={occIndex} onChange={(e) => setOccIndex(Number(e.detail.value))}>
        <View className="input">{OCCASIONS[occIndex]?.label}</View>
      </Picker>
      <Text className="label">计划日期 (YYYY-MM-DD)</Text>
      <Input className="input" value={scheduledFor} onInput={(e) => setScheduledFor(e.detail.value)} />
      <Text className="label">衣物 ID（逗号或空格分隔）</Text>
      <Input className="input" placeholder="uuid1 uuid2 ..." value={itemIdsRaw} onInput={(e) => setItemIdsRaw(e.detail.value)} />
      <Button className="btn" loading={busy} onClick={() => void submit()}>
        创建穿搭
      </Button>
    </View>
  );
}
