import { useCallback, useState } from "react";
import { ScrollView, Text, View } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";

import type { NotificationHistory, NotificationSettings, Schedule } from "@wardrowbe/shared-services";
import {
  listNotificationHistory,
  listNotificationSettings,
  listSchedules,
} from "@wardrowbe/shared-services";

import { api } from "@/lib/api";
import { getAccessToken } from "@/lib/auth-storage";

import "./index.scss";

const DAYS = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

export default function NotificationsPage() {
  const [settings, setSettings] = useState<NotificationSettings[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [history, setHistory] = useState<NotificationHistory[]>([]);

  const load = useCallback(async () => {
    if (!getAccessToken()) {
      void Taro.redirectTo({ url: "/pages/login/index" });
      return;
    }
    try {
      const [s, sch, h] = await Promise.all([
        listNotificationSettings(api),
        listSchedules(api),
        listNotificationHistory(api, 15),
      ]);
      setSettings(s);
      setSchedules(sch);
      setHistory(h);
    } catch {
      Taro.showToast({ title: "加载失败", icon: "none" });
    }
  }, []);

  useDidShow(() => {
    void load();
  });

  return (
    <View className="page">
      <ScrollView scrollY style={{ height: "calc(100vh - 40px)" }}>
        <Text className="section-title">通知渠道</Text>
        {settings.length === 0 ? (
          <Text className="empty">暂无配置</Text>
        ) : (
          settings.map((ns) => (
            <View className="card" key={ns.id}>
              <Text className="row1">{ns.channel}</Text>
              <Text className={`row2 ${ns.enabled ? "badge-on" : "badge-off"}`}>
                {ns.enabled ? "已启用" : "已关闭"} · 优先级 {ns.priority}
              </Text>
            </View>
          ))
        )}

        <Text className="section-title">提醒计划</Text>
        {schedules.length === 0 ? (
          <Text className="empty">暂无计划</Text>
        ) : (
          schedules.map((sc) => (
            <View className="card" key={sc.id}>
              <Text className="row1">
                {DAYS[sc.day_of_week] ?? sc.day_of_week} {sc.notification_time}
              </Text>
              <Text className="row2">
                {sc.occasion} · {sc.enabled ? "启用" : "停用"}
                {sc.notify_day_before ? " · 提前一天" : ""}
              </Text>
            </View>
          ))
        )}

        <Text className="section-title">最近发送</Text>
        {history.length === 0 ? (
          <Text className="empty">暂无记录</Text>
        ) : (
          history.map((row) => (
            <View className="card" key={row.id}>
              <Text className="row1">{row.channel}</Text>
              <Text className="row2">
                {row.status}
                {row.sent_at ? ` · ${row.sent_at}` : ""}
              </Text>
              {row.error_message ? <Text className="row2">{row.error_message}</Text> : null}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
