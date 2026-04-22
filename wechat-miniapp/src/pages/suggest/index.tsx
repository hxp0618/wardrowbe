import { useState } from "react";
import { Button, Image, Text, View } from "@tarojs/components";
import Taro from "@tarojs/taro";

import type { Outfit } from "@wardrowbe/shared-domain";
import { suggestOutfit } from "@wardrowbe/shared-services";

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

export default function SuggestPage() {
  const [occasion, setOccasion] = useState("casual");
  const [loading, setLoading] = useState(false);
  const [outfit, setOutfit] = useState<Outfit | null>(null);

  const runSuggest = async () => {
    if (!getAccessToken()) {
      void Taro.redirectTo({ url: "/pages/login/index" });
      return;
    }
    setLoading(true);
    setOutfit(null);
    try {
      const o = await suggestOutfit(api, { occasion });
      setOutfit(o);
      Taro.showToast({ title: "已生成", icon: "success" });
    } catch {
      Taro.showToast({ title: "生成失败", icon: "none" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="page">
      <Text className="title">穿搭推荐</Text>
      <Text className="hint">选择场合后生成推荐（与 Web 端相同 /outfits/suggest 接口）。</Text>

      <View className="chips">
        {OCCASIONS.map((o) => (
          <View
            key={o.value}
            className={`chip ${occasion === o.value ? "chip-active" : ""}`}
            onClick={() => setOccasion(o.value)}
          >
            <Text>{o.label}</Text>
          </View>
        ))}
      </View>

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
        </View>
      ) : null}
    </View>
  );
}
