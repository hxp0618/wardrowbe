import { useState } from "react";
import { Button, Text, View } from "@tarojs/components";
import Taro from "@tarojs/taro";

import { completeOnboarding } from "@wardrowbe/shared-services";

import { api } from "@/lib/api";
import { getAccessToken } from "@/lib/auth-storage";

import "./index.scss";

export default function OnboardingPage() {
  const [busy, setBusy] = useState(false);

  const finish = async () => {
    if (!getAccessToken()) {
      void Taro.redirectTo({ url: "/pages/login/index" });
      return;
    }
    setBusy(true);
    try {
      await completeOnboarding(api);
      Taro.showToast({ title: "已完成", icon: "success" });
      void Taro.switchTab({ url: "/pages/dashboard/index" });
    } catch {
      Taro.showToast({ title: "提交失败", icon: "none" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <View className="page">
      <Text className="title">欢迎使用 Wardrowbe</Text>
      <Text className="text">
        小程序端引导为简化版：你可稍后在「设置」中补充位置与偏好，并在 Web 端完成更完整的引导流程。
      </Text>
      <Button className="btn" loading={busy} onClick={() => void finish()}>
        完成引导，进入首页
      </Button>
      <Button className="btn-outline" onClick={() => void Taro.navigateTo({ url: "/pages/settings/index" })}>
        去设置
      </Button>
    </View>
  );
}
