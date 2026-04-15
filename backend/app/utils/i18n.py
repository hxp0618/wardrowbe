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
    "error.rate_limit": "请求过于频繁，请稍后再试。",
    "error.token_invalid": "令牌无效或已过期。",
    "error.not_authenticated": "未登录。",
    "error.user_inactive": "账号已停用。",
    "error.weather_location_required": "未设置位置。请提供坐标或在设置中填写位置。",
    "error.weather_service_unavailable": "天气服务暂时不可用。",
    "error.body_measurement_positive": "身体数据「{field}」必须为正数。",
    "error.url_required": "必须填写 URL。",
    "error.url_http_https_only": "仅允许 HTTP 与 HTTPS 链接。",
    "error.invalid_user_id_format": "用户 ID 格式无效。",
    "error.invalid_filename_format": "文件名格式无效。",
    "error.invalid_image_path": "路径无效。",
    "error.image_not_found": "未找到图片。",
    "error.insight_not_found": "未找到洞察。",
    "error.admin_required": "需要管理员权限。",
    "error.not_in_family": "你尚未加入家庭。",
    "error.family_not_found": "未找到家庭。",
    "error.already_in_family_leave_first": "你已加入家庭，请先退出当前家庭。",
    "error.invalid_invite_code": "邀请码无效。",
    "error.invalid_or_expired_invite": "邀请链接无效或已过期。",
    "error.invite_wrong_email": "该邀请发送到了其他邮箱地址。",
    "error.cannot_leave_sole_admin": "无法退出：你是唯一的管理员。请先转让管理员角色或移除其他成员。",
    "error.invite_not_found": "未找到邀请。",
    "error.invite_not_in_family": "该邀请不属于你的家庭。",
    "error.cannot_change_own_role": "不能修改自己的角色。",
    "error.member_not_in_family": "未在你的家庭中找到该成员。",
    "error.cannot_remove_self_use_leave": "不能移除自己，请使用退出家庭接口。",
    "error.oidc_token_required": "OIDC 认证需要 id_token。",
    "error.token_subject_mismatch": "令牌 subject 与 external_id 不一致。",
    "error.token_email_mismatch": "令牌邮箱与请求邮箱不一致。",
    "error.email_migration_requires_verification": "该邮箱已关联其他账号，迁移需要已验证的邮箱。",
    "error.no_auth_method_configured": "未配置可用的登录方式。",
    "error.notification_setting_not_found": "未找到通知设置。",
    "error.push_token_invalid": "推送令牌格式无效。",
    "error.schedule_duplicate": "已存在相同的提醒计划。",
    "error.schedule_not_found": "未找到提醒计划。",
    "message.notification_setting_deleted": "通知设置已删除",
    "message.schedule_deleted": "提醒计划已删除",
    "error.invalid_image_format": "图片格式无效。支持：JPEG、PNG、WebP、HEIC。",
    "error.duplicate_image_item": "检测到重复图片，该衣物已存在于衣橱中（ID：{item_id}）。",
    "error.bulk_max_20_images": "单次批量上传最多 20 张图片。",
    "error.bulk_at_least_one_image": "至少需要一张图片。",
    "error.job_queue_connect_failed": "无法连接任务队列。",
    "error.item_not_found": "未找到衣物。",
    "error.item_no_image": "该衣物没有图片。",
    "error.item_already_clean": "衣物已是干净状态（自上次洗涤后未穿着）。",
    "error.queue_ai_analysis_failed": "无法将 AI 分析任务加入队列。",
    "error.rotate_image_failed": "旋转图片失败。",
    "error.bg_removal_not_available": "抠图服务不可用。使用 rembg：pip install rembg[cpu]。使用 HTTP 提供方：设置 BG_REMOVAL_PROVIDER=http 与 BG_REMOVAL_URL。",
    "error.remove_background_failed": "去除背景失败。",
    "error.max_additional_images": "每件衣物最多 4 张附加图片。",
    "analytics.insight.start_add_items": "先从向衣橱里添加一些衣物开始吧！",
    "analytics.insight.never_worn": "你有 {count} 件衣物从未穿过，不妨试试新搭配！",
    "analytics.insight.heavy_color": "衣橱里 {color} 占比 {pct}%，可以考虑增加一些其他色系。",
    "analytics.insight.limited_colors": "衣橱颜色种类较少，可以尝试探索新色彩。",
    "analytics.insight.more_tops_than_bottoms": "上装明显多于下装，可以考虑添置裤装或裙装。",
    "analytics.insight.more_bottoms_than_tops": "下装多于上装，可以考虑添置一些上衣。",
    "analytics.insight.great_acceptance": "品味不错！你会接受 {rate}% 的推荐穿搭。",
    "analytics.insight.low_acceptance": "你拒绝了不少推荐，可以尝试更新风格偏好。",
    "analytics.insight.no_outfits_this_week": "本周还没有生成穿搭，试试看获取一条推荐吧！",
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
    "error.rate_limit": "Too many requests. Please try again later.",
    "error.token_invalid": "Invalid or expired token.",
    "error.not_authenticated": "Not authenticated.",
    "error.user_inactive": "User account is inactive.",
    "error.weather_location_required": "Location not set. Please provide coordinates or set your location in settings.",
    "error.weather_service_unavailable": "Weather service temporarily unavailable.",
    "error.body_measurement_positive": "{field} must be a positive number.",
    "error.url_required": "URL is required.",
    "error.url_http_https_only": "Only HTTP and HTTPS URLs are allowed.",
    "error.invalid_user_id_format": "Invalid user ID format.",
    "error.invalid_filename_format": "Invalid filename format.",
    "error.invalid_image_path": "Invalid path.",
    "error.image_not_found": "Image not found.",
    "error.insight_not_found": "Insight not found.",
    "error.admin_required": "Admin access required.",
    "error.not_in_family": "You are not in a family.",
    "error.family_not_found": "Family not found.",
    "error.already_in_family_leave_first": "You are already in a family. Leave your current family first.",
    "error.invalid_invite_code": "Invalid invite code.",
    "error.invalid_or_expired_invite": "Invalid or expired invite link.",
    "error.invite_wrong_email": "This invite was sent to a different email address.",
    "error.cannot_leave_sole_admin": "Cannot leave: you are the only admin. Transfer admin role first or remove all other members.",
    "error.invite_not_found": "Invite not found.",
    "error.invite_not_in_family": "Invite not found.",
    "error.cannot_change_own_role": "Cannot change your own role.",
    "error.member_not_in_family": "Member not found in your family.",
    "error.cannot_remove_self_use_leave": "Cannot remove yourself. Use /leave instead.",
    "error.oidc_token_required": "OIDC id_token is required for authentication.",
    "error.token_subject_mismatch": "Token subject does not match external_id.",
    "error.token_email_mismatch": "Token email does not match request email.",
    "error.email_migration_requires_verification": "Email already associated with another account. Verified email required for migration.",
    "error.no_auth_method_configured": "No authentication method configured.",
    "error.notification_setting_not_found": "Setting not found.",
    "error.push_token_invalid": "Invalid push token format.",
    "error.schedule_duplicate": "An identical schedule already exists.",
    "error.schedule_not_found": "Schedule not found.",
    "message.notification_setting_deleted": "Notification setting deleted",
    "message.schedule_deleted": "Schedule deleted",
    "error.invalid_image_format": "Invalid image file. Supported formats: JPEG, PNG, WebP, HEIC",
    "error.duplicate_image_item": "Duplicate image detected. This item already exists in your wardrobe (ID: {item_id}).",
    "error.bulk_max_20_images": "Maximum 20 images per bulk upload",
    "error.bulk_at_least_one_image": "At least one image is required",
    "error.job_queue_connect_failed": "Failed to connect to job queue",
    "error.item_not_found": "Item not found",
    "error.item_no_image": "Item has no image",
    "error.item_already_clean": "Item is already clean (0 wears since last wash)",
    "error.queue_ai_analysis_failed": "Failed to queue AI analysis",
    "error.rotate_image_failed": "Failed to rotate image",
    "error.bg_removal_not_available": "Background removal provider not available. "
    "For rembg: pip install rembg[cpu]. For HTTP provider: set BG_REMOVAL_PROVIDER=http and BG_REMOVAL_URL.",
    "error.remove_background_failed": "Failed to remove background",
    "error.max_additional_images": "Maximum of 4 additional images per item",
    "analytics.insight.start_add_items": "Start by adding some items to your wardrobe!",
    "analytics.insight.never_worn": "You have {count} items you've never worn. Consider styling them!",
    "analytics.insight.heavy_color": "Your wardrobe is heavy on {color} ({pct}%). Consider adding variety!",
    "analytics.insight.limited_colors": "Your wardrobe has limited color variety. Explore new colors!",
    "analytics.insight.more_tops_than_bottoms": "You have many more tops than bottoms. Consider adding pants or skirts!",
    "analytics.insight.more_bottoms_than_tops": "You have more bottoms than tops. Consider adding some shirts!",
    "analytics.insight.great_acceptance": "Great taste! You accept {rate}% of suggestions.",
    "analytics.insight.low_acceptance": "You reject many suggestions. Consider updating your style preferences.",
    "analytics.insight.no_outfits_this_week": "You haven't generated any outfits this week. Try getting a suggestion!",
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
