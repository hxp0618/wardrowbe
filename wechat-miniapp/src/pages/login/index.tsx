import { useCallback, useEffect, useState } from "react";
import { Button, Input, Text, View } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";

import { ApiError, api } from "@/lib/api";
import { getAccessToken, setAccessToken } from "@/lib/auth-storage";
import { fetchSessionUser } from "@/lib/session";

import "./index.scss";

interface SyncResponse {
  access_token: string;
}

export default function LoginPage() {
  const [email, setEmail] = useState("dev@example.com");
  const [displayName, setDisplayName] = useState("Dev");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tryResumeSession = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      return;
    }
    try {
      const me = await fetchSessionUser();
      if (!me.onboarding_completed) {
        void Taro.reLaunch({ url: "/pages/onboarding/index" });
        return;
      }
    } catch {
      /* ignore */
    }
    void Taro.switchTab({ url: "/pages/dashboard/index" });
  }, []);

  useEffect(() => {
    const stored = Taro.getStorageSync<string>("wardrowbe_access_token");
    if (stored) {
      setAccessToken(stored);
    }
    void tryResumeSession();
  }, [tryResumeSession]);

  useDidShow(() => {
    void tryResumeSession();
  });

  const goAfterLogin = useCallback(async () => {
    let target = "/pages/dashboard/index";
    try {
      const saved = Taro.getStorageSync<string>("wardrowbe_post_login_redirect");
      if (saved && typeof saved === "string" && saved.includes("pages/")) {
        target = saved.startsWith("/") ? saved : `/${saved}`;
      }
      Taro.removeStorageSync("wardrowbe_post_login_redirect");
    } catch {
      /* ignore */
    }
    try {
      const me = await fetchSessionUser();
      if (!me.onboarding_completed && !target.includes("pages/onboarding")) {
        void Taro.reLaunch({ url: "/pages/onboarding/index" });
        return;
      }
    } catch {
      /* ignore; proceed with target */
    }
    const tabPaths = [
      "/pages/dashboard/index",
      "/pages/wardrobe/index",
      "/pages/suggest/index",
      "/pages/pairings/index",
      "/pages/outfits/index",
    ];
    const normalizedTarget = target.startsWith("/") ? target : `/${target}`;
    const matched = tabPaths.find((p) => normalizedTarget.includes(p));
    if (matched) {
      void Taro.switchTab({ url: matched });
    } else {
      void Taro.reLaunch({ url: target });
    }
  }, []);

  const persistToken = useCallback((token: string) => {
    setAccessToken(token);
    try {
      Taro.setStorageSync("wardrowbe_access_token", token);
    } catch {
      /* ignore */
    }
  }, []);

  const onDevLogin = useCallback(async () => {
    setError(null);
    setBusy(true);
    try {
      const data = await api.post<SyncResponse>("/auth/dev-login", {
        email: email.trim(),
        display_name: displayName.trim() || email.split("@")[0] || "User",
      });
      persistToken(data.access_token);
      void goAfterLogin();
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "登录失败";
      setError(msg);
    } finally {
      setBusy(false);
    }
  }, [displayName, email, goAfterLogin, persistToken]);

  const onWeChatLogin = useCallback(async () => {
    setError(null);
    setBusy(true);
    try {
      const login = await Taro.login();
      if (!login.code) {
        setError("无法获取微信登录 code");
        setBusy(false);
        return;
      }
      const data = await api.post<SyncResponse>("/auth/wechat/code", { code: login.code });
      persistToken(data.access_token);
      void goAfterLogin();
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "微信登录失败";
      setError(msg);
    } finally {
      setBusy(false);
    }
  }, [goAfterLogin, persistToken]);

  return (
    <View className="page">
      <Text className="title">Wardrowbe</Text>
      <Text className="hint">使用与后端一致的开发环境时可选择开发登录；生产环境需配置微信小程序 AppId/Secret。</Text>

      <View className="section">
        <Text className="section-title">微信登录</Text>
        <Button className="btn btn-wechat" type="primary" loading={busy} onClick={onWeChatLogin}>
          微信一键登录
        </Button>
      </View>

      <View className="section">
        <Text className="section-title">开发登录</Text>
        <Input className="input" placeholder="邮箱" value={email} onInput={(ev) => setEmail(ev.detail.value)} />
        <Input
          className="input"
          placeholder="显示名称"
          value={displayName}
          onInput={(ev) => setDisplayName(ev.detail.value)}
        />
        <Button className="btn" loading={busy} onClick={onDevLogin}>
          开发环境登录
        </Button>
      </View>

      {error ? <Text className="error">{error}</Text> : null}
    </View>
  );
}
