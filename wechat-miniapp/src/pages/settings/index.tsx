import { useCallback, useState } from "react";
import { Button, Input, Picker, Text, View } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";

import type { Preferences } from "@wardrowbe/shared-domain";
import { getPreferences, updatePreferences, updateUserProfile } from "@wardrowbe/shared-services";

import { api } from "@/lib/api";
import { getAccessToken } from "@/lib/auth-storage";
import type { SessionUser } from "@/lib/session";
import { fetchSessionUser } from "@/lib/session";

import "./index.scss";

const TEMP_UNITS = [
  { label: "摄氏度 °C", value: "celsius" },
  { label: "华氏度 °F", value: "fahrenheit" },
];

export default function SettingsPage() {
  const [profile, setProfile] = useState<SessionUser | null>(null);
  const [prefs, setPrefs] = useState<Preferences | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [locationName, setLocationName] = useState("");
  const [tempIndex, setTempIndex] = useState(0);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!getAccessToken()) {
      void Taro.redirectTo({ url: "/pages/login/index" });
      return;
    }
    try {
      const [me, p] = await Promise.all([fetchSessionUser(), getPreferences(api)]);
      setProfile(me);
      setDisplayName(me.display_name);
      setLocationName(me.location_name || "");
      setPrefs(p);
      setTempIndex(p.temperature_unit === "fahrenheit" ? 1 : 0);
    } catch {
      Taro.showToast({ title: "加载失败", icon: "none" });
    }
  }, []);

  useDidShow(() => {
    void load();
  });

  const saveProfile = async () => {
    setBusy(true);
    try {
      await updateUserProfile(api, {
        display_name: displayName.trim() || profile?.display_name,
        location_name: locationName.trim() || undefined,
      });
      Taro.showToast({ title: "已保存", icon: "success" });
      void load();
    } catch {
      Taro.showToast({ title: "保存失败", icon: "none" });
    } finally {
      setBusy(false);
    }
  };

  const savePrefs = async () => {
    if (!prefs) return;
    setBusy(true);
    try {
      const unit = TEMP_UNITS[tempIndex].value as "celsius" | "fahrenheit";
      await updatePreferences(api, { temperature_unit: unit });
      Taro.showToast({ title: "偏好已保存", icon: "success" });
      void load();
    } catch {
      Taro.showToast({ title: "保存失败", icon: "none" });
    } finally {
      setBusy(false);
    }
  };

  const openOnboarding = () => {
    void Taro.navigateTo({ url: "/pages/onboarding/index" });
  };

  return (
    <View className="page">
      <View className="card">
        <Text className="section-title">个人资料</Text>
        {profile ? <Text className="hint">{profile.email}</Text> : null}
        <Text className="label">显示名称</Text>
        <Input className="input" value={displayName} onInput={(e) => setDisplayName(e.detail.value)} />
        <Text className="label">位置名称（用于天气）</Text>
        <Input className="input" placeholder="例如：上海市" value={locationName} onInput={(e) => setLocationName(e.detail.value)} />
        <Button className="btn" loading={busy} onClick={() => void saveProfile()}>
          保存资料
        </Button>
      </View>

      <View className="card">
        <Text className="section-title">偏好</Text>
        <Text className="label">温度单位</Text>
        <Picker mode="selector" range={TEMP_UNITS} rangeKey="label" value={tempIndex} onChange={(e) => setTempIndex(Number(e.detail.value))}>
          <View className="input">{TEMP_UNITS[tempIndex].label}</View>
        </Picker>
        <Button className="btn" loading={busy} onClick={() => void savePrefs()}>
          保存偏好
        </Button>
        <Text className="hint" style={{ marginTop: 16 }}>
          完整偏好与 AI 端点请在 Web 端设置中配置。
        </Text>
      </View>

      <Button className="btn-muted" onClick={openOnboarding}>
        重新查看引导
      </Button>
    </View>
  );
}
