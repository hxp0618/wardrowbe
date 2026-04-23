import { useCallback, useState } from "react";
import { Button, Image, Input, Text, View } from "@tarojs/components";
import Taro, { useLoad } from "@tarojs/taro";

import type { Outfit } from "@wardrowbe/shared-domain";
import {
  acceptOutfit,
  deleteOutfit,
  getOutfit,
  rejectOutfit,
  submitFamilyRating,
  wearTodayOutfit,
} from "@wardrowbe/shared-services";

import { api } from "@/lib/api";
import { getAccessToken } from "@/lib/auth-storage";
import { resolveMediaUrl } from "@/lib/images";
import { fetchSessionUser, type SessionUser } from "@/lib/session";

import "./index.scss";

export default function OutfitDetailPage() {
  const [id, setId] = useState<string>("");
  const [outfit, setOutfit] = useState<Outfit | null>(null);
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [ratingStars, setRatingStars] = useState(0);
  const [ratingComment, setRatingComment] = useState("");

  const load = useCallback(async (outfitId: string) => {
    if (!getAccessToken()) {
      void Taro.redirectTo({ url: "/pages/login/index" });
      return;
    }
    setLoading(true);
    try {
      const [me, o] = await Promise.all([fetchSessionUser(), getOutfit(api, outfitId)]);
      setSessionUser(me);
      setOutfit(o);
    } catch {
      Taro.showToast({ title: "加载失败", icon: "none" });
      setOutfit(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useLoad((opts) => {
    const q = (opts as { id?: string }).id || Taro.getCurrentInstance().router?.params?.id;
    if (q) {
      setId(q);
      void load(q);
    }
  });

  const refresh = () => {
    if (id) void load(id);
  };

  const onAccept = async () => {
    if (!outfit) return;
    try {
      await acceptOutfit(api, outfit.id);
      Taro.showToast({ title: "已接受", icon: "success" });
      refresh();
    } catch {
      Taro.showToast({ title: "失败", icon: "none" });
    }
  };

  const onReject = async () => {
    if (!outfit) return;
    try {
      await rejectOutfit(api, outfit.id);
      Taro.showToast({ title: "已拒绝", icon: "success" });
      refresh();
    } catch {
      Taro.showToast({ title: "失败", icon: "none" });
    }
  };

  const onDelete = async () => {
    if (!outfit) return;
    const res = await Taro.showModal({ title: "删除穿搭", content: "确定删除？此操作不可撤销。" });
    if (!res.confirm) return;
    try {
      await deleteOutfit(api, outfit.id);
      Taro.showToast({ title: "已删除", icon: "success" });
      void Taro.navigateBack();
    } catch {
      Taro.showToast({ title: "删除失败", icon: "none" });
    }
  };

  const onWearToday = async () => {
    if (!outfit) return;
    try {
      const created = await wearTodayOutfit(api, outfit.id, {});
      Taro.showToast({ title: "已加入今日", icon: "success" });
      void Taro.redirectTo({ url: `/pages/outfit-detail/index?id=${created.id}` });
    } catch {
      Taro.showToast({ title: "失败", icon: "none" });
    }
  };

  const onSubmitFamilyRating = async () => {
    if (!outfit || ratingStars < 1) {
      Taro.showToast({ title: "请选择 1–5 星", icon: "none" });
      return;
    }
    try {
      await submitFamilyRating(api, outfit.id, {
        rating: ratingStars,
        comment: ratingComment.trim() || null,
      });
      Taro.showToast({ title: "已提交评分", icon: "success" });
      setRatingStars(0);
      setRatingComment("");
      refresh();
    } catch {
      Taro.showToast({ title: "提交失败", icon: "none" });
    }
  };

  if (loading || !outfit) {
    return (
      <View className="page">
        <Text className="meta">{loading ? "加载中…" : "未找到"}</Text>
      </View>
    );
  }

  const myId = sessionUser?.user_id ?? sessionUser?.id;
  const isOwner = !!myId && outfit.user_id === myId;
  const isPending = outfit.status === "pending";
  const isTemplate = outfit.scheduled_for === null;
  const canRateFamily = !isOwner && outfit.scheduled_for !== null;
  const myRating = canRateFamily ? outfit.family_ratings?.find((r) => r.user_id === myId) : undefined;

  return (
    <View className="page">
      {!isOwner ? (
        <Text className="banner">家庭成员的穿搭 · 查看与评分（与 Web 家庭动态一致）</Text>
      ) : null}
      <Text className="title">{outfit.name || outfit.occasion}</Text>
      <Text className="meta">
        {outfit.occasion} · {outfit.scheduled_for || "Lookbook"} · {outfit.status}
      </Text>
      <View className="imgs">
        {outfit.items.map((it) => (
          <Image key={it.id} className="img" mode="aspectFill" src={resolveMediaUrl(it.thumbnail_url || it.image_url)} />
        ))}
      </View>
      {outfit.reasoning ? <Text className="reason">{outfit.reasoning}</Text> : null}

      {canRateFamily && outfit.family_ratings && outfit.family_ratings.length > 0 ? (
        <View className="section">
          <Text className="section-title">家庭评分</Text>
          {outfit.family_ratings.map((r) => (
            <Text key={r.id} className="rating-line">
              {r.user_display_name}：{"★".repeat(r.rating)}
              {"☆".repeat(5 - r.rating)}
              {r.comment ? ` · ${r.comment}` : ""}
            </Text>
          ))}
        </View>
      ) : null}

      {canRateFamily && !myRating ? (
        <View className="section">
          <Text className="section-title">为 Ta 评分</Text>
          <View className="stars">
            {[1, 2, 3, 4, 5].map((n) => (
              <Text key={n} className={`star ${ratingStars >= n ? "star-on" : ""}`} onClick={() => setRatingStars(n)}>
                ★
              </Text>
            ))}
          </View>
          <Input
            className="comment-input"
            placeholder="可选评语"
            value={ratingComment}
            onInput={(e) => setRatingComment(e.detail.value)}
          />
          <Button className="btn btn-accept" onClick={() => void onSubmitFamilyRating()}>
            提交评分
          </Button>
        </View>
      ) : null}

      {canRateFamily && myRating ? (
        <View className="section">
          <Text className="section-title">我的评分</Text>
          <Text className="rating-line">
            {"★".repeat(myRating.rating)}
            {"☆".repeat(5 - myRating.rating)}
            {myRating.comment ? ` · ${myRating.comment}` : ""}
          </Text>
          <Text className="hint">在 Web 端可编辑评分；小程序暂仅展示。</Text>
        </View>
      ) : null}

      {isOwner ? (
        <View className="actions">
          {isPending ? (
            <>
              <Button className="btn btn-accept" onClick={() => void onAccept()}>
                接受
              </Button>
              <Button className="btn btn-reject" onClick={() => void onReject()}>
                拒绝
              </Button>
            </>
          ) : null}
          {isTemplate ? (
            <Button className="btn btn-wear" onClick={() => void onWearToday()}>
              今日穿着（模板）
            </Button>
          ) : null}
          <Button className="btn btn-danger" onClick={() => void onDelete()}>
            删除
          </Button>
        </View>
      ) : null}
    </View>
  );
}
