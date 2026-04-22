from unittest.mock import patch

import pytest
from httpx import AsyncClient

from app.api.auth import create_access_token
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


class TestAuthStatus:
    @pytest.mark.asyncio
    async def test_auth_status_includes_wechat_flag(self, client: AsyncClient):
        response = await client.get("/api/v1/auth/status")
        assert response.status_code == 200
        data = response.json()
        assert "wechat_mini_program" in data
        assert data["wechat_mini_program"] is False


class TestDevMiniProgramLogin:
    @pytest.mark.asyncio
    async def test_dev_login_returns_token(self, client: AsyncClient):
        response = await client.post(
            "/api/v1/auth/dev-login",
            json={"email": "mini-dev@example.com", "display_name": "Mini Dev"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "mini-dev@example.com"
        assert data["display_name"] == "Mini Dev"
        assert "access_token" in data
        assert data["is_new_user"] is True

    @pytest.mark.asyncio
    async def test_dev_login_disabled_outside_dev_mode(self, client: AsyncClient):
        with patch("app.api.auth._is_dev_mode", return_value=False):
            response = await client.post(
                "/api/v1/auth/dev-login",
                json={"email": "x@example.com", "display_name": "X"},
            )
        assert response.status_code == 503


class TestWeChatCodeLogin:
    @pytest.mark.asyncio
    async def test_wechat_code_requires_config(self, client: AsyncClient):
        response = await client.post(
            "/api/v1/auth/wechat/code",
            json={"code": "test-code"},
        )
        assert response.status_code == 503

    @pytest.mark.asyncio
    async def test_wechat_code_success(self, client: AsyncClient):
        fake_json = {"errcode": 0, "openid": "o-test-openid-123"}

        class FakeResponse:
            def raise_for_status(self) -> None:
                return None

            def json(self) -> dict:
                return fake_json

        class FakeClient:
            def __init__(self, *args, **kwargs):
                pass

            async def __aenter__(self):
                return self

            async def __aexit__(self, *args):
                return None

            async def get(self, url: str, params=None):
                return FakeResponse()

        with (
            patch("app.api.auth.settings.wechat_mini_program_app_id", "wx-test"),
            patch("app.api.auth.settings.wechat_mini_program_app_secret", "secret"),
            patch("httpx.AsyncClient", FakeClient),
        ):
            response = await client.post(
                "/api/v1/auth/wechat/code",
                json={"code": "081abc"},
            )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["is_new_user"] is True

    @pytest.mark.asyncio
    async def test_wechat_code_wechat_api_error(self, client: AsyncClient):
        class FakeResponse:
            def raise_for_status(self) -> None:
                return None

            def json(self) -> dict:
                return {"errcode": 40029, "errmsg": "invalid code"}

        class FakeClient:
            def __init__(self, *args, **kwargs):
                pass

            async def __aenter__(self):
                return self

            async def __aexit__(self, *args):
                return None

            async def get(self, url: str, params=None):
                return FakeResponse()

        with (
            patch("app.api.auth.settings.wechat_mini_program_app_id", "wx-test"),
            patch("app.api.auth.settings.wechat_mini_program_app_secret", "secret"),
            patch("httpx.AsyncClient", FakeClient),
        ):
            response = await client.post(
                "/api/v1/auth/wechat/code",
                json={"code": "bad"},
            )
        assert response.status_code == 401


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
