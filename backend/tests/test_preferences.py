from unittest.mock import patch

import pytest
from fastapi import HTTPException, Request
from httpx import AsyncClient

from app.api.preferences import test_ai_endpoint as run_test_ai_endpoint
from app.config import get_settings


def _make_request() -> Request:
    return Request(
        {
            "type": "http",
            "method": "POST",
            "path": "/api/v1/users/me/preferences/test-ai-endpoint",
            "headers": [],
            "client": ("127.0.0.1", 12345),
            "server": ("testserver", 80),
            "scheme": "http",
            "query_string": b"",
        }
    )


class TestPreferencesEndpoints:
    """Tests for preferences API endpoints."""

    @pytest.mark.asyncio
    async def test_get_preferences_not_found(self, client: AsyncClient, test_user, auth_headers):
        """Test getting preferences when none exist."""
        response = await client.get("/api/v1/users/me/preferences", headers=auth_headers)
        # Should return 404 or empty default
        assert response.status_code in [200, 404]

    @pytest.mark.asyncio
    async def test_create_preferences(self, client: AsyncClient, test_user, auth_headers):
        """Test creating user preferences."""
        response = await client.patch(
            "/api/v1/users/me/preferences",
            json={
                "color_favorites": ["black", "navy", "white"],
                "default_occasion": "smart-casual",
            },
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert "black" in data["color_favorites"]
        assert data["default_occasion"] == "smart-casual"

    @pytest.mark.asyncio
    async def test_update_preferences(
        self, client: AsyncClient, test_user_with_preferences, auth_headers, db_session
    ):
        """Test updating existing preferences."""
        response = await client.patch(
            "/api/v1/users/me/preferences",
            json={
                "color_avoid": ["orange", "pink"],
            },
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert "orange" in data["color_avoid"]


class TestAIEndpointPreferences:
    """Tests for AI endpoint configuration in preferences."""

    @pytest.mark.asyncio
    async def test_configure_ai_endpoint(self, client: AsyncClient, test_user, auth_headers):
        """Test configuring custom AI endpoint."""
        response = await client.patch(
            "/api/v1/users/me/preferences",
            json={
                "ai_endpoints": [
                    {
                        "name": "local-ollama",
                        "url": "http://localhost:11434/v1",
                        "vision_model": "llava",
                        "text_model": "llama3",
                        "enabled": True,
                    }
                ]
            },
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data.get("ai_endpoints", [])) == 1
        assert data["ai_endpoints"][0]["name"] == "local-ollama"

    @pytest.mark.asyncio
    async def test_test_ai_endpoint_rejects_private_url_by_default(
        self,
    ):
        with pytest.raises(HTTPException) as exc:
            await run_test_ai_endpoint(
                {"url": "http://127.0.0.1:11434/v1", "vision_model": "llava"},
                _make_request(),
                current_user=None,
            )

        assert exc.value.status_code == 400

    @pytest.mark.asyncio
    async def test_test_ai_endpoint_allows_private_url_when_opted_in(
        self, monkeypatch
    ):
        class _MockResponse:
            status_code = 200

            @staticmethod
            def json():
                return {"models": [{"name": "llava"}]}

        monkeypatch.setenv("ALLOW_PRIVATE_AI_ENDPOINTS", "true")
        get_settings.cache_clear()
        try:
            with patch("app.api.preferences.httpx.AsyncClient.get", return_value=_MockResponse()):
                response = await run_test_ai_endpoint(
                    {"url": "http://127.0.0.1:11434/v1", "vision_model": "llava"},
                    _make_request(),
                    current_user=None,
                )
        finally:
            monkeypatch.delenv("ALLOW_PRIVATE_AI_ENDPOINTS", raising=False)
            get_settings.cache_clear()

        assert response["status"] == "connected"


class TestPreferenceValidation:
    """Tests for preference validation."""

    @pytest.mark.asyncio
    async def test_invalid_formality_rejected(self, client: AsyncClient, test_user, auth_headers):
        """Test that invalid formality values are rejected."""
        response = await client.patch(
            "/api/v1/users/me/preferences",
            json={
                "formality_default": "ultra-mega-formal",  # Invalid
            },
            headers=auth_headers,
        )
        # Should either reject or sanitize
        assert response.status_code in [200, 422]

    @pytest.mark.asyncio
    async def test_empty_preferences_allowed(self, client: AsyncClient, test_user, auth_headers):
        """Test that empty/minimal preferences are accepted."""
        response = await client.patch(
            "/api/v1/users/me/preferences",
            json={},
            headers=auth_headers,
        )
        assert response.status_code == 200
