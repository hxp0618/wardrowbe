import httpx

from app.config import get_settings


class WechatAuthService:
    def __init__(self) -> None:
        self.settings = get_settings()

    async def exchange_code(self, code: str) -> dict:
        if not self.settings.wechat_app_id or not self.settings.wechat_app_secret:
            raise RuntimeError("Wechat login is not configured")

        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(
                "https://api.weixin.qq.com/sns/jscode2session",
                params={
                    "appid": self.settings.wechat_app_id,
                    "secret": self.settings.wechat_app_secret,
                    "js_code": code,
                    "grant_type": "authorization_code",
                },
            )
            response.raise_for_status()

        payload = response.json()
        if payload.get("errcode"):
            raise ValueError(payload.get("errmsg") or "Wechat code exchange failed")

        return payload
