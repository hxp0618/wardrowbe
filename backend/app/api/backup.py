"""Backup and restore endpoints.

Exports the current user's wardrobe (items, folders, outfits, preferences,
notification settings) together with all underlying image files as a single
streaming ZIP. Importing accepts that same ZIP and upserts data into the
current user's account.

Secrets like API keys, OIDC client secrets, or notification credentials are
never exported. The import path is idempotent for the same ``metadata.version``.
"""

from __future__ import annotations

import io
import json
import logging
import zipfile
from datetime import date, datetime
from pathlib import Path
from typing import Annotated, Any
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, status
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.config import get_settings
from app.database import get_db
from app.models.folder import Folder, item_folders
from app.models.item import ClothingItem, ItemImage, ItemStatus
from app.models.notification import NotificationSettings
from app.models.outfit import Outfit, OutfitItem, OutfitSource, OutfitStatus
from app.models.preference import UserPreference
from app.models.user import User
from app.utils.auth import get_current_user
from app.utils.i18n import translate_request

logger = logging.getLogger(__name__)
settings = get_settings()

router = APIRouter(prefix="/backup", tags=["Backup"])

BACKUP_VERSION = 1
SUPPORTED_VERSIONS = {1}
MAX_IMPORT_BYTES = 1024 * 1024 * 1024  # 1 GiB hard cap


def _jsonable(value: Any) -> Any:
    if isinstance(value, UUID):
        return str(value)
    if isinstance(value, datetime):
        return value.isoformat()
    if hasattr(value, "isoformat"):
        return value.isoformat()
    if isinstance(value, (list, tuple)):
        return [_jsonable(v) for v in value]
    if isinstance(value, dict):
        return {k: _jsonable(v) for k, v in value.items()}
    return value


def _dump_item(item: ClothingItem) -> dict[str, Any]:
    return {
        "id": str(item.id),
        "type": item.type,
        "subtype": item.subtype,
        "name": item.name,
        "brand": item.brand,
        "notes": item.notes,
        "purchase_date": _jsonable(item.purchase_date),
        "purchase_price": float(item.purchase_price) if item.purchase_price is not None else None,
        "favorite": item.favorite,
        "quantity": item.quantity,
        "image_path": item.image_path,
        "thumbnail_path": item.thumbnail_path,
        "medium_path": item.medium_path,
        "image_hash": item.image_hash,
        "tags": item.tags,
        "colors": item.colors,
        "primary_color": item.primary_color,
        "status": item.status.value if hasattr(item.status, "value") else item.status,
        "ai_processed": item.ai_processed,
        "ai_confidence": item.ai_confidence,
        "ai_description": item.ai_description,
        "wear_count": item.wear_count,
        "last_worn_at": _jsonable(item.last_worn_at),
        "wears_since_wash": item.wears_since_wash,
        "last_washed_at": _jsonable(item.last_washed_at),
        "wash_interval": item.wash_interval,
        "needs_wash": item.needs_wash,
        "is_archived": item.is_archived,
        "created_at": _jsonable(item.created_at),
        "additional_images": [
            {
                "id": str(img.id),
                "image_path": img.image_path,
                "thumbnail_path": img.thumbnail_path,
                "medium_path": img.medium_path,
                "position": img.position,
            }
            for img in (item.additional_images or [])
        ],
        "folder_ids": [str(f.id) for f in (item.folders or [])],
    }


def _dump_folder(folder: Folder) -> dict[str, Any]:
    return {
        "id": str(folder.id),
        "name": folder.name,
        "icon": folder.icon,
        "color": folder.color,
        "position": folder.position,
    }


def _dump_outfit(outfit: Outfit) -> dict[str, Any]:
    return {
        "id": str(outfit.id),
        "occasion": outfit.occasion,
        "scheduled_for": _jsonable(outfit.scheduled_for),
        "status": outfit.status.value if hasattr(outfit.status, "value") else outfit.status,
        "source": outfit.source.value if hasattr(outfit.source, "value") else outfit.source,
        "reasoning": outfit.reasoning,
        "style_notes": outfit.style_notes,
        "weather_data": outfit.weather_data,
        "items": [
            {
                "item_id": str(oi.item_id),
                "position": oi.position,
                "layer_type": oi.layer_type,
            }
            for oi in sorted(outfit.items or [], key=lambda x: x.position)
        ],
        "created_at": _jsonable(outfit.created_at),
    }


def _dump_preferences(pref: UserPreference | None) -> dict[str, Any] | None:
    if pref is None:
        return None
    return {
        "color_favorites": pref.color_favorites,
        "color_avoid": pref.color_avoid,
        "style_profile": pref.style_profile,
        "default_occasion": pref.default_occasion,
        "occasion_preferences": pref.occasion_preferences,
        "temperature_unit": pref.temperature_unit,
        "temperature_sensitivity": pref.temperature_sensitivity,
        "cold_threshold": pref.cold_threshold,
        "hot_threshold": pref.hot_threshold,
        "layering_preference": pref.layering_preference,
        "avoid_repeat_days": pref.avoid_repeat_days,
        "prefer_underused_items": pref.prefer_underused_items,
        "variety_level": pref.variety_level,
    }


def _parse_item_status(raw: Any) -> ItemStatus:
    try:
        return ItemStatus(raw)
    except (ValueError, TypeError):
        return ItemStatus.ready


def _sanitize_notification_config(channel: str, cfg: dict[str, Any] | None) -> dict[str, Any]:
    """Strip secrets like tokens/passwords before export."""
    if not cfg:
        return {}
    sanitized = dict(cfg)
    secret_keys = {"token", "bearer_token", "secret", "password", "auth", "api_key"}
    for k in list(sanitized.keys()):
        if k.lower() in secret_keys:
            sanitized[k] = None
    if channel == "webhook" and "headers" in sanitized and isinstance(sanitized["headers"], dict):
        sanitized["headers"] = {
            k: ("***" if k.lower() in {"authorization", "x-api-key", "x-secret"} else v)
            for k, v in sanitized["headers"].items()
        }
    return sanitized


def _dump_notification(ns: NotificationSettings) -> dict[str, Any]:
    return {
        "channel": ns.channel,
        "enabled": ns.enabled,
        "config": _sanitize_notification_config(ns.channel, ns.config),
    }


@router.get("/export")
async def export_backup(
    http_request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> StreamingResponse:
    """Stream a ZIP archive with the user's wardrobe, outfits, and images."""
    _ = http_request  # Accept-Language currently unused

    items_q = (
        select(ClothingItem)
        .where(ClothingItem.user_id == current_user.id)
        .options(
            selectinload(ClothingItem.additional_images),
            selectinload(ClothingItem.folders),
        )
    )
    items = list((await db.execute(items_q)).scalars().all())

    folders_q = select(Folder).where(Folder.user_id == current_user.id).order_by(Folder.position)
    folders = list((await db.execute(folders_q)).scalars().all())

    outfits_q = (
        select(Outfit)
        .where(Outfit.user_id == current_user.id)
        .options(selectinload(Outfit.items))
    )
    outfits = list((await db.execute(outfits_q)).scalars().all())

    pref_q = select(UserPreference).where(UserPreference.user_id == current_user.id)
    preferences = (await db.execute(pref_q)).scalar_one_or_none()

    notif_q = select(NotificationSettings).where(
        NotificationSettings.user_id == current_user.id
    )
    notif_settings = list((await db.execute(notif_q)).scalars().all())

    metadata = {
        "version": BACKUP_VERSION,
        "exported_at": datetime.utcnow().isoformat(),
        "user": {
            "id": str(current_user.id),
            "email": current_user.email,
            "display_name": current_user.display_name,
        },
        "preferences": _dump_preferences(preferences),
        "folders": [_dump_folder(f) for f in folders],
        "items": [_dump_item(i) for i in items],
        "outfits": [_dump_outfit(o) for o in outfits],
        "notification_settings": [_dump_notification(n) for n in notif_settings],
    }

    storage_path = Path(settings.storage_path)

    def _iter_zip():
        buf = io.BytesIO()
        with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED, allowZip64=True) as zf:
            zf.writestr(
                "metadata.json",
                json.dumps(metadata, ensure_ascii=False, indent=2),
            )
            for item in items:
                relpaths: set[str] = set()
                for path in [item.image_path, item.thumbnail_path, item.medium_path]:
                    if path:
                        relpaths.add(path)
                for img in item.additional_images or []:
                    for path in [img.image_path, img.thumbnail_path, img.medium_path]:
                        if path:
                            relpaths.add(path)
                for rel in relpaths:
                    full = storage_path / rel
                    try:
                        if full.is_file():
                            zf.write(full, arcname=f"images/{rel}")
                    except OSError as e:
                        logger.warning("Skipping image %s during backup: %s", rel, e)
        buf.seek(0)
        while True:
            chunk = buf.read(64 * 1024)
            if not chunk:
                break
            yield chunk

    filename = f"wardrowbe-backup-{datetime.utcnow().strftime('%Y%m%d-%H%M%S')}.zip"
    return StreamingResponse(
        _iter_zip(),
        media_type="application/zip",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.post("/import", status_code=status.HTTP_202_ACCEPTED)
async def import_backup(
    http_request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    file: UploadFile,
) -> dict[str, Any]:
    """Restore a previously exported ZIP into the current user's account.

    Items and folders are inserted with fresh UUIDs (so imports never clobber
    an existing id). Image files are written under the user's storage folder.
    """
    payload = await file.read()
    if len(payload) > MAX_IMPORT_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=translate_request(http_request, "error.backup_too_large"),
        )

    try:
        zf = zipfile.ZipFile(io.BytesIO(payload))
    except zipfile.BadZipFile as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=translate_request(http_request, "error.backup_invalid_zip"),
        ) from e

    try:
        metadata = json.loads(zf.read("metadata.json").decode("utf-8"))
    except (KeyError, json.JSONDecodeError) as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=translate_request(http_request, "error.backup_missing_metadata"),
        ) from e

    version = int(metadata.get("version", 0))
    if version not in SUPPORTED_VERSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=translate_request(http_request, "error.backup_unsupported_version"),
        )

    storage_path = Path(settings.storage_path)
    user_dir = storage_path / str(current_user.id)
    user_dir.mkdir(parents=True, exist_ok=True)

    counts = {"folders": 0, "items": 0, "outfits": 0, "notifications": 0}

    # Folders first (items reference them).
    folder_id_map: dict[str, UUID] = {}
    for f in metadata.get("folders", []) or []:
        new_folder = Folder(
            user_id=current_user.id,
            name=f.get("name") or "Untitled",
            icon=f.get("icon"),
            color=f.get("color"),
            position=int(f.get("position") or 0),
        )
        db.add(new_folder)
        await db.flush()
        folder_id_map[str(f.get("id"))] = new_folder.id
        counts["folders"] += 1

    # Items (copy image files by original relative path into the new user dir).
    def _rewrite_path(rel_path: str | None) -> str | None:
        if not rel_path:
            return None
        src = f"images/{rel_path}"
        try:
            data = zf.read(src)
        except KeyError:
            return None
        basename = Path(rel_path).name
        new_rel = f"{current_user.id}/imported/{uuid4().hex}_{basename}"
        dest = storage_path / new_rel
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(data)
        return new_rel

    item_id_map: dict[str, UUID] = {}
    for it in metadata.get("items", []) or []:
        image_path = _rewrite_path(it.get("image_path"))
        if not image_path:
            continue
        new_item = ClothingItem(
            user_id=current_user.id,
            type=it.get("type") or "other",
            subtype=it.get("subtype"),
            name=it.get("name"),
            brand=it.get("brand"),
            notes=it.get("notes"),
            favorite=bool(it.get("favorite") or False),
            quantity=int(it.get("quantity") or 1),
            image_path=image_path,
            thumbnail_path=_rewrite_path(it.get("thumbnail_path")),
            medium_path=_rewrite_path(it.get("medium_path")),
            image_hash=it.get("image_hash"),
            tags=it.get("tags") or {},
            colors=it.get("colors") or [],
            primary_color=it.get("primary_color"),
            status=_parse_item_status(it.get("status")),
            ai_processed=bool(it.get("ai_processed") or False),
            ai_confidence=it.get("ai_confidence"),
            ai_description=it.get("ai_description"),
            wear_count=int(it.get("wear_count") or 0),
            wears_since_wash=int(it.get("wears_since_wash") or 0),
            wash_interval=it.get("wash_interval"),
            needs_wash=bool(it.get("needs_wash") or False),
            is_archived=bool(it.get("is_archived") or False),
        )
        db.add(new_item)
        await db.flush()
        item_id_map[str(it.get("id"))] = new_item.id

        for ai in it.get("additional_images") or []:
            ai_image_path = _rewrite_path(ai.get("image_path"))
            if not ai_image_path:
                continue
            db.add(
                ItemImage(
                    item_id=new_item.id,
                    image_path=ai_image_path,
                    thumbnail_path=_rewrite_path(ai.get("thumbnail_path")),
                    medium_path=_rewrite_path(ai.get("medium_path")),
                    position=int(ai.get("position") or 0),
                )
            )

        for folder_old_id in it.get("folder_ids") or []:
            new_fid = folder_id_map.get(str(folder_old_id))
            if new_fid is None:
                continue
            await db.execute(
                item_folders.insert().values(item_id=new_item.id, folder_id=new_fid)
            )

        counts["items"] += 1

    # Outfits
    for o in metadata.get("outfits", []) or []:
        remapped_items: list[tuple[UUID, int, str | None]] = []
        for oi in o.get("items") or []:
            new_item_id = item_id_map.get(str(oi.get("item_id")))
            if new_item_id is None:
                continue
            remapped_items.append(
                (new_item_id, int(oi.get("position") or 0), oi.get("layer_type"))
            )
        if not remapped_items:
            continue
        try:
            source_enum = OutfitSource(o.get("source") or "manual")
        except ValueError:
            source_enum = OutfitSource.manual
        try:
            status_enum = OutfitStatus(o.get("status") or "pending")
        except ValueError:
            status_enum = OutfitStatus.pending
        raw_scheduled = o.get("scheduled_for")
        scheduled_date: date
        if isinstance(raw_scheduled, str) and raw_scheduled:
            try:
                scheduled_date = date.fromisoformat(raw_scheduled.split("T", 1)[0])
            except ValueError:
                scheduled_date = datetime.utcnow().date()
        else:
            scheduled_date = datetime.utcnow().date()
        new_outfit = Outfit(
            user_id=current_user.id,
            occasion=o.get("occasion") or "casual",
            scheduled_for=scheduled_date,
            status=status_enum,
            source=source_enum,
            reasoning=o.get("reasoning"),
            style_notes=o.get("style_notes"),
            weather_data=o.get("weather_data"),
        )
        db.add(new_outfit)
        await db.flush()
        for item_id, position, layer in remapped_items:
            db.add(
                OutfitItem(
                    outfit_id=new_outfit.id,
                    item_id=item_id,
                    position=position,
                    layer_type=layer,
                )
            )
        counts["outfits"] += 1

    # Notification settings (configs without secrets). Skip channels already
    # configured so imports never silently clobber working credentials.
    existing_channels = {
        row[0]
        for row in (
            await db.execute(
                select(NotificationSettings.channel).where(
                    NotificationSettings.user_id == current_user.id
                )
            )
        ).all()
    }
    for ns in metadata.get("notification_settings") or []:
        channel = ns.get("channel")
        if not channel or channel in existing_channels:
            continue
        db.add(
            NotificationSettings(
                user_id=current_user.id,
                channel=channel,
                enabled=bool(ns.get("enabled") or False),
                config=ns.get("config") or {},
            )
        )
        existing_channels.add(channel)
        counts["notifications"] += 1

    # Preferences (upsert by updating existing or creating).
    pref_data = metadata.get("preferences")
    if pref_data:
        pref = (
            await db.execute(
                select(UserPreference).where(UserPreference.user_id == current_user.id)
            )
        ).scalar_one_or_none()
        if pref is None:
            pref = UserPreference(user_id=current_user.id)
            db.add(pref)
        simple_fields = [
            "default_occasion",
            "temperature_unit",
            "temperature_sensitivity",
            "cold_threshold",
            "hot_threshold",
            "layering_preference",
            "avoid_repeat_days",
            "prefer_underused_items",
            "variety_level",
        ]
        for field in simple_fields:
            if field in pref_data and pref_data.get(field) is not None:
                setattr(pref, field, pref_data[field])
        for field in ["color_favorites", "color_avoid"]:
            if pref_data.get(field) is not None:
                setattr(pref, field, list(pref_data[field]))
        for field in ["style_profile", "occasion_preferences"]:
            if pref_data.get(field) is not None:
                setattr(pref, field, pref_data[field])

    await db.commit()

    return {
        "status": "ok",
        "version": version,
        "imported": counts,
    }
