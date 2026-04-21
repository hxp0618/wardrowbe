import logging
from ipaddress import ip_address, ip_network
from uuid import UUID

from fastapi import HTTPException, Request, status
from redis.asyncio import Redis

from app.config import get_settings
from app.utils.i18n import translate_request

logger = logging.getLogger(__name__)


def _is_trusted_proxy(client_host: str) -> bool:
    settings = get_settings()
    if not settings.trusted_proxy_ips:
        return False

    try:
        client_ip = ip_address(client_host)
    except ValueError:
        return False

    for trusted_proxy in settings.trusted_proxy_ips:
        try:
            if client_ip in ip_network(trusted_proxy, strict=False):
                return True
        except ValueError:
            logger.warning("Ignoring invalid TRUSTED_PROXY_IPS entry: %s", trusted_proxy)
    return False


def _get_client_ip(request: Request) -> str:
    client_host = request.client.host if request.client else "unknown"
    if not _is_trusted_proxy(client_host):
        return client_host

    settings = get_settings()
    for header_name in settings.trusted_proxy_headers:
        forwarded = request.headers.get(header_name)
        if forwarded:
            return forwarded.split(",")[0].strip()

    return client_host


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
