import { useCallback, useState } from "react";
import { Button, Image, Text, View } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";

import { api } from "@/lib/api";
import { clearAccessToken, getAccessToken } from "@/lib/auth-storage";
import { resolveMediaUrl } from "@/lib/images";
import { fetchSessionUser, type SessionUser } from "@/lib/session";
import {
  acceptOutfit,
  getCurrentWeather,
  listItems,
  listPendingOutfits,
  rejectOutfit,
} from "@wardrowbe/shared-services";

import "./index.scss";

const OCCASION_LABELS: Record<string, string> = {
  casual: "休闲",
  office: "办公",
  formal: "正式",
  date: "约会",
  sporty: "运动",
  outdoor: "户外",
};

export default function DashboardPage() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [weather, setWeather] = useState<{ temperature: number; feels_like: number; condition: string } | null>(
    null,
  );
  const [weatherHint, setWeatherHint] = useState<string | null>(null);
  const [pending, setPending] = useState<
    Array<{ id: string; occasion: string; scheduled_for: string | null; items: Array<{ id: string; thumbnail_url?: string; name: string | null; type: string }> }>
  >([]);
  const [itemCount, setItemCount] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!getAccessToken()) {
      void Taro.redirectTo({ url: "/pages/login/index" });
      return;
    }
    setBusy(true);
    try {
      const u = await fetchSessionUser();
      setUser(u);
      try {
        const w = await getCurrentWeather(api);
        setWeather({
          temperature: w.temperature,
          feels_like: w.feels_like,
          condition: w.condition,
        });
        setWeatherHint(null);
      } catch {
        setWeather(null);
        setWeatherHint("未设置位置或无法加载天气");
      }
      const pend = await listPendingOutfits(api, 3);
      setPending(pend.outfits);
      const items = await listItems(api, {}, 1, 1);
      setItemCount(items.total);
    } catch {
      Taro.showToast({ title: "加载失败", icon: "none" });
    } finally {
      setBusy(false);
    }
  }, []);

  useDidShow(() => {
    void load();
  });

  const logout = useCallback(() => {
    clearAccessToken();
    try {
      Taro.removeStorageSync("wardrowbe_access_token");
    } catch {
      /* ignore */
    }
    void Taro.reLaunch({ url: "/pages/login/index" });
  }, []);

  const onAccept = async (id: string) => {
    try {
      await acceptOutfit(api, id);
      Taro.showToast({ title: "已接受", icon: "success" });
      void load();
    } catch {
      Taro.showToast({ title: "操作失败", icon: "none" });
    }
  };

  const onReject = async (id: string) => {
    try {
      await rejectOutfit(api, id);
      Taro.showToast({ title: "已拒绝", icon: "success" });
      void load();
    } catch {
      Taro.showToast({ title: "操作失败", icon: "none" });
    }
  };

  return (
    <View className="page">
      <View className="card">
        <Text className="card-title">你好{user?.display_name ? `，${user.display_name}` : ""}</Text>
        <Text className="muted">{user?.email || "…"}</Text>
        {itemCount !== null ? (
          <Text className="muted" style={{ marginTop: 12 }}>
            衣橱共 {itemCount} 件
          </Text>
        ) : null}
      </View>

      <View className="card">
        <Text className="card-title">今日天气</Text>
        {weather ? (
          <>
            <View className="row">
              <Text className="temp">{Math.round(weather.temperature)}°</Text>
              <Text className="muted">体感 {Math.round(weather.feels_like)}°</Text>
            </View>
            <Text className="muted">{weather.condition}</Text>
          </>
        ) : (
          <Text className="muted">{weatherHint || "加载中…"}</Text>
        )}
        <Button className="btn" onClick={() => Taro.switchTab({ url: "/pages/suggest/index" })}>
          去获取穿搭推荐
        </Button>
      </View>

      <View className="link-row">
        <Button className="link-btn" size="mini" onClick={() => void Taro.navigateTo({ url: "/pages/history/index" })}>
          穿搭历史
        </Button>
        <Button className="link-btn" size="mini" onClick={() => void Taro.navigateTo({ url: "/pages/analytics/index" })}>
          数据分析
        </Button>
        <Button className="link-btn" size="mini" onClick={() => void Taro.navigateTo({ url: "/pages/learning/index" })}>
          学习洞察
        </Button>
      </View>

      <View className="card">
        <Text className="card-title">待处理穿搭</Text>
        {pending.length === 0 ? (
          <Text className="muted">暂无待处理推荐</Text>
        ) : (
          pending.map((o) => (
            <View className="pending-item" key={o.id}>
              <View className="thumb">
                {o.items[0]?.thumbnail_url ? (
                  <Image
                    style={{ width: "100%", height: "100%", borderRadius: 12 }}
                    mode="aspectFill"
                    src={resolveMediaUrl(o.items[0].thumbnail_url)}
                  />
                ) : null}
              </View>
              <View className="pending-meta">
                <Text className="pending-title">{OCCASION_LABELS[o.occasion] || o.occasion}</Text>
                <Text className="pending-sub">
                  {o.scheduled_for ? o.scheduled_for : "Lookbook"}
                </Text>
              </View>
              <View className="icon-btns">
                <Button className="icon-btn reject" size="mini" onClick={() => void onReject(o.id)}>
                  ✕
                </Button>
                <Button className="icon-btn accept" size="mini" onClick={() => void onAccept(o.id)}>
                  ✓
                </Button>
              </View>
            </View>
          ))
        )}
      </View>

      <Button className="logout" loading={busy} onClick={logout}>
        退出登录
      </Button>
    </View>
  );
}
