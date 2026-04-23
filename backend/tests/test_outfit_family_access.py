"""GET /outfits/{id} family read access and OutfitResponse.user_id."""

import secrets
from datetime import date
from uuid import uuid4

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.auth import create_access_token
from app.models.family import Family
from app.models.item import ClothingItem, ItemStatus
from app.models.outfit import Outfit, OutfitItem, OutfitSource, OutfitStatus
from app.models.user import User


@pytest.mark.asyncio
async def test_get_outfit_includes_user_id(
    client: AsyncClient,
    test_user: User,
    auth_headers: dict[str, str],
    db_session: AsyncSession,
):
    item = ClothingItem(
        user_id=test_user.id,
        type="shirt",
        image_path=f"test/{uuid4()}.jpg",
        status=ItemStatus.ready,
        primary_color="blue",
    )
    db_session.add(item)
    await db_session.flush()

    outfit = Outfit(
        user_id=test_user.id,
        occasion="casual",
        scheduled_for=date.today(),
        status=OutfitStatus.accepted,
        source=OutfitSource.manual,
        reasoning="Test",
    )
    outfit.items.append(OutfitItem(item_id=item.id, position=0))
    db_session.add(outfit)
    await db_session.commit()

    response = await client.get(f"/api/v1/outfits/{outfit.id}", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["user_id"] == str(test_user.id)


@pytest.mark.asyncio
async def test_family_member_can_get_other_member_outfit(
    client: AsyncClient,
    test_user: User,
    db_session: AsyncSession,
):
    invite_code = secrets.token_hex(10)[:20]
    family = Family(name="Test Family", created_by=test_user.id, invite_code=invite_code)
    db_session.add(family)
    await db_session.flush()

    test_user.family_id = family.id
    db_session.add(test_user)

    uid_b = uuid4()
    user_b = User(
        id=uid_b,
        external_id=f"test-user-b-{uid_b}",
        email=f"b-{uid_b}@example.com",
        display_name="Member B",
        timezone="UTC",
        is_active=True,
        onboarding_completed=True,
        family_id=family.id,
    )
    db_session.add(user_b)

    item = ClothingItem(
        user_id=test_user.id,
        type="shirt",
        image_path=f"test/{uuid4()}.jpg",
        status=ItemStatus.ready,
        primary_color="blue",
    )
    db_session.add(item)
    await db_session.flush()

    outfit = Outfit(
        user_id=test_user.id,
        occasion="casual",
        scheduled_for=date.today(),
        status=OutfitStatus.accepted,
        source=OutfitSource.manual,
        reasoning="Owner outfit",
    )
    outfit.items.append(OutfitItem(item_id=item.id, position=0))
    db_session.add(outfit)
    await db_session.commit()

    token_b = create_access_token(user_b.external_id)
    headers_b = {"Authorization": f"Bearer {token_b}"}

    response = await client.get(f"/api/v1/outfits/{outfit.id}", headers=headers_b)
    assert response.status_code == 200
    assert response.json()["user_id"] == str(test_user.id)


@pytest.mark.asyncio
async def test_non_family_cannot_get_other_user_outfit(
    client: AsyncClient,
    test_user: User,
    db_session: AsyncSession,
):
    uid_b = uuid4()
    user_b = User(
        id=uid_b,
        external_id=f"test-user-isolated-{uid_b}",
        email=f"iso-{uid_b}@example.com",
        display_name="Isolated",
        timezone="UTC",
        is_active=True,
        onboarding_completed=True,
        family_id=None,
    )
    db_session.add(user_b)

    item = ClothingItem(
        user_id=test_user.id,
        type="shirt",
        image_path=f"test/{uuid4()}.jpg",
        status=ItemStatus.ready,
        primary_color="blue",
    )
    db_session.add(item)
    await db_session.flush()

    outfit = Outfit(
        user_id=test_user.id,
        occasion="casual",
        scheduled_for=date.today(),
        status=OutfitStatus.accepted,
        source=OutfitSource.manual,
    )
    outfit.items.append(OutfitItem(item_id=item.id, position=0))
    db_session.add(outfit)
    await db_session.commit()

    token_b = create_access_token(user_b.external_id)
    headers_b = {"Authorization": f"Bearer {token_b}"}

    response = await client.get(f"/api/v1/outfits/{outfit.id}", headers=headers_b)
    assert response.status_code == 403