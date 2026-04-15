import logging
from uuid import UUID

from fastapi import HTTPException, Request, status
from redis.asyncio import Redis

from app.config import get_settings
from app.utils.i18n import translate_request

logger = logging.getLogger(__name__)


def _get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client:
        return request.client.host
    return "unknown"


async def check_rate_limit(
    key: str, limit: int, window_seconds: int, request: Request | None = None
) -> None:
    settings = get_settings()
    try:
        redis = Redis.from_url(str(settings.redis_url))
        try:
            pipe = redis.pipeline()
            pipe.incr(key)
            pipe.expire(key, window_seconds)
            results = await pipe.execute()
            count = results[0]
            if count > limit:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=translate_request(request, "error.rate_limit"),
                )
        finally:
            await redis.aclose()
    except HTTPException:
        raise
    except Exception as e:
        logger.warning("Rate limit check failed (allowing request): %s", e)


async def rate_limit_by_ip(request: Request, action: str, limit: int, window_seconds: int) -> None:
    ip = _get_client_ip(request)
    key = f"rate_limit:{action}:ip:{ip}"
    await check_rate_limit(key, limit, window_seconds, request)


async def rate_limit_by_user(
    user_id: UUID, request: Request | None, action: str, limit: int, window_seconds: int
) -> None:
    key = f"rate_limit:{action}:user:{user_id}"
    await check_rate_limit(key, limit, window_seconds, request)
