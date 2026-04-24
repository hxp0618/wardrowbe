from urllib.parse import urlparse

from arq.connections import RedisSettings

from app.config import get_settings

settings = get_settings()


def get_redis_settings() -> RedisSettings:
    parsed = urlparse(str(settings.redis_url))
    database = int(parsed.path.lstrip("/") or 0)

    return RedisSettings(
        host=parsed.hostname or "localhost",
        port=parsed.port or 6379,
        database=database,
        username=parsed.username,
        password=parsed.password,
        ssl=parsed.scheme == "rediss",
    )
