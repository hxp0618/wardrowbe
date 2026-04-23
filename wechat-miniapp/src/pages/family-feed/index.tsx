import { useCallback, useEffect, useMemo, useState } from "react";
import { Image, ScrollView, Text, View } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";

import type { Family, Outfit } from "@wardrowbe/shared-domain";
import { getMyFamily, listOutfits } from "@wardrowbe/shared-services";

import { api } from "@/lib/api";
import { getAccessToken } from "@/lib/auth-storage";
import { resolveMediaUrl } from "@/lib/images";
import { fetchSessionUser } from "@/lib/session";

import "./index.scss";

export default function FamilyFeedPage() {
  const [family, setFamily] = useState<Family | null>(null);
  const [myEmail, setMyEmail] = useState<string>("");
  const [selectedMemberId, setSelectedMemberId] = useState<string | undefined>();
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [loading, setLoading] = useState(false);

  const otherMembers = useMemo(() => {
    if (!family || !myEmail) return [];
    return family.members.filter((m) => m.email.toLowerCase() !== myEmail.toLowerCase());
  }, [family, myEmail]);

  const loadFamily = useCallback(async () => {
    if (!getAccessToken()) {
      void Taro.redirectTo({ url: "/pages/login/index" });
      return;
    }
    try {
      const me = await fetchSessionUser();
      setMyEmail(me.email);
      const f = await getMyFamily(api);
      setFamily(f);
    } catch {
      setFamily(null);
    }
  }, []);

  const loadOutfits = useCallback(async (memberId: string) => {
    setLoading(true);
    try {
      const res = await listOutfits(api, { family_member_id: memberId }, 1, 30);
      setOutfits(res.outfits);
    } catch {
      Taro.showToast({ title: "加载失败", icon: "none" });
    } finally {
      setLoading(false);
    }
  }, []);

  useDidShow(() => {
    void loadFamily();
  });

  useEffect(() => {
    if (otherMembers.length === 0) {
      return;
    }
    if (!selectedMemberId || !otherMembers.some((m) => m.id === selectedMemberId)) {
      setSelectedMemberId(otherMembers[0].id);
    }
  }, [otherMembers, selectedMemberId]);

  useEffect(() => {
    if (selectedMemberId) {
      void loadOutfits(selectedMemberId);
    }
  }, [selectedMemberId, loadOutfits]);

  if (!family) {
    return (
      <View className="page">
        <Text className="empty">请先加入家庭（家庭页）</Text>
      </View>
    );
  }

  if (otherMembers.length === 0) {
    return (
      <View className="page">
        <Text className="title">家庭动态</Text>
        <Text className="sub">暂无其他成员，请在家庭页邀请成员。</Text>
      </View>
    );
  }

  return (
    <View className="page">
      <View className="header">
        <Text className="title">家庭动态</Text>
        <Text className="sub">查看其他成员的穿搭（与 Web「家庭动态」同一接口）</Text>
      </View>
      <View className="chips">
        {otherMembers.map((m) => (
          <View
            key={m.id}
            className={`chip ${selectedMemberId === m.id ? "chip-on" : ""}`}
            onClick={() => setSelectedMemberId(m.id)}
          >
            <Text>{m.display_name}</Text>
          </View>
        ))}
      </View>
      <ScrollView scrollY style={{ height: "calc(100vh - 220px)" }}>
        {loading ? <Text className="empty">加载中…</Text> : null}
        {!loading &&
          outfits.map((o) => (
            <View
              className="card"
              key={o.id}
              onClick={() =>
                void Taro.navigateTo({
                  url: `/pages/outfit-detail/index?id=${o.id}&owner_id=${selectedMemberId}`,
                })
              }
            >
              <View className="row">
                {o.items[0] ? (
                  <Image className="thumb" mode="aspectFill" src={resolveMediaUrl(o.items[0].thumbnail_url || o.items[0].image_url)} />
                ) : (
                  <View className="thumb" />
                )}
                <View className="meta">
                  <Text className="line1">{o.occasion}</Text>
                  <Text className="line2">
                    {o.scheduled_for || "—"} · {o.status}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        {!loading && outfits.length === 0 ? <Text className="empty">暂无穿搭</Text> : null}
      </ScrollView>
    </View>
  );
}
