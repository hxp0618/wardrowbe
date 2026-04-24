from datetime import datetime, timedelta
from typing import Annotated

import jwt
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import DEFAULT_SECRET_KEY, get_settings
from app.database import get_db
from app.models.user import User
from app.schemas.auth import DevLoginRequest, WechatCodeLoginRequest
from app.schemas.user import (
    AuthConfigOIDC,
    AuthConfigResponse,
    AuthStatusResponse,
    UserResponse,
    UserSyncRequest,
    UserSyncResponse,
)
from app.services.user_service import UserEmailConflictError, UserService
from app.services.wechat_auth_service import (
    WechatAuthCredentialError,
    WechatAuthResponseError,
    WechatAuthService,
    WechatAuthServiceUnavailableError,
)
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


def _wechat_configured() -> bool:
    return bool(settings.wechat_app_id and settings.wechat_app_secret)


def _require_wechat_openid(session: dict) -> str:
    openid = session.get("openid")
    if not isinstance(openid, str):
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Wechat login response missing valid openid",
        )

    openid = openid.strip()
    if not openid:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Wechat login response missing valid openid",
        )

    return openid


def _resolve_wechat_display_name(existing_display_name: str | None, openid: str) -> str:
    candidate = existing_display_name.strip() if isinstance(existing_display_name, str) else ""
    return candidate or f"微信用户-{openid[:6]}"


async def _sync_user_and_issue_token(
    sync_data: UserSyncRequest,
    db: AsyncSession,
    request: Request,
) -> UserSyncResponse:
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
    if mode == "unknown":
        return AuthStatusResponse(
            configured=False,
            mode=mode,
            error=translate_request(http_request, "auth.status_no_method_configured"),
        )
    return AuthStatusResponse(configured=True, mode=mode, error=None)


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

    return await _sync_user_and_issue_token(
        sync_data=sync_data,
        db=db,
        request=request,
    )


@router.post("/wechat/code", response_model=UserSyncResponse)
async def wechat_code_login(
    request: Request,
    payload: WechatCodeLoginRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> UserSyncResponse:
    await rate_limit_by_ip(request, "auth_wechat_code", 10, 60)

    if not _wechat_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Wechat login is not configured",
        )

    try:
        session = await WechatAuthService().exchange_code(payload.code)
    except WechatAuthCredentialError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
        ) from None
    except WechatAuthResponseError as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(e),
        ) from None
    except WechatAuthServiceUnavailableError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(e),
        ) from None

    openid = _require_wechat_openid(session)
    external_id = f"wechat:{openid}"
    user_service = UserService(db)
    existing_user = await user_service.get_by_external_id(external_id)
    display_name = _resolve_wechat_display_name(
        existing_user.display_name if existing_user else None,
        openid,
    )

    sync_data = UserSyncRequest(
        external_id=external_id,
        email=f"{openid}@wechat.local",
        display_name=display_name,
        provider="wechat",
    )

    return await _sync_user_and_issue_token(
        sync_data=sync_data,
        db=db,
        request=request,
    )


@router.post("/dev-login", response_model=UserSyncResponse)
async def dev_login(
    request: Request,
    payload: DevLoginRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> UserSyncResponse:
    if not _is_dev_mode():
        await rate_limit_by_ip(request, "auth_dev_login", 10, 60)
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Dev login is disabled",
        )

    normalized_email = payload.email.lower().strip()
    sync_data = UserSyncRequest(
        external_id=f"dev:{normalized_email}",
        email=normalized_email,
        display_name=payload.display_name,
        provider="dev",
    )

    return await _sync_user_and_issue_token(
        sync_data=sync_data,
        db=db,
        request=request,
    )


@router.get("/session", response_model=UserResponse)
async def get_session(
    current_user: Annotated[User, Depends(get_current_user)],
) -> UserResponse:
    return UserResponse.model_validate(current_user)
