# WeChat Miniapp Mobile Parity Design

Date: 2026-04-23
Status: Approved for planning review
Scope: `wechat-miniapp` existing pages only

## Goal

Bring all existing `wechat-miniapp` pages into close visual and structural parity with the current mobile presentation of the `frontend` application.

This is not a backend or feature-expansion project. The objective is to make the miniapp feel like the same product as the mobile web experience, with small equivalent substitutions only where WeChat Mini Program platform constraints prevent exact reuse.

## Non-Goals

- Adding new miniapp routes solely to match web-only detail/create pages
- Reworking backend APIs
- Refactoring unrelated business logic
- Replacing functioning miniapp behavior unless needed for parity
- Running page-by-page tests incrementally during implementation

## Explicit Execution Rule

Per user direction, implementation will prioritize completing the full parity pass first.

Testing policy for this work:

- Do not stop after each page to run dedicated test passes
- Complete the full shared-shell and page-alignment implementation first
- After implementation is complete, test pages individually and systematically
- Keep lightweight build sanity checks available only when required to unblock development

## Source of Truth

Primary reference:

- Existing `frontend` mobile layout and page implementations under `frontend/app/[locale]/dashboard/*`
- `frontend/app/[locale]/login/page.tsx`
- `frontend/app/[locale]/onboarding/page.tsx`
- `frontend/app/[locale]/invite/page.tsx`

Visual reference priority:

1. Mobile web layout structure
2. Card hierarchy and spacing rhythm
3. Header and bottom navigation composition
4. Typography scale and visual density
5. Equivalent interaction behavior

## Target Pages

Existing miniapp pages to align:

- `dashboard`
- `wardrobe`
- `suggest`
- `outfits`
- `history`
- `analytics`
- `settings`
- `family`
- `family-feed`
- `notifications`
- `learning`
- `login`
- `onboarding`
- `invite`
- `pairings`

## Page Mapping

Direct page mapping:

- `wechat-miniapp/src/pages/dashboard/index.tsx` -> `frontend/app/[locale]/dashboard/page.tsx`
- `wechat-miniapp/src/pages/wardrobe/index.tsx` -> `frontend/app/[locale]/dashboard/wardrobe/page.tsx`
- `wechat-miniapp/src/pages/suggest/index.tsx` -> `frontend/app/[locale]/dashboard/suggest/page.tsx`
- `wechat-miniapp/src/pages/outfits/index.tsx` -> `frontend/app/[locale]/dashboard/outfits/page.tsx`
- `wechat-miniapp/src/pages/history/index.tsx` -> `frontend/app/[locale]/dashboard/history/page.tsx`
- `wechat-miniapp/src/pages/analytics/index.tsx` -> `frontend/app/[locale]/dashboard/analytics/page.tsx`
- `wechat-miniapp/src/pages/settings/index.tsx` -> `frontend/app/[locale]/dashboard/settings/page.tsx`
- `wechat-miniapp/src/pages/family/index.tsx` -> `frontend/app/[locale]/dashboard/family/page.tsx`
- `wechat-miniapp/src/pages/family-feed/index.tsx` -> `frontend/app/[locale]/dashboard/family/feed/page.tsx`
- `wechat-miniapp/src/pages/notifications/index.tsx` -> `frontend/app/[locale]/dashboard/notifications/page.tsx`
- `wechat-miniapp/src/pages/learning/index.tsx` -> `frontend/app/[locale]/dashboard/learning/page.tsx`
- `wechat-miniapp/src/pages/login/index.tsx` -> `frontend/app/[locale]/login/page.tsx`
- `wechat-miniapp/src/pages/onboarding/index.tsx` -> `frontend/app/[locale]/onboarding/page.tsx`
- `wechat-miniapp/src/pages/invite/index.tsx` -> `frontend/app/[locale]/invite/page.tsx`
- `wechat-miniapp/src/pages/pairings/index.tsx` -> `frontend/app/[locale]/dashboard/pairings/page.tsx`

Equivalent-not-identical mapping:

- Web routes such as `outfits/[id]` and `outfits/new` remain represented inside existing miniapp pages through inline details, sheets, or page-local flows instead of new routes.

## Design Principles

### 1. Shared Product Identity

The miniapp must no longer look like a separate prototype or an alternate brand expression. It should read as the same product rendered in a WeChat-native shell.

### 2. Close Visual Parity

The target is near pixel-level fidelity for:

- overall layout
- spacing
- card structure
- typographic hierarchy
- icon density
- header composition
- tab bar composition

### 3. Platform-Appropriate Substitution

When the web uses primitives the miniapp cannot mirror directly, the replacement must preserve:

- information hierarchy
- user decision path
- relative prominence
- action discoverability

### 4. Shared Foundation First

The miniapp should not be aligned page-by-page using ad hoc styles. Shared shell and component primitives must be established first so the remaining pages inherit a consistent system.

## Shared Shell Work

The first implementation phase establishes a common miniapp frame that matches the mobile web experience.

### Header

Rebuild the miniapp page header to visually align with the mobile web dashboard shell:

- left-side menu affordance or equivalent placeholder treatment
- centered or balanced locale switcher treatment
- theme toggle equivalent
- avatar presentation
- logout affordance
- dark header surface and border treatment

The miniapp may not implement the exact same dropdown mechanics as web, but the visible controls and layout rhythm should closely match.

### Content Surface

Replace the current light, utility-style page shell with a dark product shell consistent with the mobile web screenshot and dashboard layout.

Shared content rules:

- dark page background
- constrained mobile content width behavior
- consistent vertical stacking rhythm
- unified heading styles
- unified section gaps
- bottom safe-area spacing

### Bottom Navigation

Align the miniapp tab presentation to the mobile web bottom navigation:

- icon order
- active/inactive treatment
- label hierarchy
- border and background treatment
- spacing and touch target size

Behavior must remain correct for WeChat tab pages.

### Shared Components

Create or restyle reusable miniapp primitives for:

- section cards
- statistic cards
- action buttons
- badges
- empty states
- loading skeletons
- list rows
- avatar fallback blocks
- inline segmented controls where needed
- detail sheets / local overlays where route parity is not possible

## Page Batches

### Batch 1: Foundation-Critical Pages

- dashboard
- wardrobe
- suggest
- outfits
- history
- analytics
- settings

These pages define most of the reusable layout vocabulary and should establish the parity baseline for the rest of the app.

### Batch 2: Remaining Pages

- family
- family-feed
- notifications
- learning
- login
- onboarding
- invite
- pairings

These pages will reuse the shared shell and component system created in batch 1 and then receive page-specific parity refinements.

## Interaction Alignment Rules

Must remain aligned:

- primary CTA placement
- empty-state actions
- list/detail flow meaning
- accept/reject affordances
- tab switching semantics
- page entry hierarchy

Allowed equivalent substitutions:

- web dialogs -> miniapp sheets or inline expanded panels
- dropdown menus -> picker or action sheet
- web hover detail -> explicit tap affordance
- route-based detail pages -> page-local sheets or embedded detail states

## Implementation Boundaries

The parity project may change:

- page layout
- component structure
- local interaction presentation
- spacing and typography
- icon usage
- page composition

The parity project should avoid changing:

- API contracts
- backend persistence
- domain rules
- authorization model
- unrelated data fetching behavior

## Risks

### Shared-Shell Drift

If shared primitives are not defined first, page implementations will diverge visually and require expensive cleanup later.

### Web-Only Interaction Leakage

Some web patterns will not map directly to miniapp capabilities. Forcing identical mechanics instead of equivalent outcomes would create brittle or unnatural miniapp UX.

### Hidden Scope Expansion

Trying to replicate web-only routes or modal ecosystems as entirely new miniapp navigation structures would expand scope beyond the approved request.

## Verification Strategy

Verification will happen after the full parity implementation is complete.

Final verification steps:

1. Build the miniapp successfully
2. Review all 15 existing pages one by one against frontend mobile references
3. Verify core interactions on each page
4. Check for style drift between pages
5. Confirm tab routing and non-tab routing remain correct

This work intentionally defers page-by-page test passes until implementation is complete, per user instruction.

## Acceptance Criteria

- All existing miniapp pages visually align with their frontend mobile counterparts
- Shared header, bottom navigation, card system, button system, and empty states are unified
- Dashboard-level parity establishes the visual baseline for the whole miniapp
- Remaining pages no longer look like a separate design language
- Necessary miniapp-specific substitutions preserve the same meaning and user flow as the web version
- Final validation is performed page-by-page only after the full implementation pass is complete
