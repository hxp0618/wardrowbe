import { useCallback, useState } from "react";
import { Button, Input, Text, View } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";

import type { Family } from "@wardrowbe/shared-domain";
import {
  createFamily as createFamilyRequest,
  getMyFamily,
  joinFamily as joinFamilyRequest,
} from "@wardrowbe/shared-services";

import { ApiError, api } from "@/lib/api";
import { getAccessToken } from "@/lib/auth-storage";

import "./index.scss";

export default function FamilyPage() {
  const [family, setFamily] = useState<Family | null>(null);
  const [noFamily, setNoFamily] = useState(false);
  const [name, setName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!getAccessToken()) {
      void Taro.redirectTo({ url: "/pages/login/index" });
      return;
    }
    setLoading(true);
    setNoFamily(false);
    try {
      const f = await getMyFamily(api);
      setFamily(f);
    } catch (e) {
      setFamily(null);
      if (e instanceof ApiError && e.status === 404) {
        setNoFamily(true);
      } else {
        Taro.showToast({ title: "加载失败", icon: "none" });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useDidShow(() => {
    void load();
  });

  const onCreate = async () => {
    const n = name.trim();
    if (!n) {
      Taro.showToast({ title: "请输入家庭名称", icon: "none" });
      return;
    }
    try {
      await createFamilyRequest(api, n);
      Taro.showToast({ title: "已创建", icon: "success" });
      setName("");
      void load();
    } catch {
      Taro.showToast({ title: "创建失败", icon: "none" });
    }
  };

  const onJoin = async () => {
    const c = inviteCode.trim();
    if (!c) {
      Taro.showToast({ title: "请输入邀请码", icon: "none" });
      return;
    }
    try {
      await joinFamilyRequest(api, c);
      Taro.showToast({ title: "已加入", icon: "success" });
      setInviteCode("");
      void load();
    } catch {
      Taro.showToast({ title: "加入失败", icon: "none" });
    }
  };

  if (family) {
    return (
      <View className="page">
        <View className="card">
          <Text className="title">{family.name}</Text>
          <Text className="line">邀请码：{family.invite_code}</Text>
        </View>
        <View className="card">
          <Text className="title">成员 ({family.members.length})</Text>
          {family.members.map((m) => (
            <View className="member" key={m.id}>
              <Text className="member-name">{m.display_name}</Text>
              <Text className="member-role">{m.role}</Text>
            </View>
          ))}
        </View>
        {family.pending_invites.length > 0 ? (
          <View className="card">
            <Text className="title">待处理邀请</Text>
            {family.pending_invites.map((inv) => (
              <Text className="line" key={inv.id}>
                {inv.email}
              </Text>
            ))}
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <View className="page">
      <Text className="hint">
        {noFamily ? "你尚未加入家庭，可创建新家庭或通过邀请码加入。" : loading ? "加载中…" : ""}
      </Text>
      <View className="card">
        <Text className="title">创建家庭</Text>
        <Input className="input" placeholder="家庭名称" value={name} onInput={(e) => setName(e.detail.value)} />
        <Button className="btn" onClick={() => void onCreate()}>
          创建
        </Button>
      </View>
      <View className="card">
        <Text className="title">加入家庭</Text>
        <Input className="input" placeholder="邀请码" value={inviteCode} onInput={(e) => setInviteCode(e.detail.value)} />
        <Button className="btn-secondary" onClick={() => void onJoin()}>
          加入
        </Button>
      </View>
    </View>
  );
}
