import io
import json
import zipfile
from pathlib import Path

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.models.item import ClothingItem, ItemImage, ItemStatus


class TestBackupExport:
    @pytest.mark.asyncio
    async def test_export_backup_includes_quantity_and_image_hash(
        self,
        client: AsyncClient,
        test_user,
        auth_headers,
        db_session: AsyncSession,
    ):
        storage_path = Path(get_settings().storage_path)
        storage_path.mkdir(parents=True, exist_ok=True)

        main_rel = f"{test_user.id}/items/main.jpg"
        extra_rel = f"{test_user.id}/items/detail.jpg"
        (storage_path / main_rel).parent.mkdir(parents=True, exist_ok=True)
        (storage_path / main_rel).write_bytes(b"main-image-bytes")
        (storage_path / extra_rel).write_bytes(b"detail-image-bytes")

        item = ClothingItem(
            user_id=test_user.id,
            type="shirt",
            image_path=main_rel,
            status=ItemStatus.ready,
            quantity=3,
            image_hash="abc123def4567890",
        )
        db_session.add(item)
        await db_session.flush()

        db_session.add(
            ItemImage(
                item_id=item.id,
                image_path=extra_rel,
                position=0,
            )
        )
        await db_session.commit()

        response = await client.get("/api/v1/backup/export", headers=auth_headers)

        assert response.status_code == 200
        archive = zipfile.ZipFile(io.BytesIO(response.content))
        metadata = json.loads(archive.read("metadata.json").decode("utf-8"))
        assert metadata["items"][0]["quantity"] == 3
        assert metadata["items"][0]["image_hash"] == "abc123def4567890"
        assert f"images/{main_rel}" in archive.namelist()
        assert f"images/{extra_rel}" in archive.namelist()
