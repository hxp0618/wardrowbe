import logging
from datetime import UTC, date, datetime
from typing import Annotated, Literal
from uuid import UUID
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from pydantic import BaseModel, ConfigDict, Field, computed_field, field_validator
from sqlalchemy import and_, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.config import get_settings
from app.database import get_db
from app.models.item import ClothingItem
from app.models.outfit import (
    FamilyOutfitRating,
    Outfit,
    OutfitItem,
    OutfitSource,
    OutfitStatus,
    UserFeedback,
)
from app.models.user import User
from app.schemas.item import DEFAULT_WASH_INTERVALS
from app.services.item_service import ItemService
from app.services.learning_service import LearningService
from app.services.outfit_service import OutfitListFilters, OutfitService
from app.services.recommendation_service import RecommendationService
from app.services.studio_service import (
    ItemOwnershipError,
    OutfitNotTemplateError,
    OutfitWornImmutableError,
    StudioService,
)
from app.services.suggestion_cache import clear_suggestions
from app.services.weather_service import WeatherData
from app.utils.api_errors import ApiUserError
from app.utils.auth import get_current_user
from app.utils.i18n import translate_request, translate_validation_message
from app.utils.rate_limit import rate_limit_by_user
from app.utils.signed_urls import sign_image_url

logger = logging.getLogger(__name__)

VALID_OCCASIONS = {
    "casual",
    "office",
    "work",
    "formal",
    "smart-casual",
    "business-casual",
    "date",
    "party",
    "sporty",
    "sport",
    "outdoor",
    "travel",
    "lounge",
    "beach",
    "interview",
    "wedding",
    "dinner",
    "brunch",
    "gym",
    "running",
    "hiking",
    "weekend",
}


def get_user_today(user: User) -> date:
    try:
        user_tz = ZoneInfo(user.timezone or "UTC")
    except Exception:
        user_tz = ZoneInfo("UTC")
    return datetime.now(UTC).astimezone(user_tz).date()


router = APIRouter(prefix="/outfits", tags=["Outfits"])


class WeatherOverrideRequest(BaseModel):
    temperature: float = Field(description="Temperature in Celsius")
    feels_like: float | None = Field(None, description="Feels like temperature")
    condition: str = Field(default="unknown", description="Weather condition")
    precipitation_chance: int = Field(default=0, ge=0, le=100)
    humidity: int = Field(default=50, ge=0, le=100)


class SuggestRequest(BaseModel):
    occasion: str | None = None

    time_of_day: Literal["morning", "afternoon", "evening", "night", "full day"] | None = Field(
        None, description="Time of day for styling context"
    )
    weather_override: WeatherOverrideRequest | None = Field(
        None, description="Manual weather override"
    )
    exclude_items: list[UUID] = Field(default_factory=list, description="Items to exclude")
    include_items: list[UUID] = Field(default_factory=list, description="Items to include")
    target_date: date | None = Field(
        None,
        description="Plan an outfit for a future date (today..+15 days).",
    )

    @field_validator("occasion")
    @classmethod
    def validate_occasion(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip().lower()
        if len(normalized) > 50:
            raise ValueError(f"Occasion must be 50 characters or less")
        if normalized not in VALID_OCCASIONS:
            raise ValueError(f"Invalid occasion. Must be one of: {', '.join(sorted(VALID_OCCASIONS))}")
        return normalized


class OutfitItemResponse(BaseModel):
    id: UUID
    type: str
    subtype: str | None = None
    name: str | None = None
    primary_color: str | None = None
    colors: list[str] = []
    image_path: str | None = None
    thumbnail_path: str | None = None
    layer_type: str | None = None
    position: int

    @computed_field
    @property
    def image_url(self) -> str | None:
        if self.image_path:
            return sign_image_url(self.image_path)
        return None

    @computed_field
    @property
    def thumbnail_url(self) -> str | None:
        if self.thumbnail_path:
            return sign_image_url(self.thumbnail_path)
        return None


class WoreInsteadItem(BaseModel):
    id: UUID
    type: str
    name: str | None = None
    thumbnail_path: str | None = None

    @computed_field
    @property
    def thumbnail_url(self) -> str | None:
        if self.thumbnail_path:
            return sign_image_url(self.thumbnail_path)
        return None


class FeedbackSummary(BaseModel):
    rating: int | None = None
    comment: str | None = None
    worn_at: date | None = None
    actually_worn: bool | None = None
    wore_instead_items: list[WoreInsteadItem] | None = None


class FamilyRatingRequest(BaseModel):
    rating: int = Field(ge=1, le=5, description="Rating 1-5")
    comment: str | None = Field(None, max_length=500)


class FamilyRatingResponse(BaseModel):
    id: UUID
    user_id: UUID
    user_display_name: str
    user_avatar_url: str | None = None
    rating: int
    comment: str | None = None
    created_at: datetime


class OutfitResponse(BaseModel):
    id: UUID
    user_id: UUID
    occasion: str
    scheduled_for: date | None = None
    status: str
    name: str | None = None
    replaces_outfit_id: UUID | None = None
    cloned_from_outfit_id: UUID | None = None
    source: str
    reasoning: str | None = None
    style_notes: str | None = None
    highlights: list[str] | None = None
    weather: dict | None = None
    items: list[OutfitItemResponse]
    feedback: FeedbackSummary | None = None
    family_ratings: list[FamilyRatingResponse] | None = None
    family_rating_average: float | None = None
    family_rating_count: int | None = None
    is_starter_suggestion: bool = False
    created_at: datetime


class ManualOutfitItem(BaseModel):
    item_id: UUID
    layer_type: str | None = Field(None, max_length=20)


class ManualOutfitRequest(BaseModel):
    """Create a manually-curated outfit from user-selected items."""

    occasion: str = Field(default="casual", max_length=50)
    scheduled_for: date | None = Field(
        None,
        description="Target date. Defaults to user's today.",
    )
    items: list[ManualOutfitItem] = Field(
        min_length=1,
        max_length=20,
        description="User-selected items, order matters (first = top).",
    )
    style_notes: str | None = Field(None, max_length=1000)
    reasoning: str | None = Field(None, max_length=2000)
    use_for_learning: bool = Field(
        default=True,
        description="If true, treat this outfit as a positive AI learning signal.",
    )


class ManualOutfitCreate(BaseModel):
    item_ids: list[UUID] = Field(
        min_length=1,
        max_length=10,
        description="Ordered item IDs for a manually curated outfit.",
    )
    occasion: str = Field(default="casual", max_length=50)
    scheduled_for: date | None = Field(
        None,
        description="Target date. Defaults to user's today.",
    )
    name: str | None = Field(None, max_length=100)
    notes: str | None = Field(None, max_length=1000)
    use_for_learning: bool = Field(default=True)


class OutfitListResponse(BaseModel):
    outfits: list[OutfitResponse]
    total: int
    page: int
    page_size: int
    has_more: bool


class FeedbackRequest(BaseModel):
    accepted: bool | None = Field(None, description="Whether outfit was accepted")
    rating: int | None = Field(None, ge=1, le=5, description="Overall rating 1-5")
    comfort_rating: int | None = Field(None, ge=1, le=5, description="Comfort rating 1-5")
    style_rating: int | None = Field(None, ge=1, le=5, description="Style rating 1-5")
    comment: str | None = Field(None, max_length=1000, description="Optional comment")
    worn: bool | None = Field(None, description="Whether the outfit was worn")
    worn_with_modifications: bool | None = Field(
        None, description="If worn, whether modifications were made"
    )
    modification_notes: str | None = Field(None, max_length=500)
    actually_worn: bool | None = Field(
        None, description="Did user actually wear this recommendation?"
    )
    wore_instead_items: list[UUID] | None = Field(
        None, description="Item IDs user wore instead of recommendation"
    )


class FeedbackResponse(BaseModel):
    id: UUID
    outfit_id: UUID
    accepted: bool | None = None
    rating: int | None = None
    comfort_rating: int | None = None
    style_rating: int | None = None
    comment: str | None = None
    worn_at: date | None = None
    worn_with_modifications: bool = False
    modification_notes: str | None = None
    actually_worn: bool | None = None
    wore_instead_items: list[UUID] | None = None
    created_at: datetime


async def fetch_wore_instead_items_map(
    db: AsyncSession, outfits: list[Outfit], user_id: UUID | None = None
) -> dict[str, list[WoreInsteadItem]]:
    all_item_ids: set[UUID] = set()
    outfit_to_item_ids: dict[str, list[str]] = {}

    for outfit in outfits:
        if outfit.feedback and outfit.feedback.wore_instead_items:
            item_ids: list[str] = []
            for item_data in outfit.feedback.wore_instead_items:
                try:
                    if isinstance(item_data, dict):
                        item_id = item_data.get("item_id", "")
                    else:
                        item_id = str(item_data)
                    if item_id:
                        item_ids.append(item_id)
                        all_item_ids.add(UUID(item_id))
                except (ValueError, TypeError, KeyError):
                    continue
            outfit_to_item_ids[str(outfit.id)] = item_ids

    if not all_item_ids:
        return {}

    query = select(ClothingItem).where(ClothingItem.id.in_(all_item_ids))
    if user_id is not None:
        query = query.where(ClothingItem.user_id == user_id)
    result = await db.execute(query)
    items_by_id = {str(item.id): item for item in result.scalars().all()}

    wore_instead_map: dict[str, list[WoreInsteadItem]] = {}
    for outfit_id, item_ids in outfit_to_item_ids.items():
        wore_items = []
        for item_id in item_ids:
            if item_id in items_by_id:
                item = items_by_id[item_id]
                wore_items.append(
                    WoreInsteadItem(
                        id=item.id,
                        type=item.type,
                        name=item.name,
                        thumbnail_path=item.thumbnail_path,
                    )
                )
        if wore_items:
            wore_instead_map[outfit_id] = wore_items

    return wore_instead_map


def outfit_to_response(
    outfit: Outfit,
    wore_instead_items_map: dict[str, list[WoreInsteadItem]] | None = None,
    is_starter_suggestion: bool = False,
) -> OutfitResponse:
    items = []
    for outfit_item in sorted(outfit.items, key=lambda x: x.position):
        item = outfit_item.item
        items.append(
            OutfitItemResponse(
                id=item.id,
                type=item.type,
                subtype=item.subtype,
                name=item.name,
                primary_color=item.primary_color,
                colors=item.colors or [],
                image_path=item.image_path,
                thumbnail_path=item.thumbnail_path,
                layer_type=outfit_item.layer_type,
                position=outfit_item.position,
            )
        )

    feedback_summary = None
    if outfit.feedback:
        wore_instead = None
        if wore_instead_items_map and str(outfit.id) in wore_instead_items_map:
            wore_instead = wore_instead_items_map[str(outfit.id)]
        feedback_summary = FeedbackSummary(
            rating=outfit.feedback.rating,
            comment=outfit.feedback.comment,
            worn_at=outfit.feedback.worn_at,
            actually_worn=outfit.feedback.actually_worn,
            wore_instead_items=wore_instead,
        )

    highlights = None
    if outfit.ai_raw_response and isinstance(outfit.ai_raw_response, dict):
        raw_highlights = outfit.ai_raw_response.get("highlights")
        if raw_highlights and isinstance(raw_highlights, list):
            highlights = raw_highlights

    family_ratings_list = None
    family_rating_average = None
    family_rating_count = None
    if hasattr(outfit, "family_ratings") and outfit.family_ratings:
        family_ratings_list = [
            FamilyRatingResponse(
                id=r.id,
                user_id=r.user_id,
                user_display_name=(r.user.display_name or r.user.email) if r.user else "Unknown",
                user_avatar_url=r.user.avatar_url if r.user else None,
                rating=r.rating,
                comment=r.comment,
                created_at=r.created_at,
            )
            for r in outfit.family_ratings
        ]
        family_rating_count = len(outfit.family_ratings)
        if family_rating_count > 0:
            family_rating_average = (
                sum(r.rating for r in outfit.family_ratings) / family_rating_count
            )

    return OutfitResponse(
        id=outfit.id,
        user_id=outfit.user_id,
        occasion=outfit.occasion,
        scheduled_for=outfit.scheduled_for,
        status=outfit.status.value,
        name=outfit.name,
        replaces_outfit_id=outfit.replaces_outfit_id,
        cloned_from_outfit_id=outfit.cloned_from_outfit_id,
        source=outfit.source.value,
        reasoning=outfit.reasoning,
        style_notes=outfit.style_notes,
        highlights=highlights,
        weather=outfit.weather_data,
        items=items,
        feedback=feedback_summary,
        family_ratings=family_ratings_list,
        family_rating_average=family_rating_average,
        family_rating_count=family_rating_count,
        is_starter_suggestion=is_starter_suggestion,
        created_at=outfit.created_at,
    )


@router.post("/suggest", response_model=OutfitResponse)
async def suggest_outfit(
    request: SuggestRequest,
    http_request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> OutfitResponse:
    await rate_limit_by_user(current_user.id, http_request, "suggest", 10, 60)

    occasion = request.occasion
    if occasion is not None:
        occasion = occasion.strip().lower()
        if len(occasion) > 50:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=translate_request(http_request, "error.occasion_too_long"),
            )
        if occasion not in VALID_OCCASIONS:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=translate_request(
                    http_request,
                    "error.invalid_occasion",
                    occasions=", ".join(sorted(VALID_OCCASIONS)),
                ),
            )
    weather_override = None
    if request.weather_override:
        w = request.weather_override
        weather_override = WeatherData(
            temperature=w.temperature,
            feels_like=w.feels_like or w.temperature,
            humidity=w.humidity,
            precipitation_chance=w.precipitation_chance,
            precipitation_mm=0,
            wind_speed=0,
            condition=w.condition,
            condition_code=0,
            is_day=True,
            uv_index=0,
            timestamp=datetime.utcnow(),
        )

    service = RecommendationService(db)

    if occasion is None:
        if current_user.preferences and current_user.preferences.default_occasion:
            occasion = current_user.preferences.default_occasion
        else:
            occasion = "casual"

    target_date = request.target_date
    if target_date is not None:
        today = get_user_today(current_user)
        if target_date < today:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=translate_request(http_request, "error.target_date_in_past"),
            )
        if (target_date - today).days > 15:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=translate_request(http_request, "error.target_date_too_far"),
            )

    try:
        outfit = await service.generate_recommendation(
            user=current_user,
            occasion=occasion,
            weather_override=weather_override,
            exclude_items=request.exclude_items,
            include_items=request.include_items,
            time_of_day=request.time_of_day,
            scheduled_date=target_date,
        )
    except ApiUserError as e:
        if e.status_code == 503:
            logger.error("AI recommendation error: %s", e.message_key)
        raise HTTPException(
            status_code=e.status_code,
            detail=translate_request(http_request, e.message_key, **e.params),
        ) from None
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=translate_validation_message(str(e), http_request),
        ) from None

    item_service = ItemService(db)
    total_items = await item_service.get_ready_item_count(current_user.id)
    is_starter = total_items <= 5

    wore_instead_map = await fetch_wore_instead_items_map(db, [outfit], user_id=current_user.id)
    return outfit_to_response(outfit, wore_instead_map, is_starter_suggestion=is_starter)


async def _create_manual_outfit_record(
    *,
    item_ids: list[UUID],
    layer_types: list[str | None] | None,
    occasion: str,
    scheduled: date,
    reasoning: str | None,
    style_notes: str | None,
    use_for_learning: bool,
    http_request: Request,
    db: AsyncSession,
    current_user: User,
) -> OutfitResponse:
    if len(set(item_ids)) != len(item_ids):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=translate_request(http_request, "error.duplicate_items"),
        )

    items_result = await db.execute(
        select(ClothingItem).where(
            and_(
                ClothingItem.id.in_(item_ids),
                ClothingItem.user_id == current_user.id,
                ClothingItem.is_archived.is_(False),
            )
        )
    )
    found_items = {item.id: item for item in items_result.scalars().all()}
    if len(found_items) != len(item_ids):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=translate_request(http_request, "error.item_not_found"),
        )

    outfit = Outfit(
        user_id=current_user.id,
        occasion=occasion,
        scheduled_for=scheduled,
        source=OutfitSource.manual,
        status=OutfitStatus.accepted,
        responded_at=datetime.utcnow(),
        reasoning=reasoning,
        style_notes=style_notes,
    )
    db.add(outfit)
    await db.flush()

    for position, item_id in enumerate(item_ids):
        db.add(
            OutfitItem(
                outfit_id=outfit.id,
                item_id=item_id,
                position=position,
                layer_type=layer_types[position] if layer_types else None,
            )
        )

    if use_for_learning:
        db.add(
            UserFeedback(
                outfit_id=outfit.id,
                accepted=True,
                rating=5,
            )
        )

    await db.commit()

    reload_query = (
        select(Outfit)
        .where(Outfit.id == outfit.id)
        .options(
            selectinload(Outfit.items).selectinload(OutfitItem.item),
            selectinload(Outfit.feedback),
            selectinload(Outfit.family_ratings).selectinload(FamilyOutfitRating.user),
        )
    )
    outfit = (await db.execute(reload_query)).scalar_one()

    if use_for_learning:
        try:
            await LearningService(db).process_feedback(outfit.id, current_user.id)
        except Exception as e:
            logger.warning(
                "Manual outfit learning processing failed for outfit %s: %s", outfit.id, e
            )

    return outfit_to_response(outfit)


@router.post("", response_model=OutfitResponse, status_code=status.HTTP_201_CREATED)
async def create_manual_outfit_from_plan(
    request: ManualOutfitCreate,
    http_request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> OutfitResponse:
    occasion = (request.occasion or "casual").strip().lower() or "casual"
    if occasion not in VALID_OCCASIONS:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=translate_request(
                http_request,
                "error.invalid_occasion",
                occasions=", ".join(sorted(VALID_OCCASIONS)),
            ),
        )

    scheduled = request.scheduled_for or get_user_today(current_user)
    return await _create_manual_outfit_record(
        item_ids=request.item_ids,
        layer_types=None,
        occasion=occasion,
        scheduled=scheduled,
        reasoning=request.name,
        style_notes=request.notes,
        use_for_learning=request.use_for_learning,
        http_request=http_request,
        db=db,
        current_user=current_user,
    )


@router.post("/manual", response_model=OutfitResponse, status_code=status.HTTP_201_CREATED)
async def create_manual_outfit(
    request: ManualOutfitRequest,
    http_request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> OutfitResponse:
    """Create an outfit manually from user-selected items.

    When ``use_for_learning`` is true (default) an accepted feedback record is
    created immediately so the learning pipeline treats it as a positive signal.
    """
    occasion = (request.occasion or "casual").strip().lower() or "casual"
    if occasion not in VALID_OCCASIONS:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=translate_request(
                http_request,
                "error.invalid_occasion",
                occasions=", ".join(sorted(VALID_OCCASIONS)),
            ),
        )

    scheduled = request.scheduled_for or get_user_today(current_user)
    return await _create_manual_outfit_record(
        item_ids=[oi.item_id for oi in request.items],
        layer_types=[oi.layer_type for oi in request.items],
        occasion=occasion,
        scheduled=scheduled,
        reasoning=request.reasoning,
        style_notes=request.style_notes,
        use_for_learning=request.use_for_learning,
        http_request=http_request,
        db=db,
        current_user=current_user,
    )


@router.get("", response_model=OutfitListResponse)
async def list_outfits(
    http_request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status_filter: str | None = Query(None, alias="status"),
    occasion: str | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    family_member_id: UUID | None = Query(None, description="View a family member's outfits"),
    source: str | None = Query(None, description="Comma-separated source enum filter"),
    is_lookbook: bool | None = Query(None, description="true for templates only"),
    is_replacement: bool | None = Query(None),
    has_source_item: bool | None = Query(None),
    item_type: str | None = Query(None),
    source_type: str | None = Query(
        None, description="Legacy alias for item_type used by /pairings"
    ),
    search: str | None = Query(None, max_length=50),
    cloned_from_outfit_id: UUID | None = Query(
        None, description="Filter to wear instances of a specific template"
    ),
) -> OutfitListResponse:
    service = OutfitService(db)

    target_user_id = current_user.id
    if family_member_id:
        # Verify same family
        if not current_user.family_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=translate_request(http_request, "error.family_required_for_member_outfits"),
            )
        member_result = await db.execute(
            select(User).where(User.id == family_member_id, User.is_active.is_(True))
        )
        member = member_result.scalar_one_or_none()
        if not member or member.family_id != current_user.family_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=translate_request(http_request, "error.not_in_your_family"),
            )
        target_user_id = family_member_id

    filters = OutfitListFilters(
        user_id=target_user_id,
        status_filter=status_filter,
        occasion=occasion,
        date_from=date_from,
        date_to=date_to,
        source=source,
        is_lookbook=is_lookbook,
        is_replacement=is_replacement,
        has_source_item=has_source_item,
        item_type=item_type or source_type,
        family_member_view=family_member_id is not None,
        search=search,
        cloned_from_outfit_id=cloned_from_outfit_id,
    )

    outfits, total = await service.list_with_filters(filters, page, page_size)

    wore_instead_map = await fetch_wore_instead_items_map(db, outfits, user_id=current_user.id)

    outfit_responses = [outfit_to_response(o, wore_instead_map) for o in outfits]

    return OutfitListResponse(
        outfits=outfit_responses,
        total=total,
        page=page,
        page_size=page_size,
        has_more=(page * page_size) < total,
    )


@router.get("/{outfit_id}", response_model=OutfitResponse)
async def get_outfit(
    outfit_id: UUID,
    http_request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> OutfitResponse:
    query = (
        select(Outfit)
        .where(Outfit.id == outfit_id)
        .options(
            selectinload(Outfit.items).selectinload(OutfitItem.item),
            selectinload(Outfit.feedback),
            selectinload(Outfit.family_ratings).selectinload(FamilyOutfitRating.user),
        )
    )

    result = await db.execute(query)
    outfit = result.scalar_one_or_none()

    if not outfit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=translate_request(http_request, "error.outfit_not_found"),
        )

    if outfit.user_id != current_user.id:
        if not current_user.family_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=translate_request(http_request, "error.access_denied"),
            )
        owner_result = await db.execute(
            select(User).where(User.id == outfit.user_id, User.is_active == True)  # noqa: E712
        )
        owner = owner_result.scalar_one_or_none()
        if not owner or owner.family_id != current_user.family_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=translate_request(http_request, "error.access_denied"),
            )

    wore_instead_user = outfit.user_id if outfit.user_id != current_user.id else current_user.id
    return outfit_to_response(
        outfit, await fetch_wore_instead_items_map(db, [outfit], user_id=wore_instead_user)
    )


@router.post("/{outfit_id}/accept", response_model=OutfitResponse)
async def accept_outfit(
    outfit_id: UUID,
    http_request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> OutfitResponse:
    query = (
        select(Outfit)
        .where(and_(Outfit.id == outfit_id, Outfit.user_id == current_user.id))
        .options(
            selectinload(Outfit.items).selectinload(OutfitItem.item),
            selectinload(Outfit.feedback),
            selectinload(Outfit.family_ratings).selectinload(FamilyOutfitRating.user),
        )
    )

    result = await db.execute(query)
    outfit = result.scalar_one_or_none()

    if not outfit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=translate_request(http_request, "error.outfit_not_found"),
        )

    outfit.status = OutfitStatus.accepted
    outfit.responded_at = datetime.utcnow()
    await db.commit()
    await db.refresh(outfit)

    return outfit_to_response(
        outfit, await fetch_wore_instead_items_map(db, [outfit], user_id=current_user.id)
    )


@router.post("/{outfit_id}/reject", response_model=OutfitResponse)
async def reject_outfit(
    outfit_id: UUID,
    http_request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> OutfitResponse:
    query = (
        select(Outfit)
        .where(and_(Outfit.id == outfit_id, Outfit.user_id == current_user.id))
        .options(
            selectinload(Outfit.items).selectinload(OutfitItem.item),
            selectinload(Outfit.feedback),
            selectinload(Outfit.family_ratings).selectinload(FamilyOutfitRating.user),
        )
    )

    result = await db.execute(query)
    outfit = result.scalar_one_or_none()

    if not outfit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=translate_request(http_request, "error.outfit_not_found"),
        )

    outfit.status = OutfitStatus.rejected
    outfit.responded_at = datetime.utcnow()
    await db.commit()
    await db.refresh(outfit)

    await clear_suggestions(current_user.id, outfit.occasion)

    return outfit_to_response(
        outfit, await fetch_wore_instead_items_map(db, [outfit], user_id=current_user.id)
    )


@router.post("/{outfit_id}/skip", response_model=OutfitResponse)
async def skip_outfit(
    outfit_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> OutfitResponse:
    service = OutfitService(db)
    outfit = await service.set_status(outfit_id, current_user.id, OutfitStatus.skipped)
    await clear_suggestions(current_user.id, outfit.occasion)
    return outfit_to_response(
        outfit, await fetch_wore_instead_items_map(db, [outfit], user_id=current_user.id)
    )


@router.delete("/{outfit_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_outfit(
    outfit_id: UUID,
    http_request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> None:
    query = select(Outfit).where(and_(Outfit.id == outfit_id, Outfit.user_id == current_user.id))

    result = await db.execute(query)
    outfit = result.scalar_one_or_none()

    if not outfit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=translate_request(http_request, "error.outfit_not_found"),
        )

    await db.delete(outfit)
    await db.commit()


@router.post("/{outfit_id}/feedback", response_model=FeedbackResponse)
async def submit_feedback(
    outfit_id: UUID,
    request: FeedbackRequest,
    http_request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> FeedbackResponse:
    query = (
        select(Outfit)
        .where(and_(Outfit.id == outfit_id, Outfit.user_id == current_user.id))
        .options(
            selectinload(Outfit.feedback), selectinload(Outfit.items).selectinload(OutfitItem.item)
        )
    )

    result = await db.execute(query)
    outfit = result.scalar_one_or_none()

    if not outfit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=translate_request(http_request, "error.outfit_not_found"),
        )

    if outfit.feedback:
        feedback = outfit.feedback
    else:
        feedback = UserFeedback(outfit_id=outfit.id)
        db.add(feedback)

    if request.accepted is not None:
        feedback.accepted = request.accepted
        outfit.status = OutfitStatus.accepted if request.accepted else OutfitStatus.rejected
        outfit.responded_at = datetime.utcnow()

    if request.rating is not None:
        feedback.rating = request.rating
    if request.comfort_rating is not None:
        feedback.comfort_rating = request.comfort_rating
    if request.style_rating is not None:
        feedback.style_rating = request.style_rating
    if request.comment is not None:
        feedback.comment = request.comment
    if request.worn and not feedback.worn_at:
        user_today = get_user_today(current_user)
        feedback.worn_at = user_today
        for outfit_item in outfit.items:
            item = outfit_item.item
            effective_interval = (
                item.wash_interval
                if item.wash_interval is not None
                else DEFAULT_WASH_INTERVALS.get(item.type, 3)
            )
            await db.execute(
                update(ClothingItem)
                .where(ClothingItem.id == item.id)
                .values(
                    wear_count=ClothingItem.wear_count + 1,
                    last_worn_at=user_today,
                    wears_since_wash=ClothingItem.wears_since_wash + 1,
                    needs_wash=ClothingItem.wears_since_wash + 1 >= effective_interval,
                )
            )
    if request.worn_with_modifications is not None:
        feedback.worn_with_modifications = request.worn_with_modifications
    if request.modification_notes is not None:
        feedback.modification_notes = request.modification_notes
    if request.actually_worn is not None:
        feedback.actually_worn = request.actually_worn
    if request.wore_instead_items is not None:
        feedback.wore_instead_items = [str(item_id) for item_id in request.wore_instead_items]
        if request.wore_instead_items:
            studio_service = StudioService(db)
            try:
                await studio_service.create_wore_instead(
                    user=current_user,
                    original_outfit_id=outfit_id,
                    item_ids=list(request.wore_instead_items),
                    rating=request.rating,
                    comment=request.comment,
                    scheduled_for=None,
                )
            except ItemOwnershipError:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail={
                        "error_code": "OUTFIT_ITEM_OWNERSHIP",
                        "message": "One or more items do not belong to you",
                    },
                ) from None

    await db.commit()
    await db.refresh(feedback)

    try:
        learning_service = LearningService(db)
        await learning_service.process_feedback(outfit_id, current_user.id)
        logger.info(f"Learning processed for outfit {outfit_id}")
    except Exception as e:
        logger.exception(f"Learning processing failed for outfit {outfit_id}: {e}")

    return FeedbackResponse(
        id=feedback.id,
        outfit_id=feedback.outfit_id,
        accepted=feedback.accepted,
        rating=feedback.rating,
        comfort_rating=feedback.comfort_rating,
        style_rating=feedback.style_rating,
        comment=feedback.comment,
        worn_at=feedback.worn_at,
        worn_with_modifications=feedback.worn_with_modifications,
        modification_notes=feedback.modification_notes,
        actually_worn=feedback.actually_worn,
        wore_instead_items=[UUID(item_id) for item_id in (feedback.wore_instead_items or [])],
        created_at=feedback.created_at,
    )


@router.get("/{outfit_id}/feedback", response_model=FeedbackResponse)
async def get_feedback(
    outfit_id: UUID,
    http_request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> FeedbackResponse:
    query = (
        select(Outfit)
        .where(and_(Outfit.id == outfit_id, Outfit.user_id == current_user.id))
        .options(selectinload(Outfit.feedback))
    )

    result = await db.execute(query)
    outfit = result.scalar_one_or_none()

    if not outfit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=translate_request(http_request, "error.outfit_not_found"),
        )

    if not outfit.feedback:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=translate_request(http_request, "error.no_feedback_for_outfit"),
        )

    feedback = outfit.feedback
    return FeedbackResponse(
        id=feedback.id,
        outfit_id=feedback.outfit_id,
        accepted=feedback.accepted,
        rating=feedback.rating,
        comfort_rating=feedback.comfort_rating,
        style_rating=feedback.style_rating,
        comment=feedback.comment,
        worn_at=feedback.worn_at,
        worn_with_modifications=feedback.worn_with_modifications,
        modification_notes=feedback.modification_notes,
        actually_worn=feedback.actually_worn,
        wore_instead_items=[UUID(item_id) for item_id in (feedback.wore_instead_items or [])],
        created_at=feedback.created_at,
    )


@router.post("/{outfit_id}/family-rating", response_model=FamilyRatingResponse)
async def submit_family_rating(
    outfit_id: UUID,
    request: FamilyRatingRequest,
    http_request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> FamilyRatingResponse:
    result = await db.execute(select(Outfit).where(Outfit.id == outfit_id))
    outfit = result.scalar_one_or_none()

    if not outfit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=translate_request(http_request, "error.outfit_not_found"),
        )

    if outfit.scheduled_for is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error_code": "OUTFIT_IS_TEMPLATE",
                "message": "Cannot rate a lookbook template",
            },
        )

    if outfit.user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=translate_request(http_request, "error.cannot_rate_own_outfit"),
        )

    if not current_user.family_id or not outfit.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=translate_request(http_request, "error.family_required_to_rate"),
        )

    owner_result = await db.execute(
        select(User).where(User.id == outfit.user_id, User.is_active == True)  # noqa: E712
    )
    owner = owner_result.scalar_one_or_none()
    if not owner or owner.family_id != current_user.family_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=translate_request(http_request, "error.family_required_to_rate"),
        )

    existing = await db.execute(
        select(FamilyOutfitRating).where(
            and_(
                FamilyOutfitRating.outfit_id == outfit_id,
                FamilyOutfitRating.user_id == current_user.id,
            )
        )
    )
    rating = existing.scalar_one_or_none()

    if rating:
        rating.rating = request.rating
        rating.comment = request.comment
    else:
        rating = FamilyOutfitRating(
            outfit_id=outfit_id,
            user_id=current_user.id,
            rating=request.rating,
            comment=request.comment,
        )
        db.add(rating)

    await db.flush()
    await db.refresh(rating)

    return FamilyRatingResponse(
        id=rating.id,
        user_id=rating.user_id,
        user_display_name=current_user.display_name or current_user.email,
        user_avatar_url=current_user.avatar_url,
        rating=rating.rating,
        comment=rating.comment,
        created_at=rating.created_at,
    )


@router.get("/{outfit_id}/family-ratings", response_model=list[FamilyRatingResponse])
async def get_family_ratings(
    outfit_id: UUID,
    http_request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> list[FamilyRatingResponse]:
    result = await db.execute(select(Outfit).where(Outfit.id == outfit_id))
    outfit = result.scalar_one_or_none()

    if not outfit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=translate_request(http_request, "error.outfit_not_found"),
        )

    if outfit.user_id != current_user.id:
        if not current_user.family_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=translate_request(http_request, "error.access_denied"),
            )
        owner_result = await db.execute(
            select(User).where(User.id == outfit.user_id, User.is_active == True)  # noqa: E712
        )
        owner = owner_result.scalar_one_or_none()
        if not owner or owner.family_id != current_user.family_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=translate_request(http_request, "error.access_denied"),
            )

    ratings_result = await db.execute(
        select(FamilyOutfitRating)
        .where(FamilyOutfitRating.outfit_id == outfit_id)
        .options(selectinload(FamilyOutfitRating.user))
        .order_by(FamilyOutfitRating.created_at.desc())
    )
    ratings = list(ratings_result.scalars().all())

    return [
        FamilyRatingResponse(
            id=r.id,
            user_id=r.user_id,
            user_display_name=r.user.display_name or r.user.email,
            user_avatar_url=r.user.avatar_url,
            rating=r.rating,
            comment=r.comment,
            created_at=r.created_at,
        )
        for r in ratings
    ]


def _check_studio_kill_switch() -> None:
    if get_settings().studio_disabled:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "error_code": "STUDIO_UNAVAILABLE",
                "message": "Studio is temporarily unavailable. AI features still work.",
            },
        )


class StudioCreateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[UUID] = Field(min_length=1, max_length=20)
    occasion: str = Field(max_length=50)
    name: Annotated[str | None, Field(max_length=100)] = None
    scheduled_for: date | None = None
    mark_worn: bool = False
    source_item_id: UUID | None = None

    @field_validator("occasion")
    @classmethod
    def validate_occasion(cls, v: str) -> str:
        v = v.strip().lower()
        if v not in VALID_OCCASIONS:
            raise ValueError(
                f"Invalid occasion '{v}'. Must be one of: {', '.join(sorted(VALID_OCCASIONS))}"
            )
        return v


class WoreInsteadRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[UUID] = Field(min_length=1, max_length=20)
    rating: Annotated[int | None, Field(ge=1, le=5)] = None
    comment: Annotated[str | None, Field(max_length=1000)] = None
    scheduled_for: date | None = None


class CloneToLookbookRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=1, max_length=100)


class WearTodayRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    scheduled_for: date | None = None


class PatchOutfitRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: Annotated[str | None, Field(max_length=100)] = None
    items: Annotated[list[UUID] | None, Field(min_length=1, max_length=20)] = None


async def _run_learning_safely(db: AsyncSession, outfit_id: UUID, user_id: UUID) -> None:
    try:
        await LearningService(db).process_feedback(outfit_id, user_id)
    except Exception as e:
        logger.exception("learning process_feedback failed for outfit %s: %s", outfit_id, e)


@router.post("/studio", response_model=OutfitResponse, status_code=status.HTTP_201_CREATED)
async def create_studio_outfit(
    request: StudioCreateRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> OutfitResponse:
    _check_studio_kill_switch()
    await rate_limit_by_user(current_user.id, None, "studio_create", 20, 60)

    service = StudioService(db)
    try:
        outfit = await service.create_from_scratch(
            user=current_user,
            item_ids=request.items,
            occasion=request.occasion,
            name=request.name,
            scheduled_for=request.scheduled_for,
            mark_worn=request.mark_worn,
            source_item_id=request.source_item_id,
        )
    except ItemOwnershipError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "error_code": "OUTFIT_ITEM_OWNERSHIP",
                "message": "One or more items do not belong to you",
            },
        ) from None

    await db.commit()
    await _run_learning_safely(db, outfit.id, current_user.id)
    await clear_suggestions(current_user.id, outfit.occasion)

    full = await service.get_full_outfit(outfit.id)
    return outfit_to_response(full)


@router.post("/{outfit_id}/wore-instead", response_model=OutfitResponse)
async def create_wore_instead_outfit(
    outfit_id: UUID,
    request: WoreInsteadRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> OutfitResponse:
    _check_studio_kill_switch()
    await rate_limit_by_user(current_user.id, None, "wore_instead", 10, 60)

    service = StudioService(db)
    try:
        replacement = await service.create_wore_instead(
            user=current_user,
            original_outfit_id=outfit_id,
            item_ids=request.items,
            rating=request.rating,
            comment=request.comment,
            scheduled_for=request.scheduled_for,
        )
    except LookupError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error_code": "OUTFIT_NOT_FOUND", "message": "Outfit not found"},
        ) from None
    except ItemOwnershipError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "error_code": "OUTFIT_ITEM_OWNERSHIP",
                "message": "One or more items do not belong to you",
            },
        ) from None

    await db.commit()
    await _run_learning_safely(db, replacement.id, current_user.id)
    await clear_suggestions(current_user.id, replacement.occasion)

    full = await service.get_full_outfit(replacement.id)
    return outfit_to_response(full)


@router.post("/{outfit_id}/clone-to-lookbook", response_model=OutfitResponse)
async def clone_outfit_to_lookbook(
    outfit_id: UUID,
    request: CloneToLookbookRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> OutfitResponse:
    _check_studio_kill_switch()
    await rate_limit_by_user(current_user.id, None, "clone_to_lookbook", 20, 60)

    service = StudioService(db)
    try:
        clone = await service.clone_to_lookbook(
            user=current_user,
            source_outfit_id=outfit_id,
            name=request.name,
        )
    except LookupError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error_code": "OUTFIT_NOT_FOUND", "message": "Outfit not found"},
        ) from None

    await db.commit()
    await _run_learning_safely(db, clone.id, current_user.id)

    full = await service.get_full_outfit(clone.id)
    return outfit_to_response(full)


@router.post("/{outfit_id}/wear-today", response_model=OutfitResponse)
async def wear_outfit_today(
    outfit_id: UUID,
    request: WearTodayRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> OutfitResponse:
    _check_studio_kill_switch()
    await rate_limit_by_user(current_user.id, None, "wear_today", 10, 60)

    service = StudioService(db)
    try:
        wear = await service.wear_today(
            user=current_user,
            template_id=outfit_id,
            scheduled_for=request.scheduled_for,
        )
    except LookupError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error_code": "OUTFIT_NOT_FOUND", "message": "Outfit not found"},
        ) from None
    except OutfitNotTemplateError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error_code": "OUTFIT_NOT_TEMPLATE",
                "message": "wear-today requires a lookbook template",
            },
        ) from None

    await db.commit()
    await _run_learning_safely(db, wear.id, current_user.id)
    await clear_suggestions(current_user.id, wear.occasion)

    full = await service.get_full_outfit(wear.id)
    return outfit_to_response(full)


@router.patch("/{outfit_id}", response_model=OutfitResponse)
async def patch_outfit_endpoint(
    outfit_id: UUID,
    request: PatchOutfitRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> OutfitResponse:
    _check_studio_kill_switch()
    await rate_limit_by_user(current_user.id, None, "patch_outfit", 30, 60)

    if request.name is None and request.items is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error_code": "PATCH_EMPTY", "message": "No fields provided"},
        )

    service = StudioService(db)
    try:
        updated = await service.patch_outfit(
            user=current_user,
            outfit_id=outfit_id,
            name=request.name,
            items=request.items,
        )
    except LookupError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error_code": "OUTFIT_NOT_FOUND", "message": "Outfit not found"},
        ) from None
    except ItemOwnershipError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "error_code": "OUTFIT_ITEM_OWNERSHIP",
                "message": "One or more items do not belong to you",
            },
        ) from None
    except OutfitWornImmutableError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "error_code": "OUTFIT_WORN_IMMUTABLE",
                "message": "Cannot modify items on a worn outfit. Create a new lookbook entry instead.",
            },
        ) from None

    await db.commit()

    full = await service.get_full_outfit(updated.id)
    return outfit_to_response(full)


@router.delete("/{outfit_id}/family-rating", status_code=status.HTTP_204_NO_CONTENT)
async def delete_family_rating(
    outfit_id: UUID,
    http_request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> None:
    result = await db.execute(
        select(FamilyOutfitRating).where(
            and_(
                FamilyOutfitRating.outfit_id == outfit_id,
                FamilyOutfitRating.user_id == current_user.id,
            )
        )
    )
    rating = result.scalar_one_or_none()

    if not rating:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=translate_request(http_request, "error.rating_not_found"),
        )

    await db.delete(rating)
    await db.flush()
