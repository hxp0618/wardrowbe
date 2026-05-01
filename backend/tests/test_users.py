from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient

from app.services.weather_service import GeocodedLocation


class TestUserMe:
    """Tests for current user endpoint."""

    @pytest.mark.asyncio
    async def test_get_current_user(self, client: AsyncClient, test_user, auth_headers):
        """Test getting current user info."""
        response = await client.get("/api/v1/users/me", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == str(test_user.id)
        assert data["email"] == test_user.email
        assert data["display_name"] == test_user.display_name

    @pytest.mark.asyncio
    async def test_get_current_user_unauthorized(self, client: AsyncClient):
        """Test that unauthorized request returns 401."""
        response = await client.get("/api/v1/users/me")
        assert response.status_code == 401


class TestUserUpdate:
    """Tests for user update endpoint."""

    @pytest.mark.asyncio
    async def test_update_user(self, client: AsyncClient, test_user, auth_headers):
        """Test updating user information."""
        response = await client.patch(
            "/api/v1/users/me",
            json={
                "display_name": "Updated Name",
                "timezone": "America/New_York",
            },
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["display_name"] == "Updated Name"
        assert data["timezone"] == "America/New_York"

    @pytest.mark.asyncio
    async def test_update_user_location(self, client: AsyncClient, test_user, auth_headers):
        """Test updating user location."""
        response = await client.patch(
            "/api/v1/users/me",
            json={
                "location_lat": 40.7128,
                "location_lon": -74.0060,
                "location_name": "New York City",
            },
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["location_name"] == "New York City"
        # Check coordinates are stored (may be string or float depending on serialization)
        assert float(data["location_lat"]) == pytest.approx(40.7128, rel=1e-4)
        assert float(data["location_lon"]) == pytest.approx(-74.0060, rel=1e-4)

    @pytest.mark.asyncio
    async def test_update_user_location_name_geocodes_missing_coordinates(
        self, client: AsyncClient, test_user, auth_headers
    ):
        """Test updating user location by city name only."""
        geocoded = GeocodedLocation(
            name="Shanghai",
            address="Shanghai, China",
            latitude=31.2304,
            longitude=121.4737,
        )

        with patch(
            "app.services.weather_service.WeatherService.geocode_location",
            new_callable=AsyncMock,
            return_value=geocoded,
        ) as mock_geocode:
            response = await client.patch(
                "/api/v1/users/me",
                json={
                    "location_name": " Shanghai ",
                },
                headers=auth_headers,
            )

        assert response.status_code == 200
        data = response.json()
        assert data["location_name"] == "Shanghai"
        assert float(data["location_lat"]) == pytest.approx(31.2304, rel=1e-4)
        assert float(data["location_lon"]) == pytest.approx(121.4737, rel=1e-4)
        mock_geocode.assert_awaited_once_with("Shanghai")

    @pytest.mark.asyncio
    async def test_update_user_location_name_geocodes_null_coordinates(
        self, client: AsyncClient, test_user, auth_headers
    ):
        """Test city name updates still resolve coordinates when clients send nulls."""
        geocoded = GeocodedLocation(
            name="Beijing",
            address="Beijing, China",
            latitude=39.9075,
            longitude=116.39723,
        )

        with patch(
            "app.services.weather_service.WeatherService.geocode_location",
            new_callable=AsyncMock,
            return_value=geocoded,
        ) as mock_geocode:
            response = await client.patch(
                "/api/v1/users/me",
                json={
                    "location_name": "Beijing",
                    "location_lat": None,
                    "location_lon": None,
                },
                headers=auth_headers,
            )

        assert response.status_code == 200
        data = response.json()
        assert data["location_name"] == "Beijing"
        assert float(data["location_lat"]) == pytest.approx(39.9075, rel=1e-4)
        assert float(data["location_lon"]) == pytest.approx(116.39723, rel=1e-4)
        mock_geocode.assert_awaited_once_with("Beijing")

    @pytest.mark.asyncio
    async def test_update_user_avatar_url(self, client: AsyncClient, test_user, auth_headers):
        """Test updating the custom avatar URL."""
        response = await client.patch(
            "/api/v1/users/me",
            json={
                "avatar_url": "https://cdn.example.com/avatar.png",
            },
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["avatar_url"] == "https://cdn.example.com/avatar.png"


class TestOnboarding:
    """Tests for onboarding completion endpoint."""

    @pytest.mark.asyncio
    async def test_complete_onboarding(self, client: AsyncClient, test_user, auth_headers):
        """Test completing onboarding."""
        response = await client.post(
            "/api/v1/users/me/onboarding/complete",
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["onboarding_completed"] is True

    @pytest.mark.asyncio
    async def test_onboarding_already_completed(
        self, client: AsyncClient, test_user, auth_headers, db_session
    ):
        """Test completing onboarding when already completed."""
        # Mark onboarding as completed
        test_user.onboarding_completed = True
        await db_session.commit()

        response = await client.post(
            "/api/v1/users/me/onboarding/complete",
            headers=auth_headers,
        )
        # Should still succeed (idempotent)
        assert response.status_code == 200
        data = response.json()
        assert data["onboarding_completed"] is True
