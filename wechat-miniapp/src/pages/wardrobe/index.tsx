import { useEffect } from "react";
import { Text, View } from "@tarojs/components";
import Taro from "@tarojs/taro";

import { getAccessToken } from "@/lib/auth-storage";

import "./index.scss";

export default function WardrobePage() {
  useEffect(() => {
    if (!getAccessToken()) {
      void Taro.redirectTo({ url: "/pages/login/index" });
    }
  }, []);

  return (
    <View className="page">
      <Text className="text">衣橱功能将在后续里程碑中接入，与 Web 端共用 /api/v1/items 等接口。</Text>
    </View>
  );
}
