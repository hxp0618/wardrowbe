import re
from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, field_validator

from app.config import get_settings
from app.utils.network import validate_public_url


# Channel-specific configurations
class NtfyConfig(BaseModel):
    server: str = "https://ntfy.sh"
    topic: str
    token: str | None = None

    @field_validator("server")
    @classmethod
    def validate_server(cls, v: str) -> str:
        if not v.startswith("http://") and not v.startswith("https://"):
            raise ValueError("Server URL must start with http:// or https://")
        if len(v) > 500:
            raise ValueError("Server URL must be 500 characters or fewer")
        return v.rstrip("/")

    @field_validator("topic")
    @classmethod
    def validate_topic(cls, v: str) -> str:
        if not v or len(v) < 3:
            raise ValueError("Topic must be at least 3 characters")
        if not v.replace("-", "").replace("_", "").isalnum():
            raise ValueError("Topic can only contain letters, numbers, - and _")
        return v


class MattermostConfig(BaseModel):
    webhook_url: str

    @field_validator("webhook_url")
    @classmethod
    def validate_webhook(cls, v: str) -> str:
        if not v.startswith("https://"):
            raise ValueError("Webhook URL must use HTTPS")
        if "/hooks/" not in v:
            raise ValueError("Invalid Mattermost webhook URL format")
        return v


class EmailConfig(BaseModel):
    address: str

    @field_validator("address")
    @classmethod
    def validate_email(cls, v: str) -> str:
        pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
        if not re.match(pattern, v):
            raise ValueError("Invalid email address")
        return v


class ExpoPushConfig(BaseModel):
    push_token: str

    @field_validator("push_token")
    @classmethod
    def validate_token(cls, v: str) -> str:
        if not v.startswith("ExponentPushToken[") and not v.startswith("ExpoPushToken["):
            raise ValueError("Invalid Expo push token format")
        return v


class BarkConfig(BaseModel):
    """Bark (iOS) push via HTTP API — https://github.com/Finb/Bark"""

    server: str = "https://api.day.app"
    device_key: str
    group: str | None = "Wardrowbe"

    @field_validator("server")
    @classmethod
    def validate_server(cls, v: str) -> str:
        if not v.startswith("http://") and not v.startswith("https://"):
            raise ValueError("Server URL must start with http:// or https://")
        if len(v) > 500:
            raise ValueError("Server URL must be 500 characters or fewer")
        return v.rstrip("/")

    @field_validator("device_key")
    @classmethod
    def validate_device_key(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 8:
            raise ValueError("device_key must be at least 8 characters")
        if len(v) > 500:
            raise ValueError("device_key must be 500 characters or fewer")
        return v

    @field_validator("group")
    @classmethod
    def validate_group(cls, v: str | None) -> str | None:
        if v is None or v == "":
            return None
        if len(v) > 100:
            raise ValueError("group must be 100 characters or fewer")
        return v


WEBHOOK_FORMATS = {
    "json",
    "discord",
    "slack",
    "telegram",
    "lark",
    "feishu",
    "dingtalk",
    "wecom",
    "teams",
}


class WebhookConfig(BaseModel):
    """Generic outbound webhook that can target custom endpoints or popular IM platforms.

    ``format`` selects the payload shape built by the provider. ``template`` is an
    optional JSON string (used only when ``format == "json"``) supporting placeholders
    like ``{title}``, ``{body}``, ``{url}``, ``{occasion}``, ``{day}``, ``{temperature}``,
    ``{condition}``. ``chat_id`` is required for ``format == "telegram"`` (the webhook
    URL should be the bot's ``sendMessage`` endpoint).
    """

    url: str
    method: Literal["POST", "PUT", "PATCH"] = "POST"
    format: Literal[
        "json",
        "discord",
        "slack",
        "telegram",
        "lark",
        "feishu",
        "dingtalk",
        "wecom",
        "teams",
    ] = "json"
    headers: dict[str, str] | None = None
    template: str | None = None
    chat_id: str | None = None
    verify_tls: bool = True

    @field_validator("url")
    @classmethod
    def validate_url(cls, v: str) -> str:
        v = v.strip()
        if not v.startswith("http://") and not v.startswith("https://"):
            raise ValueError("Webhook URL must start with http:// or https://")
        if len(v) > 2000:
            raise ValueError("Webhook URL must be 2000 characters or fewer")
        return validate_public_url(v, allow_private=get_settings().allow_private_webhook)

    @field_validator("headers")
    @classmethod
    def validate_headers(cls, v: dict[str, str] | None) -> dict[str, str] | None:
        if v is None:
            return None
        if len(v) > 20:
            raise ValueError("At most 20 custom headers are allowed")
        for key, val in v.items():
            if not isinstance(key, str) or not isinstance(val, str):
                raise ValueError("Header keys and values must be strings")
            if len(key) > 100 or len(val) > 1000:
                raise ValueError("Header key must be <= 100 and value <= 1000 characters")
        return v

    @field_validator("template")
    @classmethod
    def validate_template(cls, v: str | None) -> str | None:
        if v is None:
            return None
        v = v.strip()
        if not v:
            return None
        if len(v) > 4000:
            raise ValueError("Template must be 4000 characters or fewer")
        return v

    @field_validator("chat_id")
    @classmethod
    def validate_chat_id(cls, v: str | None) -> str | None:
        if v is None or v == "":
            return None
        v = v.strip()
        if len(v) > 100:
            raise ValueError("chat_id must be 100 characters or fewer")
        return v


# Notification settings schemas
class NotificationSettingsBase(BaseModel):
    channel: Literal["ntfy", "mattermost", "email", "expo_push", "bark", "webhook"]
    enabled: bool = True
    priority: int = 1
    config: dict


class NotificationSettingsCreate(NotificationSettingsBase):
    pass


class NotificationSettingsUpdate(BaseModel):
    enabled: bool | None = None
    priority: int | None = None
    config: dict | None = None


class NotificationSettingsResponse(NotificationSettingsBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


VALID_OCCASIONS = {"casual", "office", "formal", "date", "sporty", "outdoor", "work", "party"}


# Schedule schemas
class ScheduleBase(BaseModel):
    day_of_week: int  # 0=Monday, 6=Sunday (day to WEAR the outfit)
    notification_time: str  # HH:MM format
    occasion: str = "casual"
    enabled: bool = True
    notify_day_before: bool = False  # If True, notification comes evening before

    @field_validator("occasion")
    @classmethod
    def validate_occasion(cls, v: str) -> str:
        v = v.strip().lower()
        if v not in VALID_OCCASIONS:
            raise ValueError(
                f"Invalid occasion. Must be one of: {', '.join(sorted(VALID_OCCASIONS))}"
            )
        return v

    @field_validator("day_of_week")
    @classmethod
    def validate_day(cls, v: int) -> int:
        if v < 0 or v > 6:
            raise ValueError("day_of_week must be 0-6 (Monday-Sunday)")
        return v

    @field_validator("notification_time")
    @classmethod
    def validate_time(cls, v: str) -> str:
        if not re.match(r"^([01]?[0-9]|2[0-3]):[0-5][0-9]$", v):
            raise ValueError("notification_time must be in HH:MM format")
        return v


class ScheduleCreate(ScheduleBase):
    pass


class ScheduleUpdate(BaseModel):
    notification_time: str | None = None
    occasion: str | None = None
    enabled: bool | None = None
    notify_day_before: bool | None = None

    @field_validator("occasion")
    @classmethod
    def validate_occasion(cls, v: str | None) -> str | None:
        if v is not None:
            v = v.strip().lower()
            if v not in VALID_OCCASIONS:
                raise ValueError(
                    f"Invalid occasion. Must be one of: {', '.join(sorted(VALID_OCCASIONS))}"
                )
        return v

    @field_validator("notification_time")
    @classmethod
    def validate_time(cls, v: str | None) -> str | None:
        if v is not None and not re.match(r"^([01]?[0-9]|2[0-3]):[0-5][0-9]$", v):
            raise ValueError("notification_time must be in HH:MM format")
        return v


class ScheduleResponse(BaseModel):
    id: UUID
    user_id: UUID
    day_of_week: int
    notification_time: str  # Converted from Time object
    occasion: str
    enabled: bool
    notify_day_before: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

    @field_validator("notification_time", mode="before")
    @classmethod
    def convert_time(cls, v):
        if hasattr(v, "strftime"):
            return v.strftime("%H:%M")
        return v


# Notification delivery tracking
class NotificationResponse(BaseModel):
    id: UUID
    user_id: UUID
    outfit_id: UUID | None
    channel: str
    status: str
    attempts: int
    sent_at: datetime | None
    delivered_at: datetime | None
    error_message: str | None
    created_at: datetime

    class Config:
        from_attributes = True


class TestNotificationRequest(BaseModel):
    pass


class TestNotificationResponse(BaseModel):
    success: bool
    message: str


class MessageResponse(BaseModel):
    message: str
