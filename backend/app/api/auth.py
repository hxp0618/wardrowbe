from datetime import datetime, timedelta
from typing import Annotated
import httpx
import jwt
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import DEFAULT_SECRET_KEY, get_settings
from app.database import get_db
from app.models.user import User
from app.schemas.user import (
    AuthConfigOIDC,
    AuthConfigResponse,
    AuthStatusResponse,
    DevMiniProgramLoginRequest,
    UserResponse,
    UserSyncRequest,
    UserSyncResponse,
    WeChatCodeRequest,
)
from app.services.user_service import UserEmailConflictError, UserService
from app.utils.auth import get_current_user
from app.utils.i18n import translate_request, translate_validation_message
from app.utils.oidc import validate_oidc_id_token
from app.utils.rate_limit import rate_limit_by_ip

router = APIRouter(prefix="/auth", tags=["Authentication"])
settings = get_settings()


def create_access_token(external_id: str, expires_delta: timedelta | None = None) -> str:
    now = datetime.utcnow()
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(days=7)
    to_encode = {
        "sub": external_id,
        "exp": expire,
        "iat": now,
    }
    return jwt.encode(to_encode, settings.secret_key, algorithm="HS256")


def _is_dev_mode() -> bool:
    return settings.debug and settings.secret_key == DEFAULT_SECRET_KEY


def _oidc_configured() -> bool:
    return bool(settings.oidc_issuer_url and settings.oidc_client_id)


@router.get("/config", response_model=AuthConfigResponse)
async def get_auth_config() -> AuthConfigResponse:
    oidc_enabled = _oidc_configured()
    return AuthConfigResponse(
        oidc=AuthConfigOIDC(
            enabled=oidc_enabled,
            issuer_url=settings.oidc_issuer_url if oidc_enabled else None,
            client_id=(settings.oidc_mobile_client_id or settings.oidc_client_id)
            if oidc_enabled
            else None,
        ),
        dev_mode=_is_dev_mode(),
    )


@router.get("/status", response_model=AuthStatusResponse)
async def auth_status(http_request: Request) -> AuthStatusResponse:
    mode = settings.get_auth_mode()
    wechat_ok = settings.wechat_mini_program_configured()
    if mode == "unknown" and not wechat_ok:
        return AuthStatusResponse(
            configured=False,
            mode=mode,
            error=translate_request(http_request, "auth.status_no_method_configured"),
            wechat_mini_program=False,
        )
    return AuthStatusResponse(
        configured=True,
        mode=mode,
        wechat_mini_program=wechat_ok,
    )


@router.post("/dev-login", response_model=UserSyncResponse)
async def dev_mini_program_login(
    request: Request,
    body: DevMiniProgramLoginRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> UserSyncResponse:
    """Dev-only login for WeChat mini program (same token model as /auth/sync in dev mode)."""
    await rate_limit_by_ip(request, "auth_dev_login", 20, 60)
    if not _is_dev_mode():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=translate_request(request, "error.no_auth_method_configured"),
        )

    external_id = "".join(
        ch if ch.isalnum() else "-" for ch in str(body.email).lower()
    ).strip("-")
    if not external_id:
        external_id = "dev-user"

    sync_data = UserSyncRequest(
        external_id=external_id,
        email=str(body.email).lower().strip(),
        display_name=body.display_name,
        avatar_url=None,
        id_token=None,
    )
    user_service = UserService(db)
    try:
        user, is_new = await user_service.sync_from_oidc(sync_data)
    except UserEmailConflictError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=translate_validation_message(str(e), request),
        ) from None

    access_token = create_access_token(user.external_id)
    return UserSyncResponse(
        id=user.id,
        email=user.email,
        display_name=user.display_name,
        is_new_user=is_new,
        onboarding_completed=user.onboarding_completed,
        access_token=access_token,
    )


@router.post("/wechat/code", response_model=UserSyncResponse)
async def wechat_code_login(
    request: Request,
    body: WeChatCodeRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> UserSyncResponse:
    await rate_limit_by_ip(request, "auth_wechat_code", 30, 60)
    if not settings.wechat_mini_program_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=translate_request(request, "error.wechat_not_configured"),
        )

    params = {
        "appid": settings.wechat_mini_program_app_id,
        "secret": settings.wechat_mini_program_app_secret,
        "js_code": body.code,
        "grant_type": "authorization_code",
    }
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                "https://api.weixin.qq.com/sns/jscode2session",
                params=params,
            )
            resp.raise_for_status()
            data = resp.json()
    except (httpx.HTTPError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=translate_request(request, "error.wechat_code_exchange_failed"),
        ) from None

    errcode = data.get("errcode", 0)
    if errcode != 0:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=translate_request(request, "error.wechat_code_exchange_failed"),
        )

    openid = data.get("openid")
    if not openid or not isinstance(openid, str):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=translate_request(request, "error.wechat_code_exchange_failed"),
        )

    user_service = UserService(db)
    user, is_new = await user_service.sync_from_wechat_openid(openid)
    access_token = create_access_token(user.external_id)
    return UserSyncResponse(
        id=user.id,
        email=user.email,
        display_name=user.display_name,
        is_new_user=is_new,
        onboarding_completed=user.onboarding_completed,
        access_token=access_token,
    )


@router.post("/sync", response_model=UserSyncResponse)
async def sync_user(
    request: Request,
    sync_data: UserSyncRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> UserSyncResponse:
    await rate_limit_by_ip(request, "auth_sync", 10, 60)
    if _is_dev_mode():
        pass
    elif _oidc_configured():
        if not sync_data.id_token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=translate_request(request, "error.oidc_token_required"),
            )

        valid_audiences = [settings.oidc_client_id]
        if (
            settings.oidc_mobile_client_id
            and settings.oidc_mobile_client_id != settings.oidc_client_id
        ):
            valid_audiences.append(settings.oidc_mobile_client_id)

        try:
            oidc_claims = await validate_oidc_id_token(
                sync_data.id_token,
                settings.oidc_issuer_url,
                valid_audiences,
            )
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=translate_validation_message(str(e), request),
            ) from None

        if oidc_claims.get("sub") != sync_data.external_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=translate_request(request, "error.token_subject_mismatch"),
            )

        claims_email = oidc_claims.get("email", "").lower().strip()
        request_email = sync_data.email.lower().strip()
        if claims_email and request_email and claims_email != request_email:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=translate_request(request, "error.token_email_mismatch"),
            )

        # Check provider migration: different external_id, same email requires verified email
        user_service_check = UserService(db)
        existing_user = await user_service_check.get_by_email(request_email)
        if existing_user and existing_user.external_id != sync_data.external_id:
            if oidc_claims.get("email_verified") is not True:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=translate_request(
                        request, "error.email_migration_requires_verification"
                    ),
                )
    else:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=translate_request(request, "error.no_auth_method_configured"),
        )

    user_service = UserService(db)

    try:
        user, is_new = await user_service.sync_from_oidc(sync_data)
    except UserEmailConflictError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=translate_validation_message(str(e), request),
        ) from None

    access_token = create_access_token(user.external_id)

    return UserSyncResponse(
        id=user.id,
        email=user.email,
        display_name=user.display_name,
        is_new_user=is_new,
        onboarding_completed=user.onboarding_completed,
        access_token=access_token,
    )


@router.get("/session", response_model=UserResponse)
async def get_session(
    current_user: Annotated[User, Depends(get_current_user)],
) -> UserResponse:
    return UserResponse.model_validate(current_user)
