import { useCallback, useMemo, useState } from "react";
import { Button, Image, ScrollView, Text, View } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";

import type { Outfit } from "@wardrowbe/shared-domain";
import { OCCASIONS } from "@wardrowbe/shared-domain";
import {
  acceptOutfit,
  getAnalytics,
  getCurrentWeather,
  getMyFamily,
  getPreferences,
  listItems,
  listNotificationSettings,
  listPendingOutfits,
  listSchedules,
  rejectOutfit,
  type NotificationSettings,
  type Schedule,
} from "@wardrowbe/shared-services";

import { api } from "@/lib/api";
import { clearAccessToken, getAccessToken } from "@/lib/auth-storage";
import { resolveMediaUrl } from "@/lib/images";
import { fetchSessionUser, type SessionUser } from "@/lib/session";
import { displayValue, tempSymbol, type TempUnit } from "@/lib/temperature";

import "./index.scss";

const OCCASION_LABEL_ZH: Record<string, string> = Object.fromEntries(
  OCCASIONS.map((o) => [o.value, o.label]),
) as Record<string, string>;

function occasionLabelZh(occasion: string): string {
  return OCCASION_LABEL_ZH[occasion] || occasion;
}

/** Backend `day_of_week`: 0=Monday … 6=Sunday. JS `Date.getDay()`: 0=Sunday … 6=Saturday. */
function scheduleToJsWeekday(dow: number): number {
  return (dow + 1) % 7;
}

const WEEKDAY_ZH = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

function formatScheduleSummary(schedules: Schedule[]): string | null {
  const enabled = schedules.filter((s) => s.enabled);
  if (enabled.length === 0) return null;

  const now = new Date();
  const currentJsDay = now.getDay();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  let best: { schedule: (typeof enabled)[0]; daysUntil: number; minutesUntil: number } | null = null;

  for (const schedule of enabled) {
    const jsDay = scheduleToJsWeekday(schedule.day_of_week);
    const [h, m] = schedule.notification_time.split(":").map(Number);
    const scheduleMinutes = h * 60 + m;

    let daysUntil = jsDay - currentJsDay;
    if (daysUntil < 0 || (daysUntil === 0 && scheduleMinutes <= currentMinutes)) {
      daysUntil += 7;
    }
    const minutesUntil = daysUntil === 0 ? scheduleMinutes - currentMinutes : scheduleMinutes;

    if (
      !best ||
      daysUntil < best.daysUntil ||
      (daysUntil === best.daysUntil && minutesUntil < best.minutesUntil)
    ) {
      best = { schedule, daysUntil, minutesUntil };
    }
  }

  if (!best) return null;

  const timeStr = best.schedule.notification_time.slice(0, 5);
  const dayPart =
    best.daysUntil === 0 ? "今天" : best.daysUntil === 1 ? "明天" : WEEKDAY_ZH[scheduleToJsWeekday(best.schedule.day_of_week)];

  return `${dayPart} ${timeStr} · ${occasionLabelZh(best.schedule.occasion)}`;
}

export default function DashboardPage() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [weather, setWeather] = useState<{ temperature: number; feels_like: number; condition: string } | null>(null);
  const [weatherHint, setWeatherHint] = useState<string | null>(null);
  const [tempUnit, setTempUnit] = useState<TempUnit>("celsius");
  const [pending, setPending] = useState<Outfit[]>([]);
  const [pendingTotal, setPendingTotal] = useState(0);
  const [itemCount, setItemCount] = useState<number | null>(null);
  const [analytics, setAnalytics] = useState<Awaited<ReturnType<typeof getAnalytics>> | null>(null);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [notifSettings, setNotifSettings] = useState<NotificationSettings[]>([]);
  const [familyName, setFamilyName] = useState<string | null>(null);
  const [familyMemberCount, setFamilyMemberCount] = useState(0);
  const [busy, setBusy] = useState(false);

  const nextScheduleText = useMemo(() => formatScheduleSummary(schedules), [schedules]);

  const enabledChannels = useMemo(() => notifSettings.filter((c) => c.enabled), [notifSettings]);

  const load = useCallback(async () => {
    if (!getAccessToken()) {
      void Taro.redirectTo({ url: "/pages/login/index" });
      return;
    }
    setBusy(true);
    try {
      const u = await fetchSessionUser();
      setUser(u);

      const prefs = await getPreferences(api).catch(() => null);
      setTempUnit(prefs?.temperature_unit === "fahrenheit" ? "fahrenheit" : "celsius");

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
        setWeatherHint("未设置位置或无法加载天气（与 Web 一致：请到设置填写位置）");
      }

      const pend = await listPendingOutfits(api, 2);
      setPending(pend.outfits);
      setPendingTotal(pend.total);

      const items = await listItems(api, {}, 1, 1);
      setItemCount(items.total);

      const [an, sch, settings, fam] = await Promise.all([
        getAnalytics(api, 30).catch(() => null),
        listSchedules(api).catch(() => []),
        listNotificationSettings(api).catch(() => []),
        getMyFamily(api).catch(() => null),
      ]);
      setAnalytics(an);
      setSchedules(sch);
      setNotifSettings(settings);
      if (fam) {
        setFamilyName(fam.name);
        setFamilyMemberCount(fam.members.length);
      } else {
        setFamilyName(null);
        setFamilyMemberCount(0);
      }
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

  const firstName = user?.display_name?.split(/\s+/)[0] || "用户";

  return (
    <ScrollView scrollY className="page-scroll" enhanced showScrollbar={false}>
      <View className="page">
        <View className="hero">
          <Text className="hero-title">欢迎回来，{firstName}</Text>
          <Text className="hero-sub">今日概览（与 Web 仪表盘同一套接口）</Text>
          <Text className="muted">{user?.email || "…"}</Text>
          {itemCount !== null ? (
            <Text className="muted" style={{ marginTop: 8 }}>
              衣橱共 {itemCount} 件单品
            </Text>
          ) : null}
        </View>

        <View className="card">
          <Text className="card-title">今日天气</Text>
          {weather ? (
            <>
              <View className="row">
                <Text className="temp">
                  {displayValue(weather.temperature, tempUnit)}
                  {tempSymbol(tempUnit)}
                </Text>
                <Text className="muted">
                  体感 {displayValue(weather.feels_like, tempUnit)}
                  {tempSymbol(tempUnit)}
                </Text>
              </View>
              <Text className="muted">{weather.condition}</Text>
            </>
          ) : (
            <Text className="muted">{weatherHint || "加载中…"}</Text>
          )}
          <Button className="btn" onClick={() => Taro.switchTab({ url: "/pages/suggest/index" })}>
            获取穿搭推荐
          </Button>
          <Button className="btn-outline" onClick={() => void Taro.navigateTo({ url: "/pages/settings/index" })}>
            设置位置与温度单位
          </Button>
        </View>

        <View className="card">
          <View className="card-head">
            <Text className="card-title">待处理穿搭</Text>
            {pendingTotal > 0 ? (
              <Text className="badge">{pendingTotal}</Text>
            ) : null}
          </View>
          {pending.length === 0 ? (
            <Text className="muted">已全部处理，暂无待处理推荐</Text>
          ) : (
            <>
              {pendingTotal > 2 ? (
                <View className="row-link">
                  <Text />
                  <Button
                    className="text-link"
                    size="mini"
                    onClick={() => void Taro.navigateTo({ url: "/pages/history/index" })}
                  >
                    查看全部
                  </Button>
                </View>
              ) : null}
              {pending.map((o) => (
                <View className="pending-item" key={o.id}>
                  <View className="thumb-stack">
                    {o.items.slice(0, 3).map((item) => (
                      <View className="thumb-circle" key={item.id}>
                        {item.thumbnail_url ? (
                          <Image
                            className="thumb-circle-img"
                            mode="aspectFill"
                            src={resolveMediaUrl(item.thumbnail_url)}
                          />
                        ) : (
                          <Text className="thumb-fallback">·</Text>
                        )}
                      </View>
                    ))}
                  </View>
                  <View className="pending-meta">
                    <Text className="pending-title">{occasionLabelZh(o.occasion)}</Text>
                    <Text className="pending-sub">{o.scheduled_for ? o.scheduled_for : "Lookbook"}</Text>
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
              ))}
            </>
          )}
        </View>

        <View className="card">
          <Text className="card-title">下次提醒</Text>
          {nextScheduleText ? (
            <Text className="body-text">{nextScheduleText}</Text>
          ) : (
            <>
              <Text className="muted">暂无已启用的通知日程</Text>
              <Button className="btn-outline" onClick={() => void Taro.navigateTo({ url: "/pages/notifications/index" })}>
                去通知页设置
              </Button>
            </>
          )}
        </View>

        <View className="grid-2">
          <View className="card card-tight">
            <Text className="card-title-sm">本周穿搭</Text>
            {analytics ? (
              <View className="stat-row">
                <View className="stat">
                  <Text className="stat-num">{analytics.wardrobe.outfits_this_week}</Text>
                  <Text className="stat-label">套数</Text>
                </View>
                <View className="stat">
                  <Text className="stat-num">
                    {analytics.wardrobe.acceptance_rate != null ? `${analytics.wardrobe.acceptance_rate}%` : "—"}
                  </Text>
                  <Text className="stat-label">接受率</Text>
                </View>
              </View>
            ) : (
              <Text className="muted">暂无数据</Text>
            )}
            <Button className="btn-outline tight" size="mini" onClick={() => void Taro.navigateTo({ url: "/pages/analytics/index" })}>
              数据分析
            </Button>
          </View>

          <View className="card card-tight">
            <View className="card-head">
              <Text className="card-title-sm">通知渠道</Text>
              <Button
                className="text-link"
                size="mini"
                onClick={() => void Taro.navigateTo({ url: "/pages/notifications/index" })}
              >
                配置
              </Button>
            </View>
            {notifSettings.length === 0 ? (
              <>
                <Text className="muted">尚未添加渠道</Text>
                <Button className="btn-outline tight" size="mini" onClick={() => void Taro.navigateTo({ url: "/pages/notifications/index" })}>
                  添加
                </Button>
              </>
            ) : (
              <Text className="body-text">
                已启用 {enabledChannels.length} / {notifSettings.length}
              </Text>
            )}
          </View>
        </View>

        <View className="card">
          <View className="card-head">
            <Text className="card-title">洞察</Text>
            <Button className="text-link" size="mini" onClick={() => void Taro.navigateTo({ url: "/pages/analytics/index" })}>
              查看全部
            </Button>
          </View>
          {analytics && analytics.insights.length > 0 ? (
            <View className="insight-list">
              {analytics.insights.slice(0, 3).map((line, i) => (
                <Text className="insight-line" key={i}>
                  · {line}
                </Text>
              ))}
            </View>
          ) : (
            <Text className="muted">暂无洞察，多记录几次穿搭后会生成</Text>
          )}
        </View>

        <View className="card">
          <Text className="card-title">快捷操作</Text>
          <Button className="btn" onClick={() => Taro.switchTab({ url: "/pages/wardrobe/index" })}>
            添加 / 管理衣橱
          </Button>
          <Button className="btn-outline" onClick={() => Taro.switchTab({ url: "/pages/suggest/index" })}>
            获取 AI 穿搭推荐
          </Button>
        </View>

        {familyName ? (
          <View className="card">
            <Text className="card-title">家庭动态</Text>
            <Text className="muted">
              {familyName} · {familyMemberCount} 位成员
            </Text>
            <Button className="btn" onClick={() => void Taro.navigateTo({ url: "/pages/family-feed/index" })}>
              浏览成员穿搭
            </Button>
            <Button className="btn-outline" onClick={() => void Taro.navigateTo({ url: "/pages/family/index" })}>
              管理家庭
            </Button>
          </View>
        ) : null}

        <View className="link-row">
          <Button className="link-btn" size="mini" onClick={() => void Taro.navigateTo({ url: "/pages/history/index" })}>
            穿搭历史
          </Button>
          <Button className="link-btn" size="mini" onClick={() => void Taro.navigateTo({ url: "/pages/learning/index" })}>
            学习洞察
          </Button>
          <Button className="link-btn" size="mini" onClick={() => void Taro.navigateTo({ url: "/pages/family/index" })}>
            家庭
          </Button>
          <Button className="link-btn" size="mini" onClick={() => void Taro.navigateTo({ url: "/pages/notifications/index" })}>
            通知
          </Button>
          <Button className="link-btn" size="mini" onClick={() => void Taro.navigateTo({ url: "/pages/settings/index" })}>
            设置
          </Button>
          <Button className="link-btn" size="mini" onClick={() => void Taro.navigateTo({ url: "/pages/outfit-new/index" })}>
            新建穿搭
          </Button>
        </View>

        <Button className="logout" loading={busy} onClick={logout}>
          退出登录
        </Button>
      </View>
    </ScrollView>
  );
}
