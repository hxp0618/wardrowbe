import base64
import io
import json
import logging
import math
import re
from pathlib import Path
from urllib.parse import urlsplit, urlunsplit

import httpx
from PIL import Image, ImageOps
from pydantic import BaseModel, Field

from app.config import get_settings
from app.utils.prompts import load_prompt

logger = logging.getLogger(__name__)


def _safe_endpoint_url(url: str) -> str:
    """Strip credentials from endpoint URLs before logging."""
    if not url:
        return "<unset>"

    parts = urlsplit(url)
    hostname = parts.hostname or ""
    if parts.port:
        hostname = f"{hostname}:{parts.port}"

    return urlunsplit((parts.scheme, hostname, parts.path, parts.query, parts.fragment))


def _supports_logprobs_error(response_text: str) -> bool:
    normalized = response_text.lower()
    return "top_logprobs" in normalized or "logprobs" in normalized


class TextGenerationResult(BaseModel):
    content: str
    model: str
    endpoint: str


class ClothingTags(BaseModel):
    type: str = "unknown"
    subtype: str | None = None
    primary_color: str | None = None
    colors: list[str] = []
    pattern: str | None = None
    material: str | None = None
    style: list[str] = []
    formality: str | None = None
    season: list[str] = []
    fit: str | None = None
    occasion: list[str] = []
    brand: str | None = None
    condition: str | None = None
    features: list[str] = []
    confidence: float = 0.0
    logprobs_confidence: float | None = None
    description: str | None = None
    localized_tags: dict[str, object] = Field(default_factory=dict)
    raw_response: str | None = None


TAGGING_PROMPT = load_prompt("clothing_analysis")
DESCRIPTION_PROMPT = load_prompt("clothing_description")

# Valid values for validation
VALID_TYPES = {
    "shirt",
    "t-shirt",
    "pants",
    "jeans",
    "shorts",
    "dress",
    "skirt",
    "jacket",
    "coat",
    "sweater",
    "hoodie",
    "blazer",
    "vest",
    "cardigan",
    "polo",
    "blouse",
    "tank-top",
    "shoes",
    "sneakers",
    "boots",
    "sandals",
    "hat",
    "scarf",
    "belt",
    "bag",
    "accessories",
    "top",
    "jumpsuit",
    "socks",
    "tie",
}
VALID_COLORS = {
    "black",
    "white",
    "gray",
    "navy",
    "blue",
    "light-blue",
    "red",
    "burgundy",
    "pink",
    "green",
    "olive",
    "yellow",
    "orange",
    "purple",
    "brown",
    "tan",
    "beige",
    "cream",
    "gold",
    "silver",
}
VALID_PATTERNS = {
    "solid",
    "striped",
    "plaid",
    "checkered",
    "floral",
    "graphic",
    "geometric",
    "polka-dot",
    "camouflage",
    "animal-print",
}
VALID_MATERIALS = {
    "cotton",
    "denim",
    "leather",
    "wool",
    "polyester",
    "silk",
    "linen",
    "knit",
    "fleece",
    "suede",
    "velvet",
    "nylon",
    "canvas",
}
VALID_FORMALITY = {"very-casual", "casual", "smart-casual", "business-casual", "formal"}
VALID_FIT = {"slim", "regular", "relaxed", "oversized", "tailored", "cropped"}
VALID_STYLES = {
    "casual",
    "classic",
    "sporty",
    "minimalist",
    "bohemian",
    "preppy",
    "streetwear",
    "elegant",
    "athletic",
    "vintage",
    "modern",
    "rugged",
}
VALID_SEASONS = {"spring", "summer", "fall", "winter", "all-season"}

LOCALIZED_TYPE_MAP = {
    "衬衫": "shirt",
    "t恤": "t-shirt",
    "上衣": "top",
    "长裤": "pants",
    "牛仔裤": "jeans",
    "短裤": "shorts",
    "连衣裙": "dress",
    "连体裤": "jumpsuit",
    "半身裙": "skirt",
    "夹克": "jacket",
    "大衣": "coat",
    "毛衣": "sweater",
    "连帽衫": "hoodie",
    "西装外套": "blazer",
    "马甲": "vest",
    "开衫": "cardigan",
    "polo衫": "polo",
    "女式衬衫": "blouse",
    "背心": "tank-top",
    "鞋子": "shoes",
    "运动鞋": "sneakers",
    "靴子": "boots",
    "凉鞋": "sandals",
    "袜子": "socks",
    "领带": "tie",
    "帽子": "hat",
    "围巾": "scarf",
    "腰带": "belt",
    "包": "bag",
    "配饰": "accessories",
}

LOCALIZED_COLOR_MAP = {
    "黑色": "black",
    "白色": "white",
    "灰色": "gray",
    "藏青": "navy",
    "蓝色": "blue",
    "浅蓝": "light-blue",
    "红色": "red",
    "酒红": "burgundy",
    "粉色": "pink",
    "绿色": "green",
    "橄榄绿": "olive",
    "黄色": "yellow",
    "橙色": "orange",
    "紫色": "purple",
    "棕色": "brown",
    "棕褐": "tan",
    "米色": "beige",
    "奶油色": "cream",
    "金色": "gold",
    "银色": "silver",
}

LOCALIZED_PATTERN_MAP = {
    "纯色": "solid",
    "条纹": "striped",
    "格纹": "plaid",
    "棋盘格": "checkered",
    "花卉": "floral",
    "图案": "graphic",
    "几何": "geometric",
    "波点": "polka-dot",
    "迷彩": "camouflage",
    "动物纹": "animal-print",
}

LOCALIZED_MATERIAL_MAP = {
    "棉": "cotton",
    "牛仔布": "denim",
    "皮革": "leather",
    "羊毛": "wool",
    "涤纶": "polyester",
    "丝绸": "silk",
    "亚麻": "linen",
    "针织": "knit",
    "抓绒": "fleece",
    "麂皮": "suede",
    "天鹅绒": "velvet",
    "尼龙": "nylon",
    "帆布": "canvas",
}

LOCALIZED_FORMALITY_MAP = {
    "很休闲": "very-casual",
    "休闲": "casual",
    "轻商务": "smart-casual",
    "商务休闲": "business-casual",
    "正式": "formal",
}

LOCALIZED_STYLE_MAP = {
    "休闲": "casual",
    "经典": "classic",
    "运动": "sporty",
    "极简": "minimalist",
    "波西米亚": "bohemian",
    "学院": "preppy",
    "街头": "streetwear",
    "优雅": "elegant",
    "机能": "athletic",
    "复古": "vintage",
    "现代": "modern",
    "硬朗": "rugged",
}

LOCALIZED_SEASON_MAP = {
    "春季": "spring",
    "夏季": "summer",
    "秋季": "fall",
    "冬季": "winter",
    "四季": "all-season",
}

LOCALIZED_FIT_MAP = {
    "修身": "slim",
    "合身": "regular",
    "宽松": "relaxed",
    "廓形": "oversized",
    "利落": "tailored",
    "短款": "cropped",
}

LOCALIZED_SUBTYPE_MAP = {
    "henley": "亨利领",
    "button-down": "扣领衬衫",
    "oxford": "牛津纺",
    "flannel": "法兰绒",
    "hawaiian": "夏威夷衬衫",
    "camp-collar": "古巴领",
    "track-jacket": "运动夹克",
    "denim-jacket": "牛仔夹克",
    "bomber": "飞行员夹克",
    "parka": "派克大衣",
    "windbreaker": "防风夹克",
    "trucker": "工装夹克",
    "anorak": "套头防风外套",
    "chinos": "斜纹裤",
    "joggers": "束脚裤",
    "cargo": "工装裤",
    "trousers": "西裤",
    "leggings": "紧身裤",
    "sweatpants": "卫裤",
    "sundress": "夏日连衣裙",
    "slip-dress": "吊带裙",
    "maxi": "长款",
    "midi": "中长款",
    "wrap": "裹身式",
    "shirt-dress": "衬衫裙",
    "a-line": "A字款",
    "loafers": "乐福鞋",
    "oxfords": "牛津鞋",
    "mules": "穆勒鞋",
    "flats": "平底鞋",
    "heels": "高跟鞋",
    "platforms": "厚底鞋",
    "low-top": "低帮",
    "high-top": "高帮",
    "chunky": "厚底",
    "slip-on": "一脚蹬",
    "ankle": "短款",
    "chelsea": "切尔西靴",
    "combat": "工装靴",
    "knee-high": "高筒",
    "rain": "雨靴",
    "mini": "短款",
    "pleated": "百褶",
    "pencil": "铅笔裙",
    "pullover": "套头",
    "crewneck": "圆领",
    "turtleneck": "高领",
    "v-neck": "V领",
    "necktie": "领带",
    "bow-tie": "领结",
    "bolo": "波洛领带",
}
CANONICAL_SUBTYPE_MAP = {localized: canonical for canonical, localized in LOCALIZED_SUBTYPE_MAP.items()}


def compute_tag_completeness(tags: "ClothingTags") -> float:
    score = 0.0
    if tags.type and tags.type != "unknown":
        score += 0.25
    if tags.primary_color:
        score += 0.20
    if tags.pattern:
        score += 0.15
    if tags.formality:
        score += 0.15
    if tags.material:
        score += 0.10
    if tags.season:
        score += 0.05
    if tags.style:
        score += 0.05
    if tags.colors:
        score += 0.05
    return round(score, 2)


def _clean_string(value: object) -> str | None:
    if not isinstance(value, str):
        return None
    cleaned = value.strip()
    return cleaned or None


def _clean_string_list(value: object) -> list[str]:
    if not isinstance(value, list):
        return []
    cleaned: list[str] = []
    for entry in value:
        item = _clean_string(entry)
        if item:
            cleaned.append(item)
    return cleaned


def _dedupe_list(values: list[str]) -> list[str]:
    seen: set[str] = set()
    deduped: list[str] = []
    for value in values:
        if value in seen:
            continue
        seen.add(value)
        deduped.append(value)
    return deduped


def _localize_subtype(value: str | None) -> str | None:
    cleaned = _clean_string(value)
    if not cleaned:
        return None
    if re.search(r"[\u4e00-\u9fff]", cleaned):
        return cleaned
    normalized = re.sub(r"[\s_]+", "-", cleaned.lower())
    return LOCALIZED_SUBTYPE_MAP.get(normalized, cleaned)


def _canonicalize_subtype(value: str | None) -> str | None:
    cleaned = _clean_string(value)
    if not cleaned:
        return None
    if re.search(r"[\u4e00-\u9fff]", cleaned):
        return CANONICAL_SUBTYPE_MAP.get(cleaned, cleaned)
    return re.sub(r"[\s_]+", "-", cleaned.lower())


_CONFIDENCE_FIELDS = {"type", "primary_color", "pattern", "material", "formality"}


def compute_confidence_from_logprobs(logprobs_content: list[dict] | None) -> float | None:
    if not logprobs_content:
        return None

    field_probs: dict[str, list[float]] = {}
    current_key = None
    expect_value = False

    for entry in logprobs_content:
        token = entry.get("token", "")
        logprob = entry.get("logprob", 0)
        prob = math.exp(logprob)
        stripped = token.strip().strip('"').strip("'")

        if stripped in _CONFIDENCE_FIELDS:
            current_key = stripped
            expect_value = False
            continue

        if current_key and ":" in token:
            expect_value = True
            continue

        if expect_value and current_key and stripped and stripped not in ("{", "[", ",", "}", "]"):
            if stripped == "null":
                current_key = None
                expect_value = False
                continue
            if current_key not in field_probs:
                field_probs[current_key] = []
            field_probs[current_key].append(prob)
            current_key = None
            expect_value = False

    if not field_probs:
        return None

    weights = {
        "type": 0.30,
        "primary_color": 0.25,
        "pattern": 0.15,
        "material": 0.15,
        "formality": 0.15,
    }
    total_weight = 0.0
    weighted_sum = 0.0

    for field, probs in field_probs.items():
        w = weights.get(field, 0.1)
        weighted_sum += w * min(probs)
        total_weight += w

    if total_weight == 0:
        return None

    return round(weighted_sum / total_weight, 2)


class AIEndpointConfig:
    """Configuration for an AI endpoint."""

    def __init__(
        self,
        url: str,
        vision_model: str = "moondream",
        text_model: str = "phi3:mini",
        name: str = "default",
        enabled: bool = True,
    ):
        self.url = url
        self.vision_model = vision_model
        self.text_model = text_model
        self.name = name
        self.enabled = enabled


class AIService:
    """Service for AI-powered image analysis and text generation."""

    def __init__(self, endpoints: list[dict] | None = None):
        """
        Initialize AI service with optional custom endpoints.

        Args:
            endpoints: List of endpoint configs from user preferences.
                      If None or empty, uses default from settings.
        """
        self.settings = get_settings()
        self.timeout = self.settings.ai_timeout
        self.api_key = self.settings.ai_api_key

        # Build endpoint list
        self._endpoints: list[AIEndpointConfig] = []

        if endpoints:
            for ep in endpoints:
                if ep.get("enabled", True):
                    self._endpoints.append(
                        AIEndpointConfig(
                            url=ep["url"],
                            vision_model=ep.get("vision_model", "moondream"),
                            text_model=ep.get("text_model", "phi3:mini"),
                            name=ep.get("name", "custom"),
                            enabled=True,
                        )
                    )

        # Always add default endpoint as fallback (even if user has custom endpoints)
        # This ensures we can fall back to in-house Ollama if user endpoints are unreachable
        self._endpoints.append(
            AIEndpointConfig(
                url=self.settings.ai_base_url,
                vision_model=self.settings.ai_vision_model,
                text_model=self.settings.ai_text_model,
                name="default",
            )
        )

        # Legacy properties for backwards compatibility
        self.base_url = self._endpoints[0].url
        self.vision_model = self._endpoints[0].vision_model
        self.text_model = self._endpoints[0].text_model

        logger.info(
            "AI service configured endpoints=%s timeout=%ss max_retries=%s",
            [
                {
                    "name": endpoint.name,
                    "url": _safe_endpoint_url(endpoint.url),
                    "vision_model": endpoint.vision_model,
                    "text_model": endpoint.text_model,
                }
                for endpoint in self._endpoints
            ],
            self.timeout,
            self.settings.ai_max_retries,
        )

    def _get_headers(self) -> dict:
        """Get headers for AI API requests, including auth if configured."""
        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        return headers

    def _preprocess_image(self, image_path: str | Path) -> str:
        """
        Preprocess image for AI analysis.
        Returns base64-encoded JPEG string.
        """
        with Image.open(image_path) as img:
            # Convert to RGB if necessary
            if img.mode != "RGB":
                img = img.convert("RGB")

            # Auto-orient based on EXIF
            img = ImageOps.exif_transpose(img)

            # Resize to max 512x512 for faster AI processing
            max_size = 512
            img.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)

            # Convert to JPEG bytes
            buffer = io.BytesIO()
            img.save(buffer, format="JPEG", quality=85)
            buffer.seek(0)

            return base64.b64encode(buffer.read()).decode("utf-8")

    def _parse_tags_from_response(self, response_text: str) -> ClothingTags:
        def extract_json(text: str) -> dict | None:
            try:
                return json.loads(text.strip())
            except json.JSONDecodeError:
                pass

            json_match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
            if json_match:
                try:
                    return json.loads(json_match.group(1))
                except json.JSONDecodeError:
                    pass

            start_idx = text.find("{")
            if start_idx != -1:
                brace_count = 0
                for i, char in enumerate(text[start_idx:], start_idx):
                    if char == "{":
                        brace_count += 1
                    elif char == "}":
                        brace_count -= 1
                        if brace_count == 0:
                            json_str = text[start_idx : i + 1]
                            try:
                                return json.loads(json_str)
                            except json.JSONDecodeError:
                                break
            return None

        COLOR_ALIASES: dict[str, str] = {
            "grey": "gray",
            "light grey": "gray",
            "light gray": "gray",
            "dark grey": "gray",
            "dark gray": "gray",
            "off-white": "cream",
            "ivory": "cream",
            "wine": "burgundy",
            "maroon": "burgundy",
            "forest green": "green",
            "dark blue": "navy",
            "royal blue": "blue",
            "sky blue": "light-blue",
            "baby blue": "light-blue",
            "camel": "tan",
            "khaki": "tan",
            "rust": "orange",
            "coral": "pink",
            "rose": "pink",
            "mauve": "purple",
            "lavender": "purple",
            "mustard": "yellow",
            "gold": "yellow",
            "silver": "gray",
            "charcoal": "gray",
        }

        def validate_value(
            value: str | None,
            valid_set: set[str],
            localized_map: dict[str, str] | None = None,
        ) -> str | None:
            if value is None:
                return None
            value_clean = value.strip()
            value_lower = value_clean.lower()
            if value_lower in valid_set:
                return value_lower
            if localized_map and value_clean in localized_map:
                return localized_map[value_clean]
            alias = COLOR_ALIASES.get(value_lower)
            if alias and alias in valid_set:
                return alias
            return None

        def validate_list(
            values: list,
            valid_set: set[str],
            localized_map: dict[str, str] | None = None,
        ) -> list[str]:
            if not values:
                return []
            normalized: list[str] = []
            for value in values:
                cleaned = _clean_string(value)
                if not cleaned:
                    continue
                candidate = validate_value(cleaned, valid_set, localized_map=localized_map)
                if candidate:
                    normalized.append(candidate)
            return _dedupe_list(normalized)

        data = extract_json(response_text)
        if not data:
            logger.warning(f"Could not parse JSON from AI response: {response_text[:200]}")
            return ClothingTags(raw_response=response_text)

        if isinstance(data, list):
            data = data[0] if data and isinstance(data[0], dict) else {}

        tags = ClothingTags()
        tags.raw_response = response_text
        localized_subtype = _localize_subtype(data.get("subtype"))
        canonical_subtype = _canonicalize_subtype(data.get("subtype"))
        tags.localized_tags = {
            "subtype": localized_subtype,
            "primary_color": _clean_string(data.get("primary_color")),
            "colors": _clean_string_list(data.get("colors", [])),
            "pattern": _clean_string(data.get("pattern")),
            "material": _clean_string(data.get("material")),
            "style": _clean_string_list(data.get("style", [])),
            "season": _clean_string_list(data.get("season", [])),
            "formality": _clean_string(data.get("formality")),
            "fit": _clean_string(data.get("fit")),
            "occasion": _clean_string_list(data.get("occasion", [])),
            "brand": _clean_string(data.get("brand")),
            "condition": _clean_string(data.get("condition")),
            "features": _clean_string_list(data.get("features", [])),
        }
        tags.localized_tags = {
            key: value
            for key, value in tags.localized_tags.items()
            if value not in (None, [], "")
        }

        item_type = validate_value(data.get("type"), VALID_TYPES, localized_map=LOCALIZED_TYPE_MAP)
        if item_type:
            tags.type = item_type
        else:
            tags.type = "unknown"

        tags.subtype = canonical_subtype
        tags.primary_color = validate_value(
            data.get("primary_color"), VALID_COLORS, localized_map=LOCALIZED_COLOR_MAP
        )
        tags.colors = validate_list(
            data.get("colors", []), VALID_COLORS, localized_map=LOCALIZED_COLOR_MAP
        )
        tags.pattern = validate_value(
            data.get("pattern"), VALID_PATTERNS, localized_map=LOCALIZED_PATTERN_MAP
        )
        tags.material = validate_value(
            data.get("material"), VALID_MATERIALS, localized_map=LOCALIZED_MATERIAL_MAP
        )
        tags.formality = validate_value(
            data.get("formality"), VALID_FORMALITY, localized_map=LOCALIZED_FORMALITY_MAP
        )
        tags.style = validate_list(
            data.get("style", []), VALID_STYLES, localized_map=LOCALIZED_STYLE_MAP
        )
        tags.season = validate_list(
            data.get("season", []), VALID_SEASONS, localized_map=LOCALIZED_SEASON_MAP
        )
        tags.fit = validate_value(data.get("fit"), VALID_FIT, localized_map=LOCALIZED_FIT_MAP)
        tags.confidence = compute_tag_completeness(tags)

        logger.info(
            f"Parsed tags: type={tags.type}, color={tags.primary_color}, pattern={tags.pattern}"
        )
        return tags

    async def _call_with_fallback(
        self,
        messages: list,
        task_name: str,
        use_vision_model: bool = True,
        request_logprobs: bool = False,
    ) -> tuple[str | None, Exception | None, list | None]:
        last_error = None
        max_retries = self.settings.ai_max_retries

        for endpoint in self._endpoints:
            model = endpoint.vision_model if use_vision_model else endpoint.text_model
            endpoint_url = _safe_endpoint_url(endpoint.url)

            async with httpx.AsyncClient(timeout=self.timeout, follow_redirects=True) as client:
                for attempt in range(max_retries):
                    attempt_number = attempt + 1
                    include_logprobs = request_logprobs
                    try:
                        logger.info(
                            "AI request start task=%s endpoint=%s url=%s model=%s attempt=%s/%s logprobs=%s",
                            task_name,
                            endpoint.name,
                            endpoint_url,
                            model,
                            attempt_number,
                            max_retries,
                            include_logprobs,
                        )
                        request_body = {
                            "model": model,
                            "messages": messages,
                            "stream": False,
                            "max_tokens": self.settings.ai_max_tokens,
                        }
                        if include_logprobs:
                            request_body["logprobs"] = True
                            request_body["top_logprobs"] = 3

                        try:
                            response = await client.post(
                                f"{endpoint.url}/chat/completions",
                                headers=self._get_headers(),
                                json=request_body,
                            )
                            response.raise_for_status()
                        except httpx.HTTPStatusError as e:
                            response_text = e.response.text[:300] if e.response is not None else ""
                            if (
                                include_logprobs
                                and e.response is not None
                                and e.response.status_code == 400
                                and _supports_logprobs_error(response_text)
                            ):
                                logger.warning(
                                    "AI request retrying without logprobs task=%s endpoint=%s url=%s model=%s attempt=%s/%s response_preview=%s",
                                    task_name,
                                    endpoint.name,
                                    endpoint_url,
                                    model,
                                    attempt_number,
                                    max_retries,
                                    response_text,
                                )
                                include_logprobs = False
                                request_body.pop("logprobs", None)
                                request_body.pop("top_logprobs", None)
                                response = await client.post(
                                    f"{endpoint.url}/chat/completions",
                                    headers=self._get_headers(),
                                    json=request_body,
                                )
                                response.raise_for_status()
                            else:
                                raise

                        data = response.json()
                        choice = data["choices"][0]
                        content = choice["message"]["content"]
                        logprobs_content = None
                        if include_logprobs:
                            lp = choice.get("logprobs")
                            if lp:
                                logprobs_content = lp.get("content")

                        used_model = data.get("model", model)
                        logger.info(
                            "AI request success task=%s endpoint=%s url=%s model=%s used_model=%s attempt=%s/%s",
                            task_name,
                            endpoint.name,
                            endpoint_url,
                            model,
                            used_model,
                            attempt_number,
                            max_retries,
                        )
                        return content, None, logprobs_content

                    except httpx.HTTPStatusError as e:
                        last_error = e
                        response_text = e.response.text[:300] if e.response is not None else ""
                        logger.warning(
                            "AI request HTTP error task=%s endpoint=%s url=%s model=%s attempt=%s/%s status=%s error=%s response_preview=%s",
                            task_name,
                            endpoint.name,
                            endpoint_url,
                            model,
                            attempt_number,
                            max_retries,
                            e.response.status_code if e.response is not None else "unknown",
                            str(e),
                            response_text,
                        )
                        if attempt < max_retries - 1:
                            continue
                    except httpx.RequestError as e:
                        last_error = e
                        logger.warning(
                            "AI request transport error task=%s endpoint=%s url=%s model=%s attempt=%s/%s error_type=%s error=%s",
                            task_name,
                            endpoint.name,
                            endpoint_url,
                            model,
                            attempt_number,
                            max_retries,
                            type(e).__name__,
                            str(e),
                        )
                        if attempt < max_retries - 1:
                            continue

        if last_error is not None:
            logger.error(
                "AI request exhausted endpoints task=%s endpoint_count=%s last_error_type=%s last_error=%s",
                task_name,
                len(self._endpoints),
                type(last_error).__name__,
                str(last_error),
            )
        return None, last_error, None

    async def analyze_image(self, image_path: str | Path) -> ClothingTags:
        return await self.analyze_images([image_path])

    async def analyze_images(self, image_paths: list[str | Path]) -> ClothingTags:
        """
        Analyze one or more images that represent the SAME clothing item
        (e.g. front/back/tag shots) and produce a single set of tags.

        Images are preprocessed once each; the vision model receives them all
        in a single multi-image message so it can reason about them together.
        """
        if not image_paths:
            raise ValueError("analyze_images requires at least one image path")

        logger.info(
            "Starting AI image analysis image_count=%s endpoint_count=%s",
            len(image_paths),
            len(self._endpoints),
        )

        image_contents: list[dict] = []
        for p in image_paths:
            try:
                b64 = self._preprocess_image(p)
                image_contents.append(
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:image/jpeg;base64,{b64}"},
                    }
                )
            except Exception as e:
                logger.warning("Failed to preprocess image %s: %s", p, e)

        if not image_contents:
            raise ValueError("No valid images could be preprocessed for AI analysis")

        # System/user separation for injection protection.
        # When multiple images are provided we hint the model to treat them as the same item.
        user_prefix: list[dict] = []
        if len(image_contents) > 1:
            user_prefix.append(
                {
                    "type": "text",
                    "text": (
                        f"The following {len(image_contents)} images are DIFFERENT views of the "
                        "SAME clothing item (e.g. front, back, label). Produce ONE unified set of "
                        "tags that best describes the item across all views."
                    ),
                }
            )

        messages_tags = [
            {"role": "system", "content": TAGGING_PROMPT},
            {"role": "user", "content": user_prefix + image_contents},
        ]

        messages_desc = [
            {"role": "system", "content": DESCRIPTION_PROMPT},
            {"role": "user", "content": user_prefix + image_contents},
        ]

        tags = ClothingTags()
        last_error = None

        # First pass: structured tags with logprobs for real confidence
        content, err, logprobs_content = await self._call_with_fallback(
            messages_tags, "tags", request_logprobs=True
        )
        if content:
            tags = self._parse_tags_from_response(content)
            logprobs_confidence = compute_confidence_from_logprobs(logprobs_content)
            if logprobs_confidence is not None:
                tags.logprobs_confidence = logprobs_confidence
        if err:
            last_error = err
            logger.warning(
                "AI tags pass failed image_count=%s error_type=%s error=%s",
                len(image_paths),
                type(err).__name__,
                str(err),
            )

        # Second pass: human-readable description
        content, err, _ = await self._call_with_fallback(messages_desc, "description")
        if content:
            description = content.strip()
            if description.startswith('"') and description.endswith('"'):
                description = description[1:-1]
            tags.description = description
        elif err:
            logger.warning(
                "AI description pass failed image_count=%s error_type=%s error=%s",
                len(image_paths),
                type(err).__name__,
                str(err),
            )

        if tags.type == "unknown" and not tags.description and last_error:
            logger.error(
                "AI image analysis failed image_count=%s last_error_type=%s last_error=%s",
                len(image_paths),
                type(last_error).__name__,
                str(last_error),
            )
            raise last_error

        return tags

    async def check_health(self) -> dict:
        """Check health of all configured AI endpoints."""
        endpoints_health = []

        for endpoint in self._endpoints:
            try:
                async with httpx.AsyncClient(timeout=5, follow_redirects=True) as client:
                    # Try OpenAI-compatible /v1/models endpoint first
                    response = await client.get(
                        f"{endpoint.url}/models", headers=self._get_headers()
                    )
                    if response.status_code == 200:
                        data = response.json()
                        # OpenAI format: {"data": [{"id": "model-name", ...}]}
                        models = data.get("data", [])
                        model_names = [m.get("id", "") for m in models]
                        endpoints_health.append(
                            {
                                "name": endpoint.name,
                                "url": endpoint.url,
                                "status": "healthy",
                                "vision_model": endpoint.vision_model,
                                "text_model": endpoint.text_model,
                                "available_models": model_names,
                            }
                        )
                        continue

                    # Fallback: Try Ollama-specific endpoint
                    response = await client.get(endpoint.url.replace("/v1", "/api/tags"))
                    if response.status_code == 200:
                        models = response.json().get("models", [])
                        model_names = [m.get("name", "") for m in models]
                        endpoints_health.append(
                            {
                                "name": endpoint.name,
                                "url": endpoint.url,
                                "status": "healthy",
                                "vision_model": endpoint.vision_model,
                                "text_model": endpoint.text_model,
                                "available_models": model_names,
                            }
                        )
                    else:
                        endpoints_health.append(
                            {
                                "name": endpoint.name,
                                "url": endpoint.url,
                                "status": "unhealthy",
                                "error": f"HTTP {response.status_code}",
                            }
                        )
            except Exception as e:
                endpoints_health.append(
                    {
                        "name": endpoint.name,
                        "url": endpoint.url,
                        "status": "unhealthy",
                        "error": str(e),
                    }
                )

        # Overall status is healthy if at least one endpoint is healthy
        any_healthy = any(ep["status"] == "healthy" for ep in endpoints_health)
        return {
            "status": "healthy" if any_healthy else "unhealthy",
            "endpoints": endpoints_health,
        }

    async def generate_text(
        self,
        prompt: str,
        system_prompt: str | None = None,
        return_metadata: bool = False,
    ) -> str | TextGenerationResult:
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        last_error = None

        for endpoint in self._endpoints:
            logger.info(f"Trying text generation via {endpoint.name}")

            async with httpx.AsyncClient(timeout=self.timeout, follow_redirects=True) as client:
                for attempt in range(self.settings.ai_max_retries):
                    try:
                        response = await client.post(
                            f"{endpoint.url}/chat/completions",
                            headers=self._get_headers(),
                            json={
                                "model": endpoint.text_model,
                                "messages": messages,
                                "stream": False,
                                "temperature": 0.4,
                                "max_tokens": self.settings.ai_max_tokens,
                            },
                        )
                        response.raise_for_status()

                        data = response.json()
                        used_model = data.get("model", endpoint.text_model)
                        content = data["choices"][0]["message"]["content"]
                        logger.info(
                            f"Text generation successful via {endpoint.name} (model: {used_model})"
                        )

                        if return_metadata:
                            return TextGenerationResult(
                                content=content,
                                model=used_model,
                                endpoint=endpoint.name,
                            )
                        return content

                    except httpx.HTTPStatusError as e:
                        last_error = e
                        logger.warning(f"HTTP error from {endpoint.name}: {e}")
                        if attempt < self.settings.ai_max_retries - 1:
                            continue
                    except httpx.RequestError as e:
                        last_error = e
                        logger.warning(f"Request error from {endpoint.name}: {e}")
                        if attempt < self.settings.ai_max_retries - 1:
                            continue

        if last_error:
            raise last_error
        raise RuntimeError("Failed to generate text - no endpoints available")


# Singleton instance
_ai_service: AIService | None = None


def get_ai_service() -> AIService:
    """Get or create AI service instance."""
    global _ai_service
    if _ai_service is None:
        _ai_service = AIService()
    return _ai_service
