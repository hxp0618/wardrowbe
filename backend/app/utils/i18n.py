"""API message localization. Default locale is Chinese (zh); English (en) via Accept-Language."""

from __future__ import annotations

import re

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
    "error.max_images_per_item": "单件衣物最多 5 张图片（1 张主图 + 4 张附加图）。",
    "error.folder_not_found": "未找到文件夹。",
    "error.duplicate_items": "选择的物品中存在重复项。",
    "error.target_date_in_past": "目标日期不能早于今天。",
    "error.target_date_too_far": "目标日期超出预报范围（最多 15 天后）。",
    "error.backup_too_large": "备份文件过大。",
    "error.backup_invalid_zip": "无效的 ZIP 文件。",
    "error.backup_missing_metadata": "备份缺少 metadata.json。",
    "error.backup_unsupported_version": "备份版本不受支持。",
    "analytics.insight.start_add_items": "先从向衣橱里添加一些衣物开始吧！",
    "analytics.insight.never_worn": "你有 {count} 件衣物从未穿过，不妨试试新搭配！",
    "analytics.insight.heavy_color": "衣橱里 {color} 占比 {pct}%，可以考虑增加一些其他色系。",
    "analytics.insight.limited_colors": "衣橱颜色种类较少，可以尝试探索新色彩。",
    "analytics.insight.more_tops_than_bottoms": "上装明显多于下装，可以考虑添置裤装或裙装。",
    "analytics.insight.more_bottoms_than_tops": "下装多于上装，可以考虑添置一些上衣。",
    "analytics.insight.great_acceptance": "品味不错！你会接受 {rate}% 的推荐穿搭。",
    "analytics.insight.low_acceptance": "你拒绝了不少推荐，可以尝试更新风格偏好。",
    "analytics.insight.no_outfits_this_week": "本周还没有生成穿搭，试试看获取一条推荐吧！",
    "learning.interpretation.strongly_liked": "非常喜欢",
    "learning.interpretation.liked": "喜欢",
    "learning.interpretation.neutral": "一般",
    "learning.interpretation.disliked": "不太喜欢",
    "learning.interpretation.strongly_disliked": "很不喜欢",
    "learning.insight.love_color_title": "你很喜欢{color}！",
    "learning.insight.love_color_desc": "你的反馈显示你明显偏爱{color}色单品，我们会在推荐中优先考虑这些颜色。",
    "learning.insight.avoid_color_title": "对{color}不太感冒",
    "learning.insight.avoid_color_desc": "你常会拒绝包含{color}的穿搭，我们会尽量提供替代方案。",
    "learning.insight.great_match_title": "非常合拍！",
    "learning.insight.great_match_desc": "你会接受我们 {pct}% 的推荐，我们正在更好地了解你的风格。",
    "learning.insight.help_learn_title": "帮我们了解你的风格",
    "learning.insight.help_learn_desc": "你拒绝了不少推荐，可以更新偏好设置以帮助我们改进。",
    "learning.insight.style_pattern_title": "你的风格：{style}",
    "learning.insight.style_pattern_desc": "根据你的反馈，你更偏向 {styles} 等风格。",
    "validation.ntfy_server_scheme": "服务器地址必须以 http:// 或 https:// 开头。",
    "validation.ntfy_server_max_len": "服务器地址不能超过 500 个字符。",
    "validation.ntfy_topic_min_len": "主题至少需要 3 个字符。",
    "validation.ntfy_topic_chars": "主题只能包含字母、数字、连字符和下划线。",
    "validation.mattermost_https": "Webhook 地址必须使用 HTTPS。",
    "validation.mattermost_webhook_format": "Mattermost Webhook 地址格式无效。",
    "validation.webhook_private_address": "Webhook 地址不能指向本机或私有网络地址。",
    "validation.email_invalid": "邮箱地址格式无效。",
    "validation.expo_token_invalid": "Expo 推送令牌格式无效。",
    "validation.day_of_week_range": "星期几必须是 0–6（周一至周日）。",
    "validation.notification_time_format": "提醒时间必须为 HH:MM 格式。",
    "validation.bulk_select_required": "必须提供 item_ids，或设置 select_all=true。",
    "validation.bulk_select_exclusive": "不能同时使用 item_ids 与 select_all。",
    "error.unsupported_file_type": "不支持的文件类型：{ext}",
    "error.image_file_missing": "找不到图片文件。",
    "error.email_update_conflict": "无法将邮箱更新为 {email}：该邮箱已被其他账号使用。",
    "error.notification_channel_exists": "已配置 {channel} 通道，请勿重复添加。",
    "error.bulk_invalid_format": "图片格式无效。支持：JPEG、PNG、WebP、HEIC。",
    "error.bulk_duplicate_short": "重复图片，衣橱中已存在。",
    "error.bulk_process_failed": "处理图片失败。",
    "error.ai_parse_json_failed": "无法解析 AI 返回的 JSON。",
    "error.ai_response_not_dict": "AI 返回格式应为对象，但实际不是。",
    "error.oidc_discovery_failed": "无法连接 OIDC 提供商，请稍后重试。",
    "error.oidc_token_invalid": "OIDC 令牌无效或已过期。",
    "auth.status_no_method_configured": "未配置登录方式。请设置 OIDC_ISSUER_URL 与 OIDC_CLIENT_ID，或开启 DEBUG 模式。",
    "error.weather_latitude_range": "纬度 {value} 无效，必须在 -90 到 90 之间。",
    "error.weather_longitude_range": "经度 {value} 无效，必须在 -180 到 180 之间。",
    "error.field_required": "缺少必填字段。",
    "notification.dispatch.user_not_found": "未找到用户。",
    "notification.dispatch.outfit_not_found": "未找到穿搭。",
    "notification.dispatch.no_channels": "未配置任何通知渠道。",
    "notification.dispatch.channel_disabled": "通道 {channel} 未配置或已禁用。",
    "notification.dispatch.unknown_channel": "未知通道：{channel}",
    "notification.day.today": "今天",
    "notification.day.tomorrow": "明天",
    "notification.greeting.morning": "早上好",
    "notification.greeting.evening": "晚上好",
    "notification.outfit.ready": "你的穿搭已准备好。",
    "notification.outfit.ready_exclaim": "你的穿搭已准备好！",
    "notification.tip.label": "小贴士：",
    "notification.weather.forecast_suffix": "（预报）",
    "notification.weather.unknown": "未知",
    "notification.ntfy.title_weather": "{day}的{occasion} · {temp}°C",
    "notification.ntfy.title_no_temp": "{day}的{occasion}穿搭",
    "notification.mm.attachment_title": "{day}的穿搭：{occasion}{weather}",
    "notification.mm.body_intro": "{greeting}，{name}！这是您{day}的穿搭建议：",
    "notification.email.reasoning_fallback": "你的穿搭已准备好！",
    "notification.email.cta_view": "查看穿搭",
    "notification.email.manage_link": "管理通知设置",
    "notification.email.footer_sent": "由 Wardrowbe 发送",
    "notification.email.subject": "{day}的穿搭：{occasion}",
    "notification.email.text_header": "Wardrowbe - {day}的穿搭",
    "notification.email.text_occasion": "场合：{occasion}",
    "notification.email.text_view_link": "查看穿搭：{url}",
    "notification.expo.body_fallback": "你的穿搭已准备好！",
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
    "error.max_images_per_item": "Maximum 5 images per item (1 primary + up to 4 additional)",
    "error.folder_not_found": "Folder not found",
    "error.duplicate_items": "Selected items contain duplicates",
    "error.target_date_in_past": "Target date must be today or later",
    "error.target_date_too_far": "Target date is beyond the 15-day forecast window",
    "error.backup_too_large": "Backup archive is too large",
    "error.backup_invalid_zip": "Invalid ZIP archive",
    "error.backup_missing_metadata": "Backup is missing metadata.json",
    "error.backup_unsupported_version": "Unsupported backup version",
    "analytics.insight.start_add_items": "Start by adding some items to your wardrobe!",
    "analytics.insight.never_worn": "You have {count} items you've never worn. Consider styling them!",
    "analytics.insight.heavy_color": "Your wardrobe is heavy on {color} ({pct}%). Consider adding variety!",
    "analytics.insight.limited_colors": "Your wardrobe has limited color variety. Explore new colors!",
    "analytics.insight.more_tops_than_bottoms": "You have many more tops than bottoms. Consider adding pants or skirts!",
    "analytics.insight.more_bottoms_than_tops": "You have more bottoms than tops. Consider adding some shirts!",
    "analytics.insight.great_acceptance": "Great taste! You accept {rate}% of suggestions.",
    "analytics.insight.low_acceptance": "You reject many suggestions. Consider updating your style preferences.",
    "analytics.insight.no_outfits_this_week": "You haven't generated any outfits this week. Try getting a suggestion!",
    "learning.interpretation.strongly_liked": "strongly liked",
    "learning.interpretation.liked": "liked",
    "learning.interpretation.neutral": "neutral",
    "learning.interpretation.disliked": "disliked",
    "learning.interpretation.strongly_disliked": "strongly disliked",
    "learning.insight.love_color_title": "You love {color}!",
    "learning.insight.love_color_desc": "Your feedback shows a strong preference for {color} items. We'll prioritize these in your recommendations.",
    "learning.insight.avoid_color_title": "Not a fan of {color}",
    "learning.insight.avoid_color_desc": "You tend to reject outfits with {color}. We'll suggest alternatives.",
    "learning.insight.great_match_title": "Great match!",
    "learning.insight.great_match_desc": "You accept {pct}% of our suggestions. We're learning your style well!",
    "learning.insight.help_learn_title": "Help us learn your style",
    "learning.insight.help_learn_desc": "You've rejected many suggestions. Consider updating your preferences to help us improve.",
    "learning.insight.style_pattern_title": "Your style: {style}",
    "learning.insight.style_pattern_desc": "Based on your feedback, you gravitate towards {styles} styles.",
    "validation.ntfy_server_scheme": "Server URL must start with http:// or https://",
    "validation.ntfy_server_max_len": "Server URL must be 500 characters or fewer",
    "validation.ntfy_topic_min_len": "Topic must be at least 3 characters",
    "validation.ntfy_topic_chars": "Topic can only contain letters, numbers, - and _",
    "validation.mattermost_https": "Webhook URL must use HTTPS",
    "validation.mattermost_webhook_format": "Invalid Mattermost webhook URL format",
    "validation.webhook_private_address": "Webhook URL must not target localhost or private network addresses",
    "validation.email_invalid": "Invalid email address",
    "validation.expo_token_invalid": "Invalid Expo push token format",
    "validation.day_of_week_range": "day_of_week must be 0-6 (Monday-Sunday)",
    "validation.notification_time_format": "notification_time must be in HH:MM format",
    "validation.bulk_select_required": "Either item_ids or select_all=True must be provided",
    "validation.bulk_select_exclusive": "Cannot use both item_ids and select_all",
    "error.unsupported_file_type": "Unsupported file type: {ext}",
    "error.image_file_missing": "Image file not found.",
    "error.email_update_conflict": "Cannot update email to {email}: already in use by another account.",
    "error.notification_channel_exists": "Channel {channel} is already configured",
    "error.bulk_invalid_format": "Invalid image format. Supported: JPEG, PNG, WebP, HEIC",
    "error.bulk_duplicate_short": "Duplicate image — already exists in wardrobe",
    "error.bulk_process_failed": "Failed to process image",
    "error.ai_parse_json_failed": "Could not parse AI response as JSON.",
    "error.ai_response_not_dict": "Expected dict from AI response.",
    "error.oidc_discovery_failed": "Failed to contact OIDC provider",
    "error.oidc_token_invalid": "Invalid OIDC token",
    "auth.status_no_method_configured": "No authentication method configured. "
    "Set OIDC_ISSUER_URL + OIDC_CLIENT_ID, or enable DEBUG mode.",
    "error.weather_latitude_range": "Invalid latitude {value}: must be between -90 and 90",
    "error.weather_longitude_range": "Invalid longitude {value}: must be between -180 and 180",
    "error.field_required": "Field required",
    "notification.dispatch.user_not_found": "User not found",
    "notification.dispatch.outfit_not_found": "Outfit not found",
    "notification.dispatch.no_channels": "No notification channels configured",
    "notification.dispatch.channel_disabled": "Channel {channel} not configured or disabled",
    "notification.dispatch.unknown_channel": "Unknown channel: {channel}",
    "notification.day.today": "Today",
    "notification.day.tomorrow": "Tomorrow",
    "notification.greeting.morning": "Good morning",
    "notification.greeting.evening": "Good evening",
    "notification.outfit.ready": "Your outfit is ready.",
    "notification.outfit.ready_exclaim": "Your outfit is ready!",
    "notification.tip.label": "Tip:",
    "notification.weather.forecast_suffix": " (forecast)",
    "notification.weather.unknown": "Unknown",
    "notification.ntfy.title_weather": "{day}'s {occasion} - {temp}°C",
    "notification.ntfy.title_no_temp": "{day}'s {occasion} Outfit",
    "notification.mm.attachment_title": "{day}'s Outfit: {occasion}{weather}",
    "notification.mm.body_intro": "{greeting}, {name}! Here's your outfit suggestion for {day}:",
    "notification.email.reasoning_fallback": "Your outfit is ready!",
    "notification.email.cta_view": "View Outfit",
    "notification.email.manage_link": "Manage notification settings",
    "notification.email.footer_sent": "Sent by Wardrowbe",
    "notification.email.subject": "{day}'s Outfit: {occasion}",
    "notification.email.text_header": "Wardrowbe - {day}'s Outfit",
    "notification.email.text_occasion": "Occasion: {occasion}",
    "notification.email.text_view_link": "View outfit: {url}",
    "notification.expo.body_fallback": "Your outfit is ready!",
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


# Map exact English strings from Pydantic validators to i18n keys
_VALIDATION_MSG_TO_KEY: dict[str, str] = {
    "Server URL must start with http:// or https://": "validation.ntfy_server_scheme",
    "Server URL must be 500 characters or fewer": "validation.ntfy_server_max_len",
    "Topic must be at least 3 characters": "validation.ntfy_topic_min_len",
    "Topic can only contain letters, numbers, - and _": "validation.ntfy_topic_chars",
    "Webhook URL must use HTTPS": "validation.mattermost_https",
    "Invalid Mattermost webhook URL format": "validation.mattermost_webhook_format",
    "Webhook URL must not target localhost or private network addresses": "validation.webhook_private_address",
    "Invalid email address": "validation.email_invalid",
    "Invalid Expo push token format": "validation.expo_token_invalid",
    "day_of_week must be 0-6 (Monday-Sunday)": "validation.day_of_week_range",
    "notification_time must be in HH:MM format": "validation.notification_time_format",
    "Either item_ids or select_all=True must be provided": "validation.bulk_select_required",
    "Cannot use both item_ids and select_all": "validation.bulk_select_exclusive",
}

_INVALID_OCCASION_RE = re.compile(r"^Invalid occasion\. Must be one of: (.+)$", re.DOTALL)
_CHANNEL_CONFIGURED_RE = re.compile(r"^Channel (\w+) already configured$")
_WEATHER_LAT_RE = re.compile(r"^Invalid latitude (.+): must be between -90 and 90$")
_WEATHER_LON_RE = re.compile(r"^Invalid longitude (.+): must be between -180 and 180$")
_CHANNEL_DISABLED_RE = re.compile(r"^Channel (\w+) not configured or disabled$")
_UNKNOWN_CHANNEL_RE = re.compile(r"^Unknown channel: (.+)$")


def translate_validation_message(msg: str, request: Request | None) -> str:
    """Translate known English validation / ValueError messages; pass through unknown."""
    locale = resolve_locale(request)
    s = msg.strip()
    if s in _VALIDATION_MSG_TO_KEY:
        return translate(locale, _VALIDATION_MSG_TO_KEY[s])
    m = _INVALID_OCCASION_RE.match(s)
    if m:
        return translate(locale, "error.invalid_occasion", occasions=m.group(1).strip())
    if s.startswith("Unsupported file type: "):
        ext = s.split(": ", 1)[-1]
        return translate(locale, "error.unsupported_file_type", ext=ext)
    if s.startswith("Image not found: "):
        return translate(locale, "error.image_file_missing")
    m_ch = _CHANNEL_CONFIGURED_RE.match(s)
    if m_ch:
        return translate(locale, "error.notification_channel_exists", channel=m_ch.group(1))
    if s.startswith("Cannot update email to ") and "already in use" in s:
        rest = s.removeprefix("Cannot update email to ")
        email_part = rest.split(":", 1)[0].strip()
        return translate(locale, "error.email_update_conflict", email=email_part)
    if s.startswith("Could not parse AI response as JSON"):
        return translate(locale, "error.ai_parse_json_failed")
    if s.startswith("Expected dict, got"):
        return translate(locale, "error.ai_response_not_dict")
    if s == "Failed to contact OIDC provider":
        return translate(locale, "error.oidc_discovery_failed")
    if s == "Invalid OIDC token":
        return translate(locale, "error.oidc_token_invalid")
    m_lat = _WEATHER_LAT_RE.match(s)
    if m_lat:
        return translate(locale, "error.weather_latitude_range", value=m_lat.group(1).strip())
    m_lon = _WEATHER_LON_RE.match(s)
    if m_lon:
        return translate(locale, "error.weather_longitude_range", value=m_lon.group(1).strip())
    if s == "Field required":
        return translate(locale, "error.field_required")
    if s == "User not found":
        return translate(locale, "notification.dispatch.user_not_found")
    if s == "Outfit not found":
        return translate(locale, "notification.dispatch.outfit_not_found")
    if s == "No notification channels configured":
        return translate(locale, "notification.dispatch.no_channels")
    m_cd = _CHANNEL_DISABLED_RE.match(s)
    if m_cd:
        return translate(locale, "notification.dispatch.channel_disabled", channel=m_cd.group(1))
    m_uk = _UNKNOWN_CHANNEL_RE.match(s)
    if m_uk:
        return translate(locale, "notification.dispatch.unknown_channel", channel=m_uk.group(1))
    return msg
