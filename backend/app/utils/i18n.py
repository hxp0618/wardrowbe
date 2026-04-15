"""API message localization. Default locale is Chinese (zh); English (en) via Accept-Language."""

from __future__ import annotations

from fastapi import Request

# Keys used with translate(); keep in sync across locales.
MESSAGES_ZH: dict[str, str] = {
    "error.insufficient_items_pairing": "衣橱里可用于搭配的物品不足，请添加更多衣物。",
    "error.insufficient_items_recommendation": "衣橱里可用于推荐的物品不足，请添加更多衣物或调整筛选条件。",
    "error.ai_pairing_unavailable": "AI 服务不可用，请检查设置中的 AI 端点配置。",
    "error.ai_recommendation_unavailable": "AI 服务不可用，请在设置中检查 AI 端点配置。",
    "error.source_item_unavailable": "未找到源物品或该物品不可用。",
    "error.user_location_not_set": "未设置位置，请在设置中填写位置信息。",
    "error.weather_fetch_failed": "无法获取天气数据，请稍后重试或手动填写天气。",
    "error.ai_no_valid_items": "AI 未选择任何有效物品。",
    "error.pairing_not_found": "未找到搭配。",
    "error.outfit_not_found": "未找到穿搭。",
    "error.no_feedback_for_outfit": "该穿搭暂无反馈。",
    "error.cannot_rate_own_outfit": "不能给自己的穿搭评分。",
    "error.family_required_for_member_outfits": "查看家庭成员穿搭需要先加入家庭。",
    "error.not_in_your_family": "该用户不在你的家庭中。",
    "error.family_required_to_rate": "只有家庭成员才能为穿搭评分。",
    "error.access_denied": "无权访问。",
    "error.rating_not_found": "未找到评分。",
    "error.validation": "验证错误",
    "error.unexpected": "发生意外错误，请稍后重试。",
    "error.occasion_too_long": "场合名称不能超过 50 个字符",
    "error.invalid_occasion": "无效的场合，必须是以下之一：{occasions}",
}

MESSAGES_EN: dict[str, str] = {
    "error.insufficient_items_pairing": "Not enough items in wardrobe for pairing. Add more items.",
    "error.insufficient_items_recommendation": "Not enough items in wardrobe for recommendation. "
    "Please add more items or adjust filters.",
    "error.ai_pairing_unavailable": "AI service is not available. Check your AI endpoint configuration.",
    "error.ai_recommendation_unavailable": "AI service is not available. "
    "Please check your AI endpoint configuration in Settings.",
    "error.source_item_unavailable": "Source item not found or not available.",
    "error.user_location_not_set": "User location not set. Please set location in settings.",
    "error.weather_fetch_failed": "Could not fetch weather data. Please try again or provide weather manually.",
    "error.ai_no_valid_items": "AI did not select any valid items.",
    "error.pairing_not_found": "Pairing not found.",
    "error.outfit_not_found": "Outfit not found.",
    "error.no_feedback_for_outfit": "No feedback found for this outfit.",
    "error.cannot_rate_own_outfit": "Cannot rate your own outfit.",
    "error.family_required_for_member_outfits": "You must be in a family to view family member outfits.",
    "error.not_in_your_family": "User is not in your family.",
    "error.family_required_to_rate": "You must be in the same family to rate outfits.",
    "error.access_denied": "Access denied.",
    "error.rating_not_found": "Rating not found.",
    "error.validation": "Validation error",
    "error.unexpected": "An unexpected error occurred. Please try again later.",
    "error.occasion_too_long": "Occasion must be 50 characters or less",
    "error.invalid_occasion": "Invalid occasion. Must be one of: {occasions}",
}

LOCALES: dict[str, dict[str, str]] = {
    "zh": MESSAGES_ZH,
    "en": MESSAGES_EN,
}

DEFAULT_LOCALE = "zh"


def resolve_locale(request: Request | None) -> str:
    """Pick zh (default) or en from Accept-Language."""
    if request is None:
        return DEFAULT_LOCALE
    header = request.headers.get("accept-language")
    if not header:
        return DEFAULT_LOCALE
    # First language tag with optional q= weights
    for part in header.split(","):
        tag = part.strip().split(";")[0].strip().lower()
        if not tag:
            continue
        primary = tag.split("-")[0]
        if primary == "en":
            return "en"
        if primary == "zh":
            return "zh"
    return DEFAULT_LOCALE


def translate(locale: str, key: str, **kwargs: object) -> str:
    table = LOCALES.get(locale) or LOCALES[DEFAULT_LOCALE]
    template = table.get(key) or LOCALES[DEFAULT_LOCALE].get(key) or key
    if kwargs:
        return template.format(**kwargs)
    return template


def translate_request(request: Request | None, key: str, **kwargs: object) -> str:
    return translate(resolve_locale(request), key, **kwargs)
