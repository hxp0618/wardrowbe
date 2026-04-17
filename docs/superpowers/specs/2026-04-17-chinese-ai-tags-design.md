# Chinese AI Tags Design

## Goal

Make new AI analyses and user-triggered AI re-analyses store Chinese-facing tags and Chinese `ai_description` in the database, without breaking existing filtering, analytics, recommendation, and learning logic.

## Scope

- Affects:
  - New item AI analysis after upload
  - User-triggered single-item AI re-analysis
  - User-triggered bulk AI re-analysis
- Does not affect:
  - Existing items unless the user explicitly clicks AI re-analysis
  - Non-AI manual item edits
  - Existing analytics, recommendation, and learning contracts

## Constraints

- The UI should be able to display Chinese AI tags directly from `clothing_items.tags`.
- Internal business logic must continue using normalized canonical values.
- No migration or background refresh for existing items.

## Design

### 1. Separate display tags from internal canonical fields

AI responses will be requested in Chinese. The backend will parse the Chinese response into:

- localized display values:
  - stored in `clothing_items.tags`
  - stored in `clothing_items.ai_description`
- canonical internal values:
  - stored in existing top-level item columns such as `type`, `primary_color`, `colors`, `pattern`, `material`, `style`, `formality`, and `season`

This preserves current application behavior while allowing new analyses to persist Chinese tags.

### 2. Normalize Chinese vocab to canonical values

`AIService` will accept both existing English values and new Chinese values when parsing AI JSON. Chinese values will be normalized into the existing canonical vocab used by business logic.

The parser will preserve the original localized strings in a `localized_tags` payload attached to the parsed result.

### 3. Keep worker/database contract stable

`tags_to_item_fields()` in the tagging worker will write:

- canonical values to existing structured columns
- localized values to the JSONB `tags` field
- Chinese `ai_description` to `ai_description`

### 4. Prompt changes

- `clothing_analysis.txt` will require Chinese JSON output using a fixed Chinese vocabulary
- `clothing_description.txt` will require a short Chinese sentence

### 5. Re-analysis behavior

Single-item and bulk re-analysis should enqueue the same image set shape expected by the worker. If additional images exist for the item, they should be passed through on re-analysis as well.

## Risks and Mitigations

- Risk: Chinese tags break recommendation or analytics.
  - Mitigation: those systems continue reading canonical top-level fields only.
- Risk: AI returns unexpected synonyms.
  - Mitigation: constrain prompt vocabulary and support a small alias map in parsing.
- Risk: existing English-path tests regress.
  - Mitigation: parser remains backward-compatible with English AI responses.

## Verification

- Unit test Chinese JSON parsing into:
  - localized display tags
  - canonical normalized fields
- Unit test worker field mapping stores localized tags and canonical columns separately
- Unit test or API-level re-analysis queueing includes additional images when present
