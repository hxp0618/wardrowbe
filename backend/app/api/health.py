from typing import Any

from fastapi import APIRouter, Depends, Request
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.services.ai_service import get_ai_service
from app.utils.i18n import translate_request

router = APIRouter()


@router.get("/health")
async def health_check(http_request: Request) -> dict[str, str]:
    return {"status": translate_request(http_request, "health.status_ok")}


@router.get("/health/ready")
async def readiness_check(
    http_request: Request, db: AsyncSession = Depends(get_db)
) -> dict[str, Any]:
    fail = translate_request(http_request, "health.status_fail")
    ok = translate_request(http_request, "health.status_ok")

    checks: dict[str, str] = {
        "database": fail,
    }

    try:
        await db.execute(text("SELECT 1"))
        checks["database"] = ok
    except Exception as e:
        checks["database"] = translate_request(http_request, "health.check_db_error", error=str(e))

    def _is_ok(v: str) -> bool:
        return v == ok

    overall = ok if all(_is_ok(v) for v in checks.values()) else fail

    return {
        "status": overall,
        "checks": checks,
    }


@router.get("/health/features")
async def feature_check() -> dict[str, Any]:
    features = {}
    try:
        from app.services.background_removal import get_provider

        get_provider()
        features["background_removal"] = True
    except Exception:
        features["background_removal"] = False
    return features


@router.get("/health/ai")
async def ai_health_check() -> dict[str, Any]:
    ai_service = get_ai_service()
    raw = await ai_service.check_health()

    sanitized_endpoints = []
    for ep in raw.get("endpoints", []):
        sanitized_endpoints.append(
            {
                "name": ep.get("name"),
                "status": ep.get("status"),
            }
        )

    return {
        "status": raw.get("status", "unknown"),
        "endpoints": sanitized_endpoints,
    }
