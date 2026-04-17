import logging

import httpx
import pytest

from app.services.ai_service import AIEndpointConfig, AIService, ClothingTags


class TestTagParsing:
    """Tests for AI response parsing."""

    def test_parse_valid_json(self):
        """Test parsing valid JSON response."""
        service = AIService()
        response = """
        {
            "type": "shirt",
            "primary_color": "blue",
            "colors": ["blue", "white"],
            "pattern": "striped",
            "material": "cotton",
            "formality": "casual",
            "confidence": 0.85
        }
        """
        tags = service._parse_tags_from_response(response)
        assert tags.type == "shirt"
        assert tags.primary_color == "blue"
        assert tags.colors == ["blue", "white"]
        assert tags.pattern == "striped"
        assert tags.material == "cotton"
        # Confidence is now computed by compute_tag_completeness (not AI self-reported)
        # type(0.25) + primary_color(0.20) + pattern(0.15) + formality(0.15) + material(0.10) + colors(0.05) = 0.90
        assert tags.confidence == 0.9

    def test_parse_json_in_markdown(self):
        """Test parsing JSON wrapped in markdown code block."""
        service = AIService()
        response = """
        Here's the analysis:
        ```json
        {
            "type": "pants",
            "primary_color": "black",
            "colors": ["black"],
            "material": "denim",
            "confidence": 0.9
        }
        ```
        """
        tags = service._parse_tags_from_response(response)
        assert tags.type == "pants"
        assert tags.primary_color == "black"
        assert tags.material == "denim"

    def test_parse_invalid_type(self):
        """Test that invalid type returns unknown."""
        service = AIService()
        response = """
        {
            "type": "invalid_type_xyz",
            "primary_color": "blue"
        }
        """
        tags = service._parse_tags_from_response(response)
        assert tags.type == "unknown"

    def test_parse_invalid_color(self):
        """Test that invalid colors are filtered out."""
        service = AIService()
        response = """
        {
            "type": "shirt",
            "primary_color": "chartreuse",
            "colors": ["blue", "invalid_color", "black"]
        }
        """
        tags = service._parse_tags_from_response(response)
        # Invalid colors should be removed
        assert tags.primary_color is None
        assert "blue" in tags.colors
        assert "black" in tags.colors
        assert "invalid_color" not in tags.colors

    def test_parse_grey_to_gray(self):
        """Test that 'grey' is normalized to 'gray'."""
        service = AIService()
        response = """
        {
            "type": "shirt",
            "primary_color": "grey"
        }
        """
        tags = service._parse_tags_from_response(response)
        assert tags.primary_color == "gray"

    def test_parse_invalid_json(self):
        """Test parsing completely invalid response."""
        service = AIService()
        response = "This is not JSON at all, just some random text."
        tags = service._parse_tags_from_response(response)
        assert tags.type == "unknown"
        assert tags.raw_response == response

    def test_parse_confidence_computed_from_completeness(self):
        """Test that confidence is computed from tag completeness, not AI self-reported value."""
        service = AIService()
        response = """
        {
            "type": "shirt",
            "confidence": 1.5
        }
        """
        tags = service._parse_tags_from_response(response)
        # Confidence is now computed by compute_tag_completeness: type only = 0.25
        assert tags.confidence == 0.25

    def test_parse_valid_formality(self):
        """Test parsing formality levels."""
        service = AIService()
        response = """
        {
            "type": "blazer",
            "formality": "business-casual"
        }
        """
        tags = service._parse_tags_from_response(response)
        assert tags.formality == "business-casual"

    def test_parse_invalid_formality(self):
        """Test that invalid formality is None."""
        service = AIService()
        response = """
        {
            "type": "shirt",
            "formality": "ultra-super-formal"
        }
        """
        tags = service._parse_tags_from_response(response)
        assert tags.formality is None


class TestClothingTags:
    """Tests for ClothingTags model."""

    def test_default_values(self):
        """Test default values for ClothingTags."""
        tags = ClothingTags()
        assert tags.type == "unknown"
        assert tags.colors == []
        assert tags.style == []
        assert tags.confidence == 0.0

    def test_full_construction(self):
        """Test constructing ClothingTags with all fields."""
        tags = ClothingTags(
            type="jacket",
            subtype="blazer",
            primary_color="navy",
            colors=["navy", "white"],
            pattern="solid",
            material="wool",
            style=["formal", "classic"],
            formality="formal",
            season=["fall", "winter"],
            confidence=0.92,
            description="A classic navy blazer",
        )
        assert tags.type == "jacket"
        assert tags.subtype == "blazer"
        assert tags.primary_color == "navy"
        assert len(tags.colors) == 2
        assert tags.confidence == 0.92


@pytest.mark.asyncio
async def test_call_with_fallback_logs_endpoint_context_on_transport_error(monkeypatch, caplog):
    service = AIService()
    service._endpoints = [
        AIEndpointConfig(
            url="http://ai.internal:11434/v1",
            vision_model="llava:7b",
            text_model="gemma3:latest",
            name="primary",
        )
    ]
    service.settings.ai_max_retries = 2
    service.timeout = 5

    class FailingAsyncClient:
        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc, tb):
            return False

        async def post(self, url, headers, json):
            request = httpx.Request("POST", url)
            raise httpx.ConnectError("All connection attempts failed", request=request)

    monkeypatch.setattr(httpx, "AsyncClient", lambda *args, **kwargs: FailingAsyncClient())

    with caplog.at_level(logging.INFO, logger="app.services.ai_service"):
        content, error, logprobs = await service._call_with_fallback(
            messages=[{"role": "user", "content": "hello"}],
            task_name="tags",
            request_logprobs=True,
        )

    assert content is None
    assert logprobs is None
    assert isinstance(error, httpx.ConnectError)
    assert "AI request start task=tags endpoint=primary url=http://ai.internal:11434/v1" in caplog.text
    assert "model=llava:7b attempt=1/2 logprobs=True" in caplog.text
    assert "AI request transport error task=tags endpoint=primary url=http://ai.internal:11434/v1" in caplog.text
    assert "attempt=2/2" in caplog.text
    assert "AI request exhausted endpoints task=tags endpoint_count=1 last_error_type=ConnectError" in caplog.text


@pytest.mark.asyncio
async def test_call_with_fallback_retries_without_logprobs_when_provider_rejects_them(
    monkeypatch, caplog
):
    service = AIService()
    service._endpoints = [
        AIEndpointConfig(
            url="https://api.example.com/v1",
            vision_model="gpt-5.2",
            text_model="gpt-5.2",
            name="primary",
        )
    ]
    service.settings.ai_max_retries = 1
    service.timeout = 5
    posted_bodies = []

    class FallbackAsyncClient:
        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc, tb):
            return False

        async def post(self, url, headers, json):
            posted_bodies.append(dict(json))
            request = httpx.Request("POST", url)
            if len(posted_bodies) == 1:
                return httpx.Response(
                    400,
                    json={
                        "error": {
                            "message": "The 'top_logprobs' parameter is only allowed when 'logprobs' is enabled."
                        }
                    },
                    request=request,
                )

            return httpx.Response(
                200,
                json={
                    "model": "gpt-5.2",
                    "choices": [{"message": {"content": '{"type":"shirt","primary_color":"blue"}'}}],
                },
                request=request,
            )

    monkeypatch.setattr(httpx, "AsyncClient", lambda *args, **kwargs: FallbackAsyncClient())

    with caplog.at_level(logging.INFO, logger="app.services.ai_service"):
        content, error, logprobs = await service._call_with_fallback(
            messages=[{"role": "user", "content": "hello"}],
            task_name="tags",
            request_logprobs=True,
        )

    assert content == '{"type":"shirt","primary_color":"blue"}'
    assert error is None
    assert logprobs is None
    assert len(posted_bodies) == 2
    assert posted_bodies[0]["logprobs"] is True
    assert posted_bodies[0]["top_logprobs"] == 3
    assert "logprobs" not in posted_bodies[1]
    assert "top_logprobs" not in posted_bodies[1]
    assert "AI request retrying without logprobs task=tags endpoint=primary" in caplog.text
