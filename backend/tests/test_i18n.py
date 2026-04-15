"""Tests for API message localization."""

from unittest.mock import Mock

from app.utils.i18n import DEFAULT_LOCALE, resolve_locale, translate


def test_default_locale_is_chinese():
    assert DEFAULT_LOCALE == "zh"


def test_resolve_locale_from_accept_language():
    req = Mock()
    req.headers = {"accept-language": "en-US,en;q=0.9"}
    assert resolve_locale(req) == "en"

    req.headers = {"accept-language": "zh-CN,zh;q=0.9"}
    assert resolve_locale(req) == "zh"

    req.headers = {}
    assert resolve_locale(req) == "zh"


def test_translate_zh_and_en():
    assert "衣橱" in translate("zh", "error.insufficient_items_pairing")
    assert "Not enough items" in translate("en", "error.insufficient_items_pairing")


def test_analytics_insight_keys():
    assert "添加" in translate("zh", "analytics.insight.start_add_items")
    assert "wardrobe" in translate("en", "analytics.insight.start_add_items").lower()
