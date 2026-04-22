import json

import httpx

from app.config import get_settings


class WechatAuthError(Exception):
    pass


class WechatAuthCredentialError(WechatAuthError):
    pass


class WechatAuthResponseError(WechatAuthError):
    pass


class WechatAuthServiceUnavailableError(WechatAuthError):
    pass


_WECHAT_CREDENTIAL_ERROR_CODES = {40029, 61453}


def _normalize_wechat_errcode(errcode: object) -> object:
    if isinstance(errcode, str):
        stripped = errcode.strip()
        if stripped in {"0", ""}:
            return 0
        if stripped.lstrip("-").isdigit():
            return int(stripped)
    return errcode


class WechatAuthService:
    def __init__(self) -> None:
        self.settings = get_settings()

    async def exchange_code(self, code: str) -> dict:
        if not self.settings.wechat_app_id or not self.settings.wechat_app_secret:
            raise WechatAuthServiceUnavailableError("Wechat login is not configured")

        try:
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
        except httpx.HTTPError as exc:
            raise WechatAuthServiceUnavailableError(
                "Wechat login service is unavailable"
            ) from exc

        try:
            payload = response.json()
        except json.JSONDecodeError as exc:
            raise WechatAuthResponseError("Wechat login response was not valid JSON") from exc

        if not isinstance(payload, dict):
            raise WechatAuthResponseError("Wechat login response had unexpected format")

        errcode = _normalize_wechat_errcode(payload.get("errcode"))
        if errcode not in (None, 0, "0"):
            errmsg = payload.get("errmsg")
            detail = (
                errmsg.strip()
                if isinstance(errmsg, str) and errmsg.strip()
                else "Wechat code exchange failed"
            )
            if errcode in _WECHAT_CREDENTIAL_ERROR_CODES:
                raise WechatAuthCredentialError(detail)
            raise WechatAuthServiceUnavailableError(detail)

        return payload
