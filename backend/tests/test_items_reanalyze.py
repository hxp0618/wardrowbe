from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.models.item import ClothingItem, ItemImage, ItemStatus


def _full_path(relative_path: str) -> str:
    return f"{get_settings().storage_path}/{relative_path}"


class TestItemReanalyze:
    @pytest.mark.asyncio
    async def test_single_reanalyze_enqueues_additional_images(
        self, client: AsyncClient, test_user, auth_headers, db_session: AsyncSession
    ):
        item = ClothingItem(
            user_id=test_user.id,
            type="shirt",
            image_path="items/main.jpg",
            status=ItemStatus.ready,
        )
        db_session.add(item)
        await db_session.flush()

        extra = ItemImage(item_id=item.id, image_path="items/extra.jpg", position=0)
        db_session.add(extra)
        await db_session.commit()
        await db_session.refresh(item)

        redis = AsyncMock()
        redis.enqueue_job = AsyncMock(return_value=SimpleNamespace(job_id="job-123"))
        redis.aclose = AsyncMock()

        with patch("app.api.items.create_pool", AsyncMock(return_value=redis)):
            response = await client.post(f"/api/v1/items/{item.id}/analyze", headers=auth_headers)

        assert response.status_code == 200, response.json()
        redis.enqueue_job.assert_awaited_once_with(
            "tag_item_image",
            str(item.id),
            _full_path(item.image_path),
            [_full_path(extra.image_path)],
            _queue_name="arq:tagging",
        )

    @pytest.mark.asyncio
    async def test_bulk_reanalyze_enqueues_additional_images(
        self, client: AsyncClient, test_user, auth_headers, db_session: AsyncSession
    ):
        item = ClothingItem(
            user_id=test_user.id,
            type="shirt",
            image_path="items/main-bulk.jpg",
            status=ItemStatus.ready,
        )
        db_session.add(item)
        await db_session.flush()

        extra = ItemImage(item_id=item.id, image_path="items/extra-bulk.jpg", position=0)
        db_session.add(extra)
        await db_session.commit()
        await db_session.refresh(item)

        redis = AsyncMock()
        redis.enqueue_job = AsyncMock(return_value=SimpleNamespace(job_id="job-bulk"))
        redis.aclose = AsyncMock()

        with patch("app.api.items.create_pool", AsyncMock(return_value=redis)):
            response = await client.post(
                "/api/v1/items/bulk/analyze",
                json={"item_ids": [str(item.id)]},
                headers=auth_headers,
            )

        assert response.status_code == 200, response.json()
        redis.enqueue_job.assert_awaited_once_with(
            "tag_item_image",
            str(item.id),
            _full_path(item.image_path),
            [_full_path(extra.image_path)],
            _queue_name="arq:tagging",
        )
