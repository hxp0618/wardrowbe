import json
from uuid import uuid4

import httpx
from httpx import AsyncClient
import pytest
from sqlalchemy import func, select

from app.api import auth as auth_api
from app.api.auth import create_access_token
from app.config import Settings
from app.models.user import User
from app.utils.auth import decode_token


class TestJWTToken:
    """Tests for JWT token creation and validation."""

    def test_create_access_token(self):
        """Test that access token is created successfully."""
        token = create_access_token("test-user-id")
        assert token is not None
        assert isinstance(token, str)
        assert len(token) > 0

    def test_decode_valid_token(self):
        """Test that valid token is decoded correctly."""
        external_id = "test-user-id"
        token = create_access_token(external_id)
        payload = decode_token(token)
        assert payload.sub == external_id

    def test_decode_expired_token(self):
        """Test that expired token raises error."""
        from datetime import timedelta

        from fastapi import HTTPException

        # Create token that expired 1 hour ago
        token = create_access_token("test-user", expires_delta=timedelta(hours=-1))

        with pytest.raises(HTTPException) as exc_info:
            decode_token(token)
        assert exc_info.value.status_code == 401


class TestAuthConfig:
    @pytest.mark.asyncio
    async def test_get_auth_config(self, client: AsyncClient):
        response = await client.get("/api/v1/auth/config")
        assert response.status_code == 200
        data = response.json()
        assert "oidc" in data
        assert "dev_mode" in data
        assert isinstance(data["oidc"]["enabled"], bool)

    @pytest.mark.asyncio
    async def test_auth_config_dev_mode(self, client: AsyncClient):
        response = await client.get("/api/v1/auth/config")
        data = response.json()
        assert data["dev_mode"] is True
        assert data["oidc"]["enabled"] is False

    @pytest.mark.asyncio
    async def test_auth_config_wechat_mode(self, client: AsyncClient, monkeypatch: pytest.MonkeyPatch):
        monkeypatch.setattr(auth_api.settings, "debug", False)
        monkeypatch.setattr(auth_api.settings, "secret_key", "non-default-secret")
        monkeypatch.setattr(auth_api.settings, "wechat_app_id", "wx-app-id")
        monkeypatch.setattr(auth_api.settings, "wechat_app_secret", "wx-app-secret")
        monkeypatch.setattr(auth_api.settings, "oidc_issuer_url", None)
        monkeypatch.setattr(auth_api.settings, "oidc_client_id", None)

        config_response = await client.get("/api/v1/auth/config")
        assert config_response.status_code == 200
        config_data = config_response.json()
        assert config_data["dev_mode"] is False
        assert config_data["oidc"]["enabled"] is False

        status_response = await client.get("/api/v1/auth/status")
        assert status_response.status_code == 200
        status_data = status_response.json()
        assert status_data["configured"] is True
        assert status_data["mode"] == "wechat"
        assert status_data["error"] is None

    def test_get_auth_mode_wechat_plus_dev(self):
        settings = Settings.model_construct(
            debug=True,
            secret_key="change-me-in-production",
            wechat_app_id="wx-app-id",
            wechat_app_secret="wx-app-secret",
            oidc_issuer_url=None,
            oidc_client_id=None,
        )

        assert settings.get_auth_mode() == "wechat+dev"


class TestAuthSync:
    """Tests for auth sync endpoint."""

    @pytest.mark.asyncio
    async def test_sync_new_user(self, client: AsyncClient):
        """Test syncing a new user creates the user."""
        response = await client.post(
            "/api/v1/auth/sync",
            json={
                "external_id": "new-user-123",
                "email": "newuser@example.com",
                "display_name": "New User",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "newuser@example.com"
        assert data["display_name"] == "New User"
        assert "access_token" in data
        assert data["is_new_user"] is True

    @pytest.mark.asyncio
    async def test_sync_existing_user(self, client: AsyncClient, test_user):
        """Test syncing an existing user returns existing data."""
        response = await client.post(
            "/api/v1/auth/sync",
            json={
                "external_id": test_user.external_id,
                "email": test_user.email,
                "display_name": "Updated Name",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == test_user.email
        assert data["is_new_user"] is False

    @pytest.mark.asyncio
    async def test_sync_missing_required_fields(self, client: AsyncClient):
        """Test sync with missing required fields fails."""
        response = await client.post(
            "/api/v1/auth/sync",
            json={
                "external_id": "test-123",
                # Missing email and display_name
            },
        )
        assert response.status_code == 422


class TestDevLogin:
    @pytest.mark.asyncio
    async def test_dev_login_success(self, client: AsyncClient):
        response = await client.post(
            "/api/v1/auth/dev-login",
            json={
                "email": "dev-user@example.com",
                "display_name": "Dev User",
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "dev-user@example.com"
        assert data["display_name"] == "Dev User"
        assert data["is_new_user"] is True
        assert data["access_token"]

    @pytest.mark.asyncio
    async def test_dev_login_disabled_outside_dev_mode(
        self, client: AsyncClient, monkeypatch: pytest.MonkeyPatch
    ):
        monkeypatch.setattr(auth_api.settings, "debug", False)
        monkeypatch.setattr(auth_api.settings, "secret_key", "non-default-secret")

        response = await client.post(
            "/api/v1/auth/dev-login",
            json={
                "email": "dev-user@example.com",
                "display_name": "Dev User",
            },
        )

        assert response.status_code == 403
        assert response.json()["detail"] == "Dev login is disabled"


class TestWechatLogin:
    @staticmethod
    def _configure_wechat(monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.setattr(auth_api.settings, "wechat_app_id", "wx-app-id")
        monkeypatch.setattr(auth_api.settings, "wechat_app_secret", "wx-app-secret")

    @pytest.mark.asyncio
    async def test_wechat_code_login_success(
        self, client: AsyncClient, monkeypatch: pytest.MonkeyPatch
    ):
        openid = f"wx{uuid4().hex[:10]}"

        async def fake_exchange_code(self, code: str) -> dict:
            assert code == "wechat-code"
            return {"openid": openid}

        monkeypatch.setattr(auth_api.settings, "wechat_app_id", "wx-app-id")
        monkeypatch.setattr(auth_api.settings, "wechat_app_secret", "wx-app-secret")
        monkeypatch.setattr(
            "app.services.wechat_auth_service.WechatAuthService.exchange_code",
            fake_exchange_code,
        )

        response = await client.post(
            "/api/v1/auth/wechat/code",
            json={"code": "wechat-code"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["email"] == f"{openid}@wechat.local"
        assert data["display_name"] == f"微信用户-{openid[:6]}"
        assert data["is_new_user"] is True
        assert data["access_token"]

    @pytest.mark.asyncio
    async def test_wechat_code_login_preserves_existing_custom_display_name(
        self, client: AsyncClient, db_session, monkeypatch: pytest.MonkeyPatch
    ):
        openid = f"openid-{uuid4().hex[:8]}"

        async def fake_exchange_code(self, code: str) -> dict:
            assert code == "wechat-code"
            return {"openid": openid}

        existing_user = User(
            external_id=f"wechat:{openid}",
            email=f"{openid}@wechat.local",
            display_name="Already Customized",
            timezone="UTC",
            is_active=True,
        )
        db_session.add(existing_user)
        await db_session.commit()
        await db_session.refresh(existing_user)

        self._configure_wechat(monkeypatch)
        monkeypatch.setattr(
            "app.services.wechat_auth_service.WechatAuthService.exchange_code",
            fake_exchange_code,
        )

        response = await client.post(
            "/api/v1/auth/wechat/code",
            json={"code": "wechat-code"},
        )

        await db_session.refresh(existing_user)

        assert response.status_code == 200
        assert response.json()["display_name"] == "Already Customized"
        assert existing_user.display_name == "Already Customized"

    @pytest.mark.asyncio
    @pytest.mark.parametrize("openid", [None, 123, ""])
    async def test_wechat_code_login_rejects_invalid_openid_without_creating_user(
        self,
        client: AsyncClient,
        db_session,
        monkeypatch: pytest.MonkeyPatch,
        openid,
    ):
        async def fake_exchange_code(self, code: str) -> dict:
            assert code == "wechat-code"
            return {"openid": openid}

        self._configure_wechat(monkeypatch)
        monkeypatch.setattr(
            "app.services.wechat_auth_service.WechatAuthService.exchange_code",
            fake_exchange_code,
        )

        before_count = await db_session.scalar(select(func.count()).select_from(User))

        response = await client.post(
            "/api/v1/auth/wechat/code",
            json={"code": "wechat-code"},
        )

        after_count = await db_session.scalar(select(func.count()).select_from(User))

        assert response.status_code == 502
        assert response.json()["detail"] == "Wechat login response missing valid openid"
        assert after_count == before_count

    @pytest.mark.asyncio
    async def test_wechat_code_login_maps_wechat_business_error_to_401(
        self, client: AsyncClient, monkeypatch: pytest.MonkeyPatch
    ):
        class FakeResponse:
            def raise_for_status(self) -> None:
                return None

            def json(self) -> dict:
                return {"errcode": 40029, "errmsg": "invalid code"}

        class FakeAsyncClient:
            async def __aenter__(self):
                return self

            async def __aexit__(self, exc_type, exc, tb):
                return False

            async def get(self, *args, **kwargs):
                return FakeResponse()

        self._configure_wechat(monkeypatch)
        monkeypatch.setattr(
            "app.services.wechat_auth_service.httpx.AsyncClient",
            lambda *args, **kwargs: FakeAsyncClient(),
        )

        response = await client.post(
            "/api/v1/auth/wechat/code",
            json={"code": "wechat-code"},
        )

        assert response.status_code == 401
        assert response.json()["detail"] == "invalid code"

    @pytest.mark.asyncio
    async def test_wechat_code_login_maps_invalid_json_to_502(
        self, client: AsyncClient, monkeypatch: pytest.MonkeyPatch
    ):
        class FakeResponse:
            def raise_for_status(self) -> None:
                return None

            def json(self) -> dict:
                raise json.JSONDecodeError("Invalid JSON", "{}", 0)

        class FakeAsyncClient:
            async def __aenter__(self):
                return self

            async def __aexit__(self, exc_type, exc, tb):
                return False

            async def get(self, *args, **kwargs):
                return FakeResponse()

        self._configure_wechat(monkeypatch)
        monkeypatch.setattr(
            "app.services.wechat_auth_service.httpx.AsyncClient",
            lambda *args, **kwargs: FakeAsyncClient(),
        )

        response = await client.post(
            "/api/v1/auth/wechat/code",
            json={"code": "wechat-code"},
        )

        assert response.status_code == 502

    @pytest.mark.asyncio
    async def test_wechat_code_login_maps_upstream_http_error_to_503(
        self, client: AsyncClient, monkeypatch: pytest.MonkeyPatch
    ):
        class FakeAsyncClient:
            async def __aenter__(self):
                return self

            async def __aexit__(self, exc_type, exc, tb):
                return False

            async def get(self, *args, **kwargs):
                raise httpx.ConnectError("boom")

        self._configure_wechat(monkeypatch)
        monkeypatch.setattr(
            "app.services.wechat_auth_service.httpx.AsyncClient",
            lambda *args, **kwargs: FakeAsyncClient(),
        )

        response = await client.post(
            "/api/v1/auth/wechat/code",
            json={"code": "wechat-code"},
        )

        assert response.status_code == 503

    @pytest.mark.asyncio
    async def test_wechat_code_login_requires_configuration(
        self, client: AsyncClient, monkeypatch: pytest.MonkeyPatch
    ):
        monkeypatch.setattr(auth_api.settings, "wechat_app_id", None)
        monkeypatch.setattr(auth_api.settings, "wechat_app_secret", None)

        response = await client.post(
            "/api/v1/auth/wechat/code",
            json={"code": "wechat-code"},
        )

        assert response.status_code == 503
        assert response.json()["detail"] == "Wechat login is not configured"


class TestProtectedRoutes:
    """Tests for authentication requirement on protected routes."""

    @pytest.mark.asyncio
    async def test_unauthenticated_request_fails(self, client: AsyncClient):
        """Test that unauthenticated requests to protected routes fail."""
        response = await client.get("/api/v1/users/me")
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_invalid_token_fails(self, client: AsyncClient):
        """Test that invalid token is rejected."""
        response = await client.get(
            "/api/v1/users/me",
            headers={"Authorization": "Bearer invalid-token"},
        )
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_valid_token_succeeds(self, client: AsyncClient, test_user, auth_headers):
        """Test that valid token allows access to protected routes."""
        response = await client.get("/api/v1/users/me", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == test_user.email
