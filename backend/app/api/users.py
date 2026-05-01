from decimal import Decimal
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.services.user_service import UserService
from app.services.weather_service import WeatherService, WeatherServiceError
from app.utils.api_errors import ApiUserError
from app.utils.auth import get_current_user
from app.utils.i18n import translate_request

router = APIRouter(prefix="/users/me", tags=["Users"])


class OnboardingCompleteResponse(BaseModel):
    onboarding_completed: bool


class UserProfileResponse(BaseModel):
    id: str
    email: str
    display_name: str
    avatar_url: str | None = None
    timezone: str
    location_lat: float | None = None
    location_lon: float | None = None
    location_name: str | None = None
    family_id: str | None = None
    role: str
    onboarding_completed: bool
    body_measurements: dict | None = None


class UserProfileUpdate(BaseModel):
    display_name: str | None = None
    avatar_url: str | None = None
    timezone: str | None = None
    location_lat: Decimal | None = None
    location_lon: Decimal | None = None
    location_name: str | None = None
    body_measurements: dict | None = None


@router.get("", response_model=UserProfileResponse)
async def get_profile(
    current_user: Annotated[User, Depends(get_current_user)],
) -> UserProfileResponse:
    return _user_response(current_user)


@router.patch("", response_model=UserProfileResponse)
async def update_profile(
    data: UserProfileUpdate,
    http_request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> UserProfileResponse:
    update_data = data.model_dump(exclude_unset=True)

    if "location_name" in update_data:
        await _resolve_location_update(update_data, http_request)

    if "body_measurements" in update_data and update_data["body_measurements"] is not None:
        numeric_keys = {"chest", "waist", "hips", "inseam", "height", "weight"}
        for key, value in update_data["body_measurements"].items():
            if key in numeric_keys and isinstance(value, (int, float)) and value <= 0:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=translate_request(
                        http_request, "error.body_measurement_positive", field=key
                    ),
                )

    for field, value in update_data.items():
        setattr(current_user, field, value)

    await db.flush()
    await db.refresh(current_user)
    await db.commit()

    return _user_response(current_user)


async def _resolve_location_update(update_data: dict, http_request: Request) -> None:
    raw_location_name = update_data.get("location_name")
    location_name = raw_location_name.strip() if isinstance(raw_location_name, str) else ""

    if not location_name:
        update_data["location_name"] = None
        update_data.setdefault("location_lat", None)
        update_data.setdefault("location_lon", None)
        return

    update_data["location_name"] = location_name
    coordinates_provided = (
        update_data.get("location_lat") is not None
        and update_data.get("location_lon") is not None
    )
    if coordinates_provided:
        return

    try:
        location = await WeatherService().geocode_location(location_name)
    except ApiUserError as e:
        raise HTTPException(
            status_code=e.status_code,
            detail=translate_request(http_request, e.message_key, **e.params),
        ) from None
    except WeatherServiceError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=translate_request(http_request, "error.weather_service_unavailable"),
        ) from None

    update_data["location_name"] = location.name or location.address or location_name
    update_data["location_lat"] = Decimal(str(location.latitude))
    update_data["location_lon"] = Decimal(str(location.longitude))


def _user_response(user: User) -> UserProfileResponse:
    return UserProfileResponse(
        id=str(user.id),
        email=user.email,
        display_name=user.display_name,
        avatar_url=user.avatar_url,
        timezone=user.timezone,
        location_lat=float(user.location_lat) if user.location_lat is not None else None,
        location_lon=float(user.location_lon) if user.location_lon is not None else None,
        location_name=user.location_name,
        family_id=str(user.family_id) if user.family_id else None,
        role=user.role,
        onboarding_completed=user.onboarding_completed,
        body_measurements=user.body_measurements,
    )


@router.post("/onboarding/complete", response_model=OnboardingCompleteResponse)
async def complete_onboarding(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> OnboardingCompleteResponse:
    user_service = UserService(db)
    await user_service.complete_onboarding(current_user)
    await db.commit()

    return OnboardingCompleteResponse(onboarding_completed=True)
