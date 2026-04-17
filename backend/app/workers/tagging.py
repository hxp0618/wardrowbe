import logging
from pathlib import Path
from typing import Any
from uuid import UUID

from sqlalchemy import select

from app.models.item import ClothingItem, ItemStatus
from app.services.ai_service import AIService, ClothingTags
from app.workers.db import get_db_session

logger = logging.getLogger(__name__)


def tags_to_item_fields(tags: ClothingTags, raw_response: str | None = None) -> dict[str, Any]:
    """Convert ClothingTags to item database fields."""
    localized = tags.localized_tags or {}

    def localized_value(key: str, fallback: Any) -> Any:
        value = localized.get(key)
        if value in (None, [], "", {}):
            return fallback
        return value

    # Build the tags JSONB object for frontend display
    tags_jsonb = {
        "subtype": localized_value("subtype", tags.subtype),
        "primary_color": localized_value("primary_color", tags.primary_color),
        "colors": localized_value("colors", tags.colors or []),
        "pattern": localized_value("pattern", tags.pattern),
        "material": localized_value("material", tags.material),
        "style": localized_value("style", tags.style or []),
        "season": localized_value("season", tags.season or []),
        "formality": localized_value("formality", tags.formality),
        "fit": localized_value("fit", tags.fit),
        "occasion": localized_value("occasion", tags.occasion or []),
        "brand": localized_value("brand", tags.brand),
        "condition": localized_value("condition", tags.condition),
        "features": localized_value("features", tags.features or []),
    }
    if tags.logprobs_confidence is not None:
        tags_jsonb["logprobs_confidence"] = tags.logprobs_confidence

    fields = {
        "type": tags.type,
        "subtype": tags.subtype,
        "primary_color": tags.primary_color,
        "colors": tags.colors,
        "pattern": tags.pattern,
        "material": tags.material,
        "style": tags.style,
        "formality": tags.formality,
        "season": tags.season,
        "tags": tags_jsonb,  # Populate the tags JSONB field for frontend
        "ai_processed": True,
        "ai_confidence": tags.confidence,
        "ai_description": tags.description,  # Human-readable description
        "status": ItemStatus.ready,
    }
    if raw_response:
        fields["ai_raw_response"] = {"raw_text": raw_response}
    return fields


async def update_item_status_to_error(ctx: dict, item_id: str, error_msg: str) -> None:
    """Update item status to error in database."""
    try:
        db = get_db_session(ctx)
        try:
            result = await db.execute(select(ClothingItem).where(ClothingItem.id == UUID(item_id)))
            item = result.scalar_one_or_none()
            if item:
                logger.info("Setting item status to error item_id=%s error=%s", item_id, error_msg)
                item.status = ItemStatus.error
                item.ai_raw_response = {"error": error_msg}
                await db.commit()
                logger.info("Item status updated to error item_id=%s", item_id)
            else:
                logger.error("Failed to set item status to error because item was not found item_id=%s", item_id)
        finally:
            await db.close()
    except Exception as e:
        logger.error(f"Failed to update item {item_id} status to error: {e}")


async def tag_item_image(
    ctx: dict,
    item_id: str,
    image_path: str,
    extra_image_paths: list[str] | None = None,
) -> dict[str, Any]:
    """
    Analyze an item's image(s) and update it with AI-generated tags.

    Args:
        ctx: arq context
        item_id: UUID of the item to tag
        image_path: Path to the primary image file
        extra_image_paths: Optional additional image paths of the SAME item
            (e.g. front/back/tag); when provided the vision model is given all
            images at once to produce a single unified set of tags.

    Returns:
        Dict with status and tags
    """
    logger.info(
        "Starting AI tagging item_id=%s image_path=%s extra_count=%s",
        item_id,
        image_path,
        len(extra_image_paths or []),
    )

    try:
        # Verify primary image exists
        path = Path(image_path)
        if not path.exists():
            error_msg = f"Image not found: {image_path}"
            logger.error(error_msg)
            await update_item_status_to_error(ctx, item_id, error_msg)
            return {"status": "error", "error": "Image not found"}

        # Build list of image paths to analyze (primary first, then valid extras)
        image_paths: list[Path] = [path]
        for extra in extra_image_paths or []:
            extra_path = Path(extra)
            if extra_path.exists():
                image_paths.append(extra_path)
            else:
                logger.warning(
                    "Skipping missing additional image for tagging item_id=%s path=%s",
                    item_id,
                    extra,
                )

        # Get user's AI endpoints from preferences
        ai_endpoints = None
        db = get_db_session(ctx)
        try:
            # Get the item to find user_id
            result = await db.execute(select(ClothingItem).where(ClothingItem.id == UUID(item_id)))
            item = result.scalar_one_or_none()
            if item:
                logger.info("Loaded item for AI tagging item_id=%s user_id=%s", item_id, item.user_id)
                # Get user's preferences for AI endpoints
                from app.models.preference import UserPreference

                pref_result = await db.execute(
                    select(UserPreference).where(UserPreference.user_id == item.user_id)
                )
                prefs = pref_result.scalar_one_or_none()
                if prefs and prefs.ai_endpoints:
                    ai_endpoints = prefs.ai_endpoints
                    logger.info("Using %s custom AI endpoints for user_id=%s", len(ai_endpoints), item.user_id)
                else:
                    logger.info("No custom AI endpoints configured for user_id=%s; using default endpoint", item.user_id)
            else:
                logger.error("Item not found before AI tagging item_id=%s", item_id)
        finally:
            await db.close()

        # Analyze with AI (uses custom endpoints if available)
        ai_service = AIService(endpoints=ai_endpoints)
        logger.info(
            "Invoking AI service for item_id=%s image_count=%s custom_endpoint_count=%s",
            item_id,
            len(image_paths),
            len(ai_endpoints or []),
        )
        tags = await ai_service.analyze_images(image_paths)

        logger.info(
            "AI analysis complete item_id=%s type=%s color=%s confidence=%s",
            item_id,
            tags.type,
            tags.primary_color,
            tags.confidence,
        )

        # Update item in database
        db = get_db_session(ctx)
        try:
            result = await db.execute(select(ClothingItem).where(ClothingItem.id == UUID(item_id)))
            item = result.scalar_one_or_none()

            if item is None:
                logger.error(f"Item not found: {item_id}")
                return {"status": "error", "error": "Item not found"}

            # Update item fields - only update if user hasn't already set a value
            # Always update: ai_processed, ai_confidence, status, ai_raw_response
            # Conditionally update: type, subtype, primary_color, colors, pattern, material, style, formality, season
            ai_fields = tags_to_item_fields(tags, tags.raw_response)

            for field, value in ai_fields.items():
                # Always update AI metadata fields (including tags JSONB and description)
                if field in (
                    "ai_processed",
                    "ai_confidence",
                    "status",
                    "ai_raw_response",
                    "tags",
                    "ai_description",
                ):
                    setattr(item, field, value)
                # Only update content fields if user hasn't set them (or they're default/unknown)
                elif field == "type":
                    if not item.type or item.type == "unknown":
                        setattr(item, field, value)
                elif field == "subtype":
                    if not item.subtype:
                        setattr(item, field, value)
                elif field == "primary_color":
                    if not item.primary_color or item.primary_color == "unknown":
                        setattr(item, field, value)
                else:
                    # For other fields (colors, pattern, material, style, etc.), only set if not already set
                    current_value = getattr(item, field, None)
                    if (
                        current_value is None
                        or current_value == []
                        or current_value == ""
                        or current_value == {}
                    ):
                        setattr(item, field, value)

            await db.commit()
            logger.info("Updated item with AI tags item_id=%s status=%s", item_id, ItemStatus.ready)

            return {
                "status": "success",
                "item_id": item_id,
                "tags": tags.model_dump(exclude={"raw_response"}),
            }

        finally:
            await db.close()

    except Exception as e:
        error_msg = str(e)
        logger.exception(f"Error tagging item {item_id}: {error_msg}")
        await update_item_status_to_error(ctx, item_id, error_msg)
        return {"status": "error", "error": error_msg}
