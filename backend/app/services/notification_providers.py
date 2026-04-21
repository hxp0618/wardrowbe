import json
import logging
import os
from dataclasses import dataclass, field
from typing import Any
from urllib.parse import urljoin

import httpx

from app.config import get_settings
from app.schemas.notification import (
    BarkConfig,
    EmailConfig,
    ExpoPushConfig,
    MattermostConfig,
    NtfyConfig,
    WebhookConfig,
)
from app.utils.network import validate_outbound_url

logger = logging.getLogger(__name__)


# ntfy Provider
@dataclass
class NtfyNotification:
    topic: str
    title: str
    message: str
    tags: list[str] = field(default_factory=list)
    priority: int = 3  # 1-5, 3 is default
    click: str | None = None
    attach: str | None = None
    actions: list[dict] | None = None


class NtfyProvider:
    def __init__(self, config: NtfyConfig):
        self.server = config.server.rstrip("/")
        self.topic = config.topic
        self.token = config.token

    async def send(self, notification: NtfyNotification) -> dict:
        headers = {
            "Title": notification.title,
            "Priority": str(notification.priority),
        }

        if notification.tags:
            headers["Tags"] = ",".join(notification.tags)

        if notification.click:
            headers["Click"] = notification.click

        if notification.attach:
            headers["Attach"] = notification.attach

        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"

        if notification.actions:
            actions = []
            for action in notification.actions:
                actions.append(f"{action['type']}, {action['label']}, {action['url']}")
            headers["Actions"] = "; ".join(actions)

        try:
            async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
                response = await client.post(
                    f"{self.server}/{notification.topic or self.topic}",
                    headers=headers,
                    content=notification.message,
                )

                if response.status_code == 200:
                    return {"success": True, "response": response.json()}
                else:
                    error = f"HTTP {response.status_code}: {response.text}"
                    logger.warning("ntfy request failed: %s", error)
                    return {"success": False, "error": error}
        except Exception as e:
            logger.exception("ntfy send failed")
            return {"success": False, "error": str(e)}

    async def test_connection(self) -> tuple[bool, str]:
        try:
            result = await self.send(
                NtfyNotification(
                    topic=self.topic,
                    title="Wardrowbe Test",
                    message="This is a test notification from Wardrowbe.",
                    tags=["white_check_mark", "shirt"],
                    priority=2,
                )
            )
            if result.get("success"):
                return True, "Test notification sent successfully"
            return False, result.get("error", "Unknown error")
        except Exception as e:
            return False, str(e)


# Mattermost Provider
@dataclass
class MattermostAttachment:
    title: str
    text: str = ""
    color: str = "#3B82F6"
    fields: list[dict] = field(default_factory=list)
    thumb_url: str | None = None
    image_url: str | None = None
    actions: list[dict] = field(default_factory=list)


@dataclass
class MattermostMessage:
    text: str
    username: str = "Wardrowbe"
    icon_emoji: str = ":shirt:"
    attachments: list[MattermostAttachment] = field(default_factory=list)


class MattermostProvider:
    def __init__(self, config: MattermostConfig):
        self.webhook_url = config.webhook_url

    async def send(self, message: MattermostMessage) -> dict:
        payload = {
            "text": message.text,
            "username": message.username,
            "icon_emoji": message.icon_emoji,
        }

        if message.attachments:
            payload["attachments"] = [
                {
                    "title": a.title,
                    "text": a.text,
                    "color": a.color,
                    "fields": a.fields,
                    "thumb_url": a.thumb_url,
                    "image_url": a.image_url,
                    "actions": a.actions,
                }
                for a in message.attachments
            ]

        try:
            async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
                response = await client.post(self.webhook_url, json=payload)

                if response.status_code == 200:
                    return {"success": True}
                else:
                    error = f"HTTP {response.status_code}: {response.text}"
                    logger.warning("Mattermost request failed: %s", error)
                    return {"success": False, "error": error}
        except Exception as e:
            logger.exception("Mattermost send failed")
            return {"success": False, "error": str(e)}

    async def test_connection(self) -> tuple[bool, str]:
        try:
            result = await self.send(
                MattermostMessage(text="This is a test message from Wardrowbe.")
            )
            if result.get("success"):
                return True, "Test notification sent successfully"
            return False, result.get("error", "Unknown error")
        except Exception as e:
            return False, str(e)


# Bark Provider (iOS — Fin Bark)
@dataclass
class BarkMessage:
    title: str
    body: str
    url: str | None = None


class BarkProvider:
    def __init__(self, config: BarkConfig):
        self.server = config.server.rstrip("/")
        self.device_key = config.device_key
        self.group = config.group

    async def send(self, message: BarkMessage) -> dict:
        payload: dict = {
            "device_key": self.device_key,
            "title": message.title,
            "body": message.body,
        }
        if self.group:
            payload["group"] = self.group
        if message.url:
            payload["url"] = message.url

        push_url = f"{self.server}/push"
        try:
            async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
                response = await client.post(
                    push_url,
                    json=payload,
                    headers={"Content-Type": "application/json"},
                )
                if response.status_code != 200:
                    error = f"HTTP {response.status_code}: {response.text}"
                    logger.warning("Bark request failed: %s", error)
                    return {"success": False, "error": error}
                try:
                    data = response.json()
                except Exception:
                    return {"success": True}
                code = data.get("code", 200)
                if code == 200:
                    return {"success": True, "response": data}
                err_msg = data.get("message", str(data))
                logger.warning("Bark API error: %s", err_msg)
                return {"success": False, "error": err_msg}
        except Exception as e:
            logger.exception("Bark send failed")
            return {"success": False, "error": str(e)}

    async def test_connection(self) -> tuple[bool, str]:
        try:
            result = await self.send(
                BarkMessage(
                    title="Wardrowbe Test",
                    body="This is a test notification from Wardrowbe.",
                )
            )
            if result.get("success"):
                return True, "Test notification sent successfully"
            return False, result.get("error", "Unknown error")
        except Exception as e:
            return False, str(e)


# Email Provider
@dataclass
class EmailMessage:
    to: str
    subject: str
    html_body: str
    text_body: str = ""


class EmailProvider:
    def __init__(self, config: EmailConfig):
        self.to_address = config.address
        self.smtp_host = os.getenv("SMTP_HOST")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.smtp_user = os.getenv("SMTP_USER")
        self.smtp_password = os.getenv("SMTP_PASSWORD")
        self.smtp_use_tls = os.getenv("SMTP_USE_TLS", "true").lower() == "true"
        self.from_name = os.getenv("SMTP_FROM_NAME", "Wardrowbe")
        self.from_email = os.getenv("SMTP_FROM_EMAIL", self.smtp_user)

    def is_configured(self) -> bool:
        return bool(self.smtp_host and self.smtp_user)

    async def send(self, message: EmailMessage) -> dict:
        if not self.is_configured():
            return {"success": False, "error": "SMTP not configured"}

        try:
            from email.mime.multipart import MIMEMultipart
            from email.mime.text import MIMEText

            import aiosmtplib

            msg = MIMEMultipart("alternative")
            msg["Subject"] = message.subject
            msg["From"] = f"{self.from_name} <{self.from_email}>"
            msg["To"] = message.to

            if message.text_body:
                msg.attach(MIMEText(message.text_body, "plain"))

            msg.attach(MIMEText(message.html_body, "html"))

            await aiosmtplib.send(
                msg,
                hostname=self.smtp_host,
                port=self.smtp_port,
                username=self.smtp_user,
                password=self.smtp_password,
                start_tls=self.smtp_use_tls,
            )
            return {"success": True}
        except ImportError:
            return {"success": False, "error": "aiosmtplib not installed"}
        except Exception as e:
            logger.exception("Email send failed")
            return {"success": False, "error": str(e)}

    async def test_connection(self) -> tuple[bool, str]:
        if not self.is_configured():
            return False, "SMTP not configured"

        try:
            result = await self.send(
                EmailMessage(
                    to=self.to_address,
                    subject="Wardrowbe - Test Notification",
                    html_body="<p>This is a test email from Wardrowbe.</p>",
                    text_body="This is a test email from Wardrowbe.",
                )
            )
            if result.get("success"):
                return True, "Test email sent successfully"
            return False, result.get("error", "Unknown error")
        except Exception as e:
            return False, str(e)


# Expo Push Provider
EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"


@dataclass
class ExpoPushMessage:
    to: str
    title: str
    body: str
    data: dict | None = None
    sound: str = "default"
    badge: int | None = None
    channel_id: str = "outfit-suggestions"


class ExpoPushProvider:
    def __init__(self, config: ExpoPushConfig):
        self.push_token = config.push_token

    async def send(self, message: ExpoPushMessage) -> dict:
        payload = {
            "to": message.to or self.push_token,
            "title": message.title,
            "body": message.body,
            "sound": message.sound,
            "channelId": message.channel_id,
        }
        if message.data:
            payload["data"] = message.data
        if message.badge is not None:
            payload["badge"] = message.badge

        try:
            async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
                response = await client.post(
                    EXPO_PUSH_URL,
                    json=payload,
                    headers={"Content-Type": "application/json"},
                )

                if response.status_code == 200:
                    result = response.json()
                    ticket = result.get("data", {})
                    if ticket.get("status") == "ok":
                        return {"success": True, "ticket_id": ticket.get("id")}
                    else:
                        return {
                            "success": False,
                            "error": ticket.get("message", "Push send failed"),
                        }
                else:
                    return {
                        "success": False,
                        "error": f"HTTP {response.status_code}: {response.text}",
                    }
        except Exception as e:
            logger.exception("Expo push send failed")
            return {"success": False, "error": str(e)}

    async def test_connection(self) -> tuple[bool, str]:
        try:
            result = await self.send(
                ExpoPushMessage(
                    to=self.push_token,
                    title="Wardrowbe Test",
                    body="Push notifications are working!",
                )
            )
            if result.get("success"):
                return True, "Test push notification sent successfully"
            return False, result.get("error", "Unknown error")
        except Exception as e:
            return False, str(e)


# Generic Webhook Provider (supports Discord/Slack/Telegram/Lark/DingTalk/WeCom/Teams/JSON)
@dataclass
class WebhookMessage:
    title: str
    body: str
    url: str | None = None
    occasion: str | None = None
    day: str | None = None
    temperature: float | int | None = None
    condition: str | None = None
    highlights: list[str] = field(default_factory=list)
    tip: str | None = None
    extra: dict[str, Any] = field(default_factory=dict)


class WebhookProvider:
    """Generic HTTP webhook with format presets for common IM platforms.

    Supported formats:
      - ``json``: default structured payload or user-provided ``template``
      - ``discord``: Discord-compatible ``content`` + ``embeds``
      - ``slack`` / ``teams``: Slack-compatible ``text``
      - ``telegram``: Telegram Bot API ``sendMessage`` payload (requires ``chat_id``)
      - ``lark`` / ``feishu``: Lark/Feishu incoming-webhook text message
      - ``dingtalk``: DingTalk incoming-webhook text message
      - ``wecom``: WeCom (企业微信) group robot text message
    """

    def __init__(self, config: WebhookConfig):
        self.url = config.url
        self.method = config.method or "POST"
        self.preset = config.preset or "generic"
        self.content_type = config.content_type or "application/json"
        self.headers = dict(config.headers or {})
        self.template = config.template
        self.chat_id = config.chat_id

    def _text_summary(self, message: WebhookMessage) -> str:
        parts: list[str] = []
        if message.body:
            parts.append(message.body)
        if message.highlights:
            parts.append("\n".join(f"• {h}" for h in message.highlights[:3]))
        if message.tip:
            parts.append(f"Tip: {message.tip}")
        return "\n\n".join(parts) if parts else message.title

    def _render_template(self, message: WebhookMessage) -> dict[str, Any] | list[Any] | str | None:
        if not self.template:
            return None
        try:
            values = {
                "title": message.title,
                "body": message.body,
                "url": message.url or "",
                "occasion": message.occasion or "",
                "day": message.day or "",
                "temperature": "" if message.temperature is None else message.temperature,
                "condition": message.condition or "",
                "summary": self._text_summary(message),
                "tip": message.tip or "",
                "highlights": ", ".join(message.highlights or []),
            }
            rendered = self.template.format(**values)
        except (KeyError, IndexError, ValueError) as e:
            logger.warning("Webhook template rendering failed: %s", e)
            return None
        try:
            return json.loads(rendered)
        except json.JSONDecodeError:
            return rendered

    def _build_payload(self, message: WebhookMessage) -> Any:
        fmt = self.preset
        summary = self._text_summary(message)

        if fmt == "generic":
            rendered = self._render_template(message)
            if rendered is not None:
                return rendered
            return {
                "title": message.title,
                "body": message.body,
                "summary": summary,
                "url": message.url,
                "occasion": message.occasion,
                "day": message.day,
                "temperature": message.temperature,
                "condition": message.condition,
                "highlights": message.highlights,
                "tip": message.tip,
                **(message.extra or {}),
            }

        if fmt == "discord":
            embed: dict[str, Any] = {
                "title": message.title,
                "description": summary,
                "color": 0x3B82F6,
            }
            if message.url:
                embed["url"] = message.url
            return {"content": f"**{message.title}**", "embeds": [embed]}

        if fmt in {"slack", "teams"}:
            text = f"*{message.title}*\n{summary}"
            if message.url:
                text += f"\n<{message.url}|View outfit>"
            return {"text": text}

        if fmt == "telegram":
            text_lines = [f"*{message.title}*", summary]
            if message.url:
                text_lines.append(message.url)
            payload: dict[str, Any] = {
                "text": "\n\n".join(text_lines),
                "parse_mode": "Markdown",
                "disable_web_page_preview": False,
            }
            if self.chat_id:
                payload["chat_id"] = self.chat_id
            return payload

        if fmt in {"lark", "feishu"}:
            text_lines = [message.title, summary]
            if message.url:
                text_lines.append(message.url)
            return {
                "msg_type": "text",
                "content": {"text": "\n\n".join(text_lines)},
            }

        if fmt == "dingtalk":
            text_lines = [message.title, summary]
            if message.url:
                text_lines.append(message.url)
            return {
                "msgtype": "text",
                "text": {"content": "\n\n".join(text_lines)},
            }

        if fmt in {"wecom", "wechat_work"}:
            text_lines = [message.title, summary]
            if message.url:
                text_lines.append(message.url)
            return {
                "msgtype": "text",
                "text": {"content": "\n\n".join(text_lines)},
            }

        return {"title": message.title, "body": summary, "url": message.url}

    async def _send_request(
        self,
        client: httpx.AsyncClient,
        request_kwargs: dict[str, Any],
    ) -> httpx.Response:
        current_url = self.url
        for _ in range(5):
            response = await client.request(self.method, current_url, **request_kwargs)
            if not response.is_redirect:
                return response

            redirect_target = response.headers.get("location")
            if not redirect_target:
                return response

            next_url = urljoin(current_url, redirect_target)
            validate_outbound_url(
                next_url,
                allow_private=get_settings().allow_private_webhook,
            )
            current_url = next_url

        raise ValueError("Webhook redirect chain exceeded limit")

    async def send(self, message: WebhookMessage) -> dict:
        payload = self._build_payload(message)
        headers = {"Content-Type": self.content_type, "User-Agent": "Wardrowbe/1.0"}
        headers.update(self.headers)

        try:
            async with httpx.AsyncClient(timeout=30.0, follow_redirects=False) as client:
                request_kwargs: dict[str, Any] = {"headers": headers}
                if self.content_type == "application/x-www-form-urlencoded" and isinstance(payload, dict):
                    request_kwargs["data"] = payload
                elif isinstance(payload, (dict, list)):
                    request_kwargs["json"] = payload
                else:
                    request_kwargs["content"] = str(payload)
                response = await self._send_request(client, request_kwargs)

                if 200 <= response.status_code < 300:
                    try:
                        body = response.json()
                    except Exception:
                        body = None
                    return {"success": True, "status_code": response.status_code, "response": body}

                error = f"HTTP {response.status_code}: {response.text[:500]}"
                logger.warning("Webhook request failed: %s", error)
                return {"success": False, "error": error}
        except Exception as e:
            logger.exception("Webhook send failed")
            return {"success": False, "error": str(e)}

    async def test_connection(self) -> tuple[bool, str]:
        try:
            result = await self.send(
                WebhookMessage(
                    title="Wardrowbe Test",
                    body="This is a test notification from Wardrowbe.",
                    occasion="casual",
                    day="today",
                    highlights=["Test highlight"],
                    tip="Everything looks good!",
                )
            )
            if result.get("success"):
                return True, "Test webhook sent successfully"
            return False, result.get("error", "Unknown error")
        except Exception as e:
            return False, str(e)


def build_notification_email(
    to: str,
    subject: str,
    heading: str,
    body: str,
    cta_text: str,
    cta_url: str,
    app_url: str,
) -> EmailMessage:
    html_body = f"""\
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #111827;">{heading}</h2>
    <p style="color: #374151; line-height: 1.6;">{body}</p>
    <div style="text-align: center; margin: 30px 0;">
        <a href="{cta_url}"
           style="background: #111827; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">
            {cta_text}
        </a>
    </div>
    <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 20px 0;">
    <p style="color: #9CA3AF; font-size: 12px;">Sent by <a href="{app_url}" style="color: #9CA3AF;">Wardrowbe</a></p>
</div>"""
    return EmailMessage(to=to, subject=subject, html_body=html_body, text_body=body)


def build_family_invite_email(
    to: str,
    family_name: str,
    inviter_name: str,
    invite_token: str,
    app_url: str,
) -> EmailMessage:
    invite_url = f"{app_url}/invite?token={invite_token}"
    subject = f"{inviter_name} invited you to join {family_name} on Wardrowbe"
    body_text = (
        f'{inviter_name} invited you to join the family "{family_name}" on Wardrowbe. '
        f"Click here to accept: {invite_url}"
    )
    html_body = f"""\
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #111827;">You&rsquo;re invited!</h2>
    <p style="color: #374151; line-height: 1.6;">
        <strong>{inviter_name}</strong> invited you to join the family
        <strong>{family_name}</strong> on Wardrowbe.
    </p>
    <div style="text-align: center; margin: 30px 0;">
        <a href="{invite_url}"
           style="background: #111827; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">
            Accept Invitation
        </a>
    </div>
    <p style="color: #9CA3AF; font-size: 13px;">
        If you don&rsquo;t have a Wardrowbe account yet, you&rsquo;ll be asked to create one first.
    </p>
    <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 20px 0;">
    <p style="color: #9CA3AF; font-size: 12px;">Sent by <a href="{app_url}" style="color: #9CA3AF;">Wardrowbe</a></p>
</div>"""
    return EmailMessage(to=to, subject=subject, html_body=html_body, text_body=body_text)
