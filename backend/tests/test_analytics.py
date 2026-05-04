import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.item import ClothingItem, ItemStatus


@pytest.mark.asyncio
async def test_analytics_heavy_color_insight_localizes_domain_value(
    client: AsyncClient,
    test_user,
    auth_headers,
    db_session: AsyncSession,
):
    for index in range(2):
        db_session.add(
            ClothingItem(
                user_id=test_user.id,
                type="shirt",
                image_path=f"test/analytics-brown-{index}.jpg",
                primary_color="brown",
                status=ItemStatus.ready,
            )
        )
    await db_session.commit()

    response = await client.get(
        "/api/v1/analytics",
        headers={**auth_headers, "Accept-Language": "zh-CN"},
    )

    assert response.status_code == 200
    insights = response.json()["insights"]
    assert any("棕色" in insight for insight in insights)
    assert all("brown" not in insight for insight in insights)
