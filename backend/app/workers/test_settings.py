from app.workers import settings as worker_settings


def test_get_redis_settings_supports_password_protected_urls(monkeypatch):
    monkeypatch.setattr(
        worker_settings.settings,
        "redis_url",
        "redis://:redis_xH25hW@1Panel-redis-wM4Y:6379/0",
    )

    redis_settings = worker_settings.get_redis_settings()

    assert redis_settings.host == "1panel-redis-wm4y"
    assert redis_settings.port == 6379
    assert redis_settings.database == 0
    assert redis_settings.password == "redis_xH25hW"
