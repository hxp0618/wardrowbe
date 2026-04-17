# Chinese AI Tags Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Store Chinese AI tags and Chinese descriptions for new analyses and re-analyses while preserving canonical internal fields for business logic.

**Architecture:** Update AI prompts to return Chinese values, extend AI parsing to preserve localized values and normalize canonical values, then update the tagging worker to persist localized tags in JSONB and canonical values in structured columns. Keep downstream recommendation, filtering, analytics, and learning logic unchanged by preserving their existing input fields.

**Tech Stack:** FastAPI, SQLAlchemy, ARQ worker, Pydantic, pytest

---

### Task 1: Add failing parser and worker mapping tests

**Files:**
- Modify: `backend/tests/test_ai_service.py`
- Create: `backend/tests/test_tagging_worker.py`
- Test: `backend/tests/test_ai_service.py`
- Test: `backend/tests/test_tagging_worker.py`

- [ ] **Step 1: Write the failing parser test**

```python
def test_parse_chinese_localized_json():
    service = AIService()
    response = """
    {
        "type": "衬衫",
        "subtype": "牛津纺",
        "primary_color": "蓝色",
        "colors": ["蓝色", "白色"],
        "pattern": "条纹",
        "material": "棉",
        "formality": "休闲",
        "style": ["经典", "极简"],
        "season": ["春季", "秋季"],
        "fit": "合身"
    }
    """

    tags = service._parse_tags_from_response(response)

    assert tags.type == "shirt"
    assert tags.primary_color == "blue"
    assert tags.pattern == "striped"
    assert tags.material == "cotton"
    assert tags.formality == "casual"
    assert tags.style == ["classic", "minimalist"]
    assert tags.season == ["spring", "fall"]
    assert tags.fit == "regular"
    assert tags.localized_tags["colors"] == ["蓝色", "白色"]
```

- [ ] **Step 2: Run parser test to verify it fails**

Run: `python -m pytest backend/tests/test_ai_service.py -k chinese_localized_json -v`
Expected: FAIL because `localized_tags` and Chinese normalization do not exist yet

- [ ] **Step 3: Write the failing worker mapping test**

```python
def test_tags_to_item_fields_keeps_localized_tags_but_canonical_columns():
    tags = ClothingTags(
        type="shirt",
        subtype="牛津纺",
        primary_color="blue",
        colors=["blue", "white"],
        pattern="striped",
        material="cotton",
        style=["classic"],
        formality="casual",
        season=["spring"],
        fit="regular",
        description="蓝白条纹衬衫，版型合身。",
        localized_tags={
            "primary_color": "蓝色",
            "colors": ["蓝色", "白色"],
            "pattern": "条纹",
            "material": "棉",
            "style": ["经典"],
            "season": ["春季"],
            "formality": "休闲",
            "fit": "合身",
        },
    )

    fields = tags_to_item_fields(tags)

    assert fields["primary_color"] == "blue"
    assert fields["pattern"] == "striped"
    assert fields["tags"]["colors"] == ["蓝色", "白色"]
    assert fields["tags"]["pattern"] == "条纹"
    assert fields["ai_description"] == "蓝白条纹衬衫，版型合身。"
```

- [ ] **Step 4: Run worker mapping test to verify it fails**

Run: `python -m pytest backend/tests/test_tagging_worker.py -v`
Expected: FAIL because worker currently stores canonical values into `tags`

### Task 2: Implement localized AI parsing and prompts

**Files:**
- Modify: `backend/app/prompts/clothing_analysis.txt`
- Modify: `backend/app/prompts/clothing_description.txt`
- Modify: `backend/app/services/ai_service.py`
- Test: `backend/tests/test_ai_service.py`

- [ ] **Step 1: Update analysis prompt to fixed Chinese vocabulary**

Add explicit Chinese vocab requirements for each field and keep JSON-only output.

- [ ] **Step 2: Update description prompt to short Chinese sentence**

Require a single short Chinese sentence focused on garment type, color, and notable feature.

- [ ] **Step 3: Add localized payload support and Chinese normalization**

Implement parser changes in `AIService` so it:
- preserves localized strings into `localized_tags`
- normalizes Chinese and English values into existing canonical vocab
- remains backward-compatible for English responses

- [ ] **Step 4: Run parser tests**

Run: `python -m pytest backend/tests/test_ai_service.py -v`
Expected: PASS

### Task 3: Persist localized tags while preserving canonical columns

**Files:**
- Modify: `backend/app/workers/tagging.py`
- Test: `backend/tests/test_tagging_worker.py`

- [ ] **Step 1: Update worker field mapping**

Make `tags_to_item_fields()` write localized values into JSONB `tags` and canonical values into structured columns.

- [ ] **Step 2: Run worker mapping tests**

Run: `python -m pytest backend/tests/test_tagging_worker.py -v`
Expected: PASS

### Task 4: Keep re-analysis image payloads consistent

**Files:**
- Modify: `backend/app/api/items.py`
- Create or Modify: `backend/tests/test_items_reanalyze.py`

- [ ] **Step 1: Write a failing re-analysis enqueue test**

Test that single-item and bulk re-analysis enqueue additional image paths when present.

- [ ] **Step 2: Run the re-analysis test to verify it fails**

Run: `python -m pytest backend/tests/test_items_reanalyze.py -v`
Expected: FAIL because re-analysis currently enqueues only the primary image

- [ ] **Step 3: Implement enqueue parity for re-analysis**

Pass additional image paths into `tag_item_image` for both single-item and bulk re-analysis.

- [ ] **Step 4: Run the re-analysis test**

Run: `python -m pytest backend/tests/test_items_reanalyze.py -v`
Expected: PASS

### Task 5: Final verification

**Files:**
- Modify: `backend/app/services/ai_service.py`
- Modify: `backend/app/workers/tagging.py`
- Modify: `backend/app/api/items.py`
- Modify: `backend/app/prompts/clothing_analysis.txt`
- Modify: `backend/app/prompts/clothing_description.txt`
- Modify: `backend/tests/test_ai_service.py`
- Create: `backend/tests/test_tagging_worker.py`
- Create or Modify: `backend/tests/test_items_reanalyze.py`

- [ ] **Step 1: Run targeted backend verification**

Run: `python -m pytest backend/tests/test_ai_service.py backend/tests/test_tagging_worker.py backend/tests/test_items_reanalyze.py -v`
Expected: PASS

- [ ] **Step 2: Run a broader regression slice**

Run: `python -m pytest backend/tests/test_clothing_utils.py backend/tests/test_item_scorer.py -v`
Expected: PASS
