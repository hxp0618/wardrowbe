from datetime import UTC, date, datetime
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch
from uuid import uuid4

import pytest

from app.models.item import ClothingItem, ItemStatus
from app.models.outfit import Outfit, OutfitItem, OutfitSource, OutfitStatus
from app.models.user import User
from app.services.item_scorer import ScoredItem
from app.services.recommendation_service import (
    RecommendationService,
    get_time_of_day,
)
from app.services.weather_service import DailyForecast, WeatherData


def _make_user(timezone: str = "UTC") -> User:
    uid = uuid4()
    return User(
        id=uid,
        external_id=f"test-{uid}",
        email=f"test-{uid}@example.com",
        display_name="Test",
        timezone=timezone,
        is_active=True,
    )


class TestGetTimeOfDay:
    @pytest.mark.parametrize(
        "hour,expected",
        [
            (6, "morning"),
            (9, "morning"),
            (11, "morning"),
            (12, "afternoon"),
            (14, "afternoon"),
            (16, "afternoon"),
            (17, "evening"),
            (19, "evening"),
            (20, "evening"),
            (21, "night"),
            (23, "night"),
            (0, "night"),
            (3, "night"),
            (5, "night"),
        ],
    )
    def test_time_buckets(self, hour, expected):
        user = _make_user("UTC")
        mock_dt = datetime(2026, 3, 8, hour, 30, 0, tzinfo=UTC)
        with patch("app.services.recommendation_service.datetime") as mock_datetime:
            mock_datetime.now.return_value = mock_dt
            mock_datetime.side_effect = lambda *a, **kw: datetime(*a, **kw)
            result = get_time_of_day(user)
        assert result == expected

    def test_respects_user_timezone(self):
        user = _make_user("Asia/Kolkata")
        mock_dt = datetime(2026, 3, 8, 13, 30, 0, tzinfo=UTC)
        with patch("app.services.recommendation_service.datetime") as mock_datetime:
            mock_datetime.now.return_value = mock_dt
            mock_datetime.side_effect = lambda *a, **kw: datetime(*a, **kw)
            result = get_time_of_day(user)
        assert result == "evening"

    def test_invalid_timezone_falls_back_to_utc(self):
        user = _make_user("Invalid/Timezone")
        mock_dt = datetime(2026, 3, 8, 9, 0, 0, tzinfo=UTC)
        with patch("app.services.recommendation_service.datetime") as mock_datetime:
            mock_datetime.now.return_value = mock_dt
            mock_datetime.side_effect = lambda *a, **kw: datetime(*a, **kw)
            result = get_time_of_day(user)
        assert result == "morning"

    def test_none_timezone_falls_back_to_utc(self):
        user = _make_user()
        user.timezone = None
        mock_dt = datetime(2026, 3, 8, 22, 0, 0, tzinfo=UTC)
        with patch("app.services.recommendation_service.datetime") as mock_datetime:
            mock_datetime.now.return_value = mock_dt
            mock_datetime.side_effect = lambda *a, **kw: datetime(*a, **kw)
            result = get_time_of_day(user)
        assert result == "night"


class TestPromptTemplate:
    def test_prompt_contains_fashion_principles(self):
        from app.services.recommendation_service import RECOMMENDATION_PROMPT

        prompt = RECOMMENDATION_PROMPT
        assert "Color coordination" in prompt
        assert "Monochrome" in prompt
        assert "Neutral base" in prompt
        assert "Analogous" in prompt
        assert "Texture and fabric" in prompt
        assert "Proportion and silhouette" in prompt
        assert "Time of day" in prompt
        assert "Full day" in prompt
        assert "{time_of_day}" in prompt

    def test_prompt_format_accepts_time_of_day(self):
        from app.services.recommendation_service import RECOMMENDATION_PROMPT

        formatted = RECOMMENDATION_PROMPT.format(
            occasion="casual",
            time_of_day="evening",
            temperature=22,
            feels_like=20,
            condition="clear",
            precipitation_chance=10,
            preferences_text="",
            items_text="[1] shirt | blue | cotton",
        )
        assert "evening" in formatted
        assert "casual" in formatted
        assert "22" in formatted

    def test_prompt_format_all_time_of_day_values(self):
        from app.services.recommendation_service import RECOMMENDATION_PROMPT

        for tod in ["morning", "afternoon", "evening", "night", "full day"]:
            formatted = RECOMMENDATION_PROMPT.format(
                occasion="work",
                time_of_day=tod,
                temperature=15,
                feels_like=13,
                condition="cloudy",
                precipitation_chance=30,
                preferences_text="",
                items_text="[1] shirt",
            )
            assert tod in formatted


class TestSuggestRequestTimeOfDay:
    @pytest.mark.asyncio
    async def test_suggest_accepts_time_of_day(self, client, test_user, auth_headers, db_session):
        from app.models.item import ClothingItem, ItemStatus

        for item_type in ["shirt", "pants", "sneakers"]:
            item = ClothingItem(
                user_id=test_user.id,
                type=item_type,
                image_path=f"test/{uuid4()}.jpg",
                status=ItemStatus.ready,
                primary_color="blue",
            )
            db_session.add(item)
        await db_session.commit()

        response = await client.post(
            "/api/v1/outfits/suggest",
            json={
                "occasion": "casual",
                "time_of_day": "evening",
                "weather_override": {
                    "temperature": 20,
                    "condition": "clear",
                },
            },
            headers=auth_headers,
        )
        assert response.status_code != 422

    @pytest.mark.asyncio
    async def test_suggest_rejects_invalid_time_of_day(self, client, test_user, auth_headers):
        response = await client.post(
            "/api/v1/outfits/suggest",
            json={
                "occasion": "casual",
                "time_of_day": "brunch",
            },
            headers=auth_headers,
        )
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_suggest_accepts_full_day(self, client, test_user, auth_headers):
        response = await client.post(
            "/api/v1/outfits/suggest",
            json={
                "occasion": "casual",
                "time_of_day": "full day",
                "weather_override": {"temperature": 20, "condition": "clear"},
            },
            headers=auth_headers,
        )
        assert response.status_code != 422

    @pytest.mark.asyncio
    async def test_suggest_allows_null_time_of_day(self, client, test_user, auth_headers):
        response = await client.post(
            "/api/v1/outfits/suggest",
            json={
                "occasion": "casual",
                "time_of_day": None,
                "weather_override": {
                    "temperature": 20,
                    "condition": "clear",
                },
            },
            headers=auth_headers,
        )
        assert response.status_code != 422


class TestSuggestEndpointRuntime:
    @pytest.mark.asyncio
    async def test_suggest_reaches_ready_item_count(
        self, client, test_user, auth_headers, db_session
    ):
        item = ClothingItem(
            user_id=test_user.id,
            type="shirt",
            image_path=f"test/{uuid4()}.jpg",
            status=ItemStatus.ready,
            primary_color="blue",
        )
        outfit = Outfit(
            user_id=test_user.id,
            occasion="casual",
            status=OutfitStatus.pending,
            source=OutfitSource.on_demand,
        )
        outfit.feedback = None
        outfit.family_ratings = []
        outfit.items = [OutfitItem(item=item, position=0, layer_type=None)]

        db_session.add_all([item, outfit])
        await db_session.commit()

        with patch(
            "app.api.outfits.RecommendationService.generate_recommendation",
            new_callable=AsyncMock,
            return_value=outfit,
        ):
            response = await client.post(
                "/api/v1/outfits/suggest",
                json={
                    "occasion": "casual",
                    "weather_override": {
                        "temperature": 20,
                        "condition": "clear",
                    },
                },
                headers=auth_headers,
            )

        assert response.status_code == 200
        data = response.json()
        assert data["is_starter_suggestion"] is True


def _make_item(**kwargs) -> ClothingItem:
    defaults = {
        "id": uuid4(),
        "user_id": uuid4(),
        "type": "shirt",
        "image_path": "test.jpg",
        "primary_color": "blue",
        "colors": ["blue"],
        "formality": "casual",
        "season": [],
        "style": [],
        "last_worn_at": None,
    }
    defaults.update(kwargs)
    return ClothingItem(**defaults)


class TestMultiOutfitParse:
    def test_three_outfits(self):
        service = RecommendationService.__new__(RecommendationService)
        content = '{"outfits": [{"items": [1, 2]}, {"items": [3, 4]}, {"items": [5, 6]}]}'
        result = service._parse_multi_outfit_response(content)
        assert len(result) == 3
        assert result[0]["items"] == [1, 2]

    def test_single_fallback(self):
        service = RecommendationService.__new__(RecommendationService)
        content = '{"items": [1, 2], "headline": "Test"}'
        result = service._parse_multi_outfit_response(content)
        assert len(result) == 1
        assert result[0]["items"] == [1, 2]

    def test_array_format(self):
        service = RecommendationService.__new__(RecommendationService)
        content = '[{"items": [1, 2]}, {"items": [3, 4]}]'
        result = service._parse_multi_outfit_response(content)
        assert len(result) >= 1
        assert "items" in result[0]


class TestFutureDateRecommendation:
    @pytest.mark.asyncio
    async def test_uses_user_local_today_for_future_detection(self, db_session, monkeypatch):
        user = _make_user("Pacific/Kiritimati")
        user.location_lat = 1.23
        user.location_lon = 4.56

        item1 = _make_item(id=uuid4(), user_id=user.id, type="shirt")
        item2 = _make_item(id=uuid4(), user_id=user.id, type="pants")
        service = RecommendationService(db_session)

        current_weather = WeatherData(
            temperature=24,
            feels_like=25,
            humidity=60,
            precipitation_chance=10,
            precipitation_mm=0,
            wind_speed=8,
            condition="sunny",
            condition_code=0,
            is_day=True,
            uv_index=5,
            timestamp=datetime(2026, 4, 17, 8, 0, 0, tzinfo=UTC),
        )

        forecast_called = False

        async def fake_get_current_weather(lat, lon):
            return current_weather

        async def fake_get_daily_forecast(lat, lon, days):
            nonlocal forecast_called
            forecast_called = True
            return [
                DailyForecast(
                    date="2026-04-18",
                    temp_min=18,
                    temp_max=28,
                    precipitation_chance=20,
                    condition="cloudy",
                    condition_code=3,
                )
            ]

        monkeypatch.setattr(
            "app.services.recommendation_service.get_user_today",
            lambda current_user: date(2026, 4, 18),
        )

        class FakeDate(date):
            @classmethod
            def today(cls):
                return cls(2026, 4, 17)

        monkeypatch.setattr("app.services.recommendation_service.date", FakeDate)
        monkeypatch.setattr(service.weather_service, "get_current_weather", fake_get_current_weather)
        monkeypatch.setattr(service.weather_service, "get_daily_forecast", fake_get_daily_forecast)
        monkeypatch.setattr(service, "_get_today_rejected_item_ids", AsyncMock(return_value=[]))
        monkeypatch.setattr(service, "get_candidate_items", AsyncMock(return_value=[item1, item2]))
        monkeypatch.setattr("app.services.recommendation_service.pop_suggestion", AsyncMock(return_value=None))
        monkeypatch.setattr(service, "_get_recently_worn_dates", AsyncMock(return_value={}))
        monkeypatch.setattr(service, "_get_good_item_pairs", AsyncMock(return_value={}))
        monkeypatch.setattr(service, "_get_learned_preferences", AsyncMock(return_value={}))
        monkeypatch.setattr(
            service,
            "_get_recently_worn_outfit_combinations",
            AsyncMock(return_value=[]),
        )
        monkeypatch.setattr(
            "app.services.recommendation_service.score_items",
            lambda **kwargs: [ScoredItem(item=item1), ScoredItem(item=item2)],
        )

        class FakeAIService:
            def __init__(self, endpoints=None):
                self.endpoints = endpoints

            async def generate_text(self, prompt, return_metadata=True):
                return SimpleNamespace(
                    content='{"outfits": [{"items": [1, 2]}]}',
                    model="fake-model",
                    endpoint="fake-endpoint",
                )

        monkeypatch.setattr("app.services.recommendation_service.AIService", FakeAIService)

        async def fake_materialize(*args, **kwargs):
            return args[2]

        monkeypatch.setattr(service, "_materialize_outfit", fake_materialize)

        result = await service.generate_recommendation(
            user=user,
            occasion="casual",
            scheduled_date=date(2026, 4, 18),
        )

        assert forecast_called is False
        assert result is current_weather


class TestFormatItemsEnriched:
    def test_recency_annotation(self):
        service = RecommendationService.__new__(RecommendationService)
        item1 = _make_item(last_worn_at=date(2026, 3, 5))
        item2 = _make_item(last_worn_at=None)
        scored = [ScoredItem(item=item1), ScoredItem(item=item2)]
        today = date(2026, 3, 8)

        text, _ = service._format_items_for_prompt(scored, {}, today)
        assert "worn 3 days ago" in text
        assert "never worn" in text

    def test_pair_annotation(self):
        service = RecommendationService.__new__(RecommendationService)
        item1 = _make_item()
        item2 = _make_item()
        scored = [ScoredItem(item=item1), ScoredItem(item=item2)]
        pairs = {item1.id: [item2.id]}
        today = date(2026, 3, 8)

        text, _ = service._format_items_for_prompt(scored, pairs, today)
        assert "pairs well with:" in text


class TestFormatPrefsOccasion:
    def test_occasion_insights(self):
        service = RecommendationService.__new__(RecommendationService)
        learned = {
            "occasion_insights": {
                "work": {"preferred_colors": ["blue", "gray"], "success_rate": 0.3}
            }
        }
        text = service._format_preferences_for_prompt(None, learned, None, None, occasion="work")
        assert "For work, user prefers: blue, gray" in text
        assert "Low success rate" in text


class TestPromptPreRanking:
    def test_pre_ranking_hint_present(self):
        from app.services.recommendation_service import RECOMMENDATION_PROMPT

        assert "pre-ranked" in RECOMMENDATION_PROMPT
