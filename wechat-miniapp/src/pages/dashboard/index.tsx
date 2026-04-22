import { useCallback, useEffect, useState } from "react";
import { Button, Text, View } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";

import { clearAccessToken, getAccessToken } from "@/lib/auth-storage";
import { fetchSessionUser, type SessionUser } from "@/lib/session";

import "./index.scss";

export default function DashboardPage() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!getAccessToken()) {
      void Taro.redirectTo({ url: "/pages/login/index" });
      return;
    }
    setError(null);
    try {
      const u = await fetchSessionUser();
      setUser(u);
    } catch {
      setError("无法加载用户信息");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

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

  return (
    <View className="page">
      <Text className="headline">Dashboard</Text>
      {user ? (
        <Text className="sub">
          {user.display_name}（{user.email}）
        </Text>
      ) : (
        <Text className="sub">{error || "加载中…"}</Text>
      )}
      <Button className="logout" onClick={logout}>
        退出登录
      </Button>
    </View>
  );
}
