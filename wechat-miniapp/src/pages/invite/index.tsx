import { useCallback, useState } from "react";
import { Button, Text, View } from "@tarojs/components";
import Taro, { useLoad } from "@tarojs/taro";

import { ApiError, api } from "@/lib/api";
import { getAccessToken } from "@/lib/auth-storage";
import { joinFamilyByToken } from "@wardrowbe/shared-services";

import "./index.scss";

function mapInviteError(e: unknown): string {
  if (e instanceof ApiError) {
    if (e.status === 404) return "邀请链接无效或已过期";
    if (e.status === 403) return "该邀请发送到了其他邮箱";
    if (e.status === 409) return "你已加入其他家庭";
  }
  return "无法接受邀请，请重试";
}

export default function InvitePage() {
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useLoad((opts) => {
    const t = (opts as { token?: string }).token;
    if (t) {
      setToken(t);
    } else {
      const inst = Taro.getCurrentInstance();
      const q = inst.router?.params?.token;
      if (q) {
        setToken(q);
      }
    }
  });

  const accept = useCallback(async () => {
    if (!token) {
      setError("缺少邀请参数");
      return;
    }
    if (!getAccessToken()) {
      try {
        Taro.setStorageSync("wardrowbe_post_login_redirect", `/pages/invite/index?token=${encodeURIComponent(token)}`);
      } catch {
        /* ignore */
      }
      void Taro.redirectTo({ url: "/pages/login/index" });
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const res = await joinFamilyByToken(api, token);
      Taro.showToast({ title: `已加入 ${res.family_name}`, icon: "success" });
      void Taro.switchTab({ url: "/pages/dashboard/index" });
    } catch (e) {
      setError(mapInviteError(e));
    } finally {
      setBusy(false);
    }
  }, [token]);

  if (!token) {
    return (
      <View className="page">
        <Text className="title">家庭邀请</Text>
        <Text className="text">未找到邀请令牌。请使用完整邀请链接打开本页。</Text>
        <Button className="btn" onClick={() => void Taro.navigateTo({ url: "/pages/family/index" })}>
          前往家庭
        </Button>
      </View>
    );
  }

  return (
    <View className="page">
      <Text className="title">接受家庭邀请</Text>
      <Text className="text">确认加入该家庭？加入后可在「家庭」页查看成员与邀请码。</Text>
      {error ? <Text className="err">{error}</Text> : null}
      <Button className="btn" loading={busy} onClick={() => void accept()}>
        接受邀请
      </Button>
    </View>
  );
}
