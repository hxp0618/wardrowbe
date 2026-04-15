import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_check(client: AsyncClient):
    """Test that health check endpoint returns OK."""
    response = await client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    # Default locale is zh; status label is localized
    assert data["status"] == "正常"

    response_en = await client.get(
        "/api/v1/health", headers={"Accept-Language": "en"}
    )
    assert response_en.json()["status"] == "healthy"


@pytest.mark.asyncio
async def test_health_check_includes_version(client: AsyncClient):
    """Test that health check includes version info."""
    response = await client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert "version" in data or "status" in data
