from uuid import uuid4

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.item import ClothingItem, ItemStatus


@pytest.mark.asyncio
async def test_create_manual_outfit_via_post_outfits(
    client: AsyncClient,
    test_user,
    auth_headers,
    db_session: AsyncSession,
):
    items = []
    for item_type in ["shirt", "pants", "shoes"]:
        item = ClothingItem(
            user_id=test_user.id,
            type=item_type,
            image_path=f"test/{uuid4()}.jpg",
            status=ItemStatus.ready,
            primary_color="blue",
        )
        db_session.add(item)
        items.append(item)
    await db_session.commit()

    response = await client.post(
        "/api/v1/outfits",
        headers=auth_headers,
        json={
            "item_ids": [str(item.id) for item in items],
            "occasion": "casual",
            "scheduled_for": "2026-04-20",
            "name": "Weekend uniform",
            "notes": "easy layers",
            "use_for_learning": True,
        },
    )

    assert response.status_code == 201
    payload = response.json()
    assert payload["user_id"] == str(test_user.id)
    assert payload["source"] == "manual"
    assert payload["status"] == "accepted"
    assert payload["reasoning"] == "Weekend uniform"
    assert payload["style_notes"] == "easy layers"
    assert payload["scheduled_for"] == "2026-04-20"
    assert payload["feedback"]["rating"] == 5
    assert [item["id"] for item in payload["items"]] == [str(item.id) for item in items]
