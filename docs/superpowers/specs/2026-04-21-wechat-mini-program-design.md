# Wardrowbe WeChat Mini Program Design

## Summary

Build a new WeChat mini program client that fully replicates the current `frontend/` feature surface while keeping business API usage aligned with the existing `/api/v1/**` backend contract. The mini program will be implemented as a separate client application, not a migration of the current Next.js frontend.

The mini program must support both production-grade WeChat login and development-mode login. Backend changes are limited to mini-program-specific authentication endpoints and supporting auth configuration. All existing business domains remain backed by the current backend APIs.

## Goals

- Fully replicate the current `frontend/` feature surface in a WeChat mini program.
- Keep business API calls aligned with the existing `/api/v1/**` backend interface.
- Support both `wechat-login` and `dev-login`.
- Preserve internationalization parity for `zh` and `en`.
- Reuse as much domain logic, typing, and API behavior as is practical without forcing a large cross-platform rewrite of the existing web frontend.

## Non-Goals

- Do not convert the existing Next.js frontend into a multi-platform app.
- Do not create a parallel mini-program-only business API surface.
- Do not pursue pixel-identical UI parity with the web frontend.
- Do not perform unrelated frontend or backend architecture refactors.

## Existing Context

The current web client in `frontend/` is a Next.js application using:

- `next-auth` for web authentication session handling
- `next-intl` for localization
- `@tanstack/react-query` for server state
- a local `frontend/lib/api.ts` wrapper for `/api/v1/**`
- business hooks under `frontend/lib/hooks/`
- page routes under `frontend/app/[locale]/`

The current feature surface includes:

- login and onboarding
- dashboard home
- wardrobe list, filters, folders, bulk actions, item detail, editing, AI reanalysis
- multi-image item upload and quantity tracking
- outfit suggestions with future dates and weather
- pairings
- manual outfits and outfit history
- analytics
- learning insights
- family management and family feed
- notification settings with multiple channels and webhook presets
- settings and user preferences
- invite flow and error handling

## Product Scope

The mini program must cover all currently user-visible web frontend domains:

- `login`
- `onboarding`
- `invite`
- `dashboard`
- `wardrobe`
- `suggest`
- `pairings`
- `outfits`
- `history`
- `analytics`
- `family`
- `family/feed`
- `notifications`
- `learning`
- `settings`
- shared error and loading states

The implementation may be executed as multiple engineering milestones, but the target release scope is full feature parity with the current web frontend.

## High-Level Architecture

### Client Strategy

Create a new standalone mini program client at `wechat-miniapp/`, implemented with `Taro + React + TypeScript`.

This client remains independent from `frontend/`, but shares extracted logic through new shared packages/modules for:

- API client behavior
- domain types
- taxonomy and translation data
- pure business utilities

### Shared Runtime Model

The shared logic should be structured so that the web frontend and mini program can both consume the same domain and API behavior while keeping platform-specific runtime concerns separate.

Recommended shared modules:

- `packages/shared-api`
- `packages/shared-domain`
- `packages/shared-i18n`

These shared modules should live at the repository root under `packages/` so both `frontend/` and `wechat-miniapp/` can consume them with a single canonical import path strategy. The separation of concerns is fixed:

- shared modules own pure logic and API semantics
- each client owns routing, UI components, storage, and platform APIs

## Authentication Design

### Rationale

The web frontend currently depends on `next-auth`, which is not reusable in the mini program runtime. The mini program should not attempt to emulate `next-auth`. Instead, both web and mini program should converge on the same backend access token model.

### Login Modes

The mini program must support both:

- `wechat-login`
- `dev-login`

### WeChat Login Flow

1. Mini program calls `wx.login()` and obtains a WeChat `code`.
2. Mini program sends the `code` to a new backend endpoint.
3. Backend exchanges the code with WeChat, resolves `openid` and related identity data, creates or links the local user, and returns a backend access token compatible with current `/api/v1/**` authorization.
4. Mini program stores the backend access token locally and uses it for all subsequent business API calls.

### Dev Login Flow

1. Mini program provides a development-only login form similar to the web dev login flow.
2. Mini program submits email and display name to a new backend development auth endpoint.
3. Backend validates that dev auth is enabled, creates or syncs the local user, and returns a backend access token.
4. Mini program stores the token and proceeds identically to the WeChat login flow.

### Backend Auth Endpoints

Backend additions are limited to auth endpoints and supporting auth config:

- `POST /api/v1/auth/wechat/code`
- `POST /api/v1/auth/dev-login`
- `GET /api/v1/auth/status` extended as needed to advertise supported login modes

No mini-program-specific business endpoints should be added for wardrobe, outfits, family, settings, analytics, learning, or notifications.

### Mini Program Session Model

The mini program maintains its own auth store and should:

- persist access token in WeChat storage
- restore session state on app launch
- attach `Authorization: Bearer <token>` to business API calls
- clear auth state and redirect to login on `401`
- preserve intended return path during login redirects by storing the guarded destination before redirecting to login and restoring it after successful authentication

The mini program must not rely on browser cookies, `credentials: include`, or `next-auth` session state.

## Shared API Layer Design

### Current Constraint

`frontend/lib/api.ts` currently assumes a browser/web environment with:

- `fetch`
- browser online detection
- module-level token state
- optional `credentials: include`

This is not portable enough for the mini program runtime.

### Target Shape

Extract the API layer into a shared package with three concerns:

1. Core request behavior
   - endpoint path joining
   - query param encoding
   - header composition
   - error parsing
   - `ApiError` and `NetworkError`
2. Runtime adapters
   - web adapter using `fetch`
   - mini program adapter using `Taro.request` or the underlying WeChat request API
3. Runtime bindings
   - access token getter/setter
   - locale getter/setter
   - base URL resolution

The call style should remain stable across clients:

- `api.get('/users/me')`
- `api.post('/outfits/suggest', payload)`
- `api.patch('/preferences', payload)`
- `api.delete('/items/:id')`

### File Upload Support

File upload should be separated from the JSON request wrapper and exposed as dedicated shared upload helpers with runtime-specific implementations.

Mini program upload requirements:

- support item creation with a primary image
- support additional item images up to current backend limits
- support retry and progress/error presentation
- preserve existing backend upload semantics wherever current multipart endpoints already support them

Business meaning stays the same; only transport and local preview behavior are platform-specific.

## Shared Domain Layer

The mini program should share the following categories from the web frontend after extraction:

- TypeScript domain types currently living in `frontend/lib/types.ts`
- taxonomy label resolution helpers
- date utilities
- temperature conversion and display logic
- reorder/filter/sort utilities that do not depend on DOM or web runtime
- API message mapping and common error helpers where platform-agnostic

The mini program should not directly reuse web-only hooks that are tightly coupled to:

- `next-auth`
- `next-intl`
- Next.js navigation
- browser-only APIs

Instead, implementation should:

- extract service-layer business functions
- reimplement platform-specific hooks per client using shared services

## Internationalization Design

The mini program must support `zh` and `en` with the same effective feature coverage as the web frontend.

Implementation direction:

- extract shared message sources from `frontend/messages/en.json` and `frontend/messages/zh.json`
- keep the translation keys aligned across web and mini program
- implement a lightweight mini program i18n runtime instead of reusing `next-intl`
- keep sending `Accept-Language` on backend requests

The mini program does not need to replicate the `next-intl` implementation detail, only the resulting language behavior and translation coverage.

## UI and Interaction Design

### Core Principle

Feature parity is required. Layout parity is not.

The mini program should preserve:

- page-level information architecture
- access to the same user operations
- comparable filters, forms, detail views, and workflows
- the same user-visible domain entities

The mini program should adapt interaction to WeChat norms:

- bottom tabs or mobile navigation instead of desktop sidebar
- single-column mobile layouts instead of multi-column desktop layouts
- sheets, drawers, and dedicated pages instead of heavy modal usage where necessary
- no hover-driven interactions
- long-form forms optimized for mobile touch input

### Page Domain Expectations

#### Auth and Onboarding

- login page with WeChat and dev login
- onboarding flow covering welcome, family, location, preferences, and first item upload
- invite handling and error recovery

#### Dashboard

- weather summary
- pending outfits
- quick actions
- notification summary
- family summary where applicable

#### Wardrobe

- list/grid presentation adapted for mobile
- filters, search, sorting, folder filtering
- bulk selection/actions in a mobile-appropriate toolbar
- item detail and editing
- favorite state, wash tracking, reanalysis, archive state
- multi-image viewing

#### Suggest

- weather context
- target date selection
- occasion selection
- suggestion generation
- accept/reject flows
- manual outfit creation and AI learning usage where supported today

#### Pairings and Outfits

- pairing list and filtering
- preview and feedback
- manual outfit creation
- outfit list and relevant filters

#### History

- calendar-oriented browsing adapted to mobile constraints
- selected-day outfit detail
- feedback and preview flows

#### Analytics and Learning

- preserve current metrics and insights
- use mobile-appropriate data visualization
- exact chart rendering may differ from web as long as information parity is preserved

#### Family and Family Feed

- family creation and joining
- invite code handling
- member management, role updates, removal
- family feed browsing
- family rating interactions

#### Notifications

- existing settings coverage
- supported channel configuration
- webhook preset handling
- test-send and enable/disable flows

#### Settings

- preferences
- location and timezone
- measurement units
- AI endpoints and testing
- profile-related settings that currently exist in the web frontend

## State Management Design

The mini program should use two state layers.

### Global State

- auth/session
- active locale
- current user and family context
- app-wide transient errors
- upload task state

### Screen-Level Server State

- list pagination
- filters and sorting
- detail fetches
- mutation states
- preview or temporary editor state

React Query may continue to be used in the mini program client if the final Taro setup supports it cleanly. Query keys and service boundaries should be shared conceptually, but web hooks and mini program hooks should remain separate implementations.

## Engineering Decomposition

Although the product target is full parity, the engineering work must be split into dependent execution tracks. The implementation plan should break work into at least these areas:

1. mini program app shell and auth
2. shared API/domain/i18n extraction
3. wardrobe, suggest, pairings, outfits, dashboard
4. history, analytics, learning
5. family and notifications
6. settings, onboarding, invite, regression hardening

This is an execution structure only. It does not change the release scope target.

## Repository and Branching Strategy

Create a new development branch named `dev-wechat` for implementation.

Because the current repository already has unrelated local changes in `backend/app/utils/network.py`, implementation should use an isolated worktree for `dev-wechat` so mini program work does not interfere with unrelated in-progress changes.

The design spec itself can be authored from the current branch and then used to drive implementation on `dev-wechat`.

## Testing Strategy

The implementation must include four validation layers.

### Shared Layer Tests

- API error parsing and request configuration
- auth runtime behavior where extracted into pure units
- utility functions for dates, temperatures, filters, sorting, and taxonomy behavior

### Mini Program Client Tests

- auth state transitions
- page form behavior
- list filtering and pagination logic
- upload state transitions
- key empty/error/loading states

### Integration Testing

- WeChat login backend flow
- dev login backend flow
- authenticated `/api/v1/**` access
- multi-image upload
- representative domain operations across wardrobe, suggestions, family, and notifications

### Manual Regression Matrix

Every current `frontend/app/[locale]/` user-facing page should be checked for:

- reachable entry point in mini program
- data loading
- primary write action support
- empty/error/loading state behavior
- `zh` and `en` localization
- real-device or WeChat developer tool usability

## Risks and Mitigations

### Authentication Risk

Risk:
- WeChat auth and current backend user model may not align cleanly on first pass.

Mitigation:
- isolate mini program auth behind new auth endpoints only
- keep downstream business auth model identical to existing backend token usage

### Upload Risk

Risk:
- multi-image upload and image preview behavior differ materially between web and mini program runtimes

Mitigation:
- build upload as a dedicated adapter layer
- validate create, update, retry, and reanalysis paths early

### Scope Risk

Risk:
- full parity across all web domains is too large for a single unstructured implementation pass

Mitigation:
- enforce sub-plans and milestone-based execution while keeping the final release scope unchanged

### Shared Code Risk

Risk:
- attempting to reuse web hooks directly will spread runtime-specific assumptions everywhere

Mitigation:
- share services, types, and utilities
- keep client hooks platform-specific

## Acceptance Criteria

The design is considered successfully implemented when:

- a new WeChat mini program client exists in the repository
- implementation work is executed on branch `dev-wechat`
- mini program users can authenticate via WeChat login
- developers can authenticate via dev login in supported environments
- mini program business features cover the same page-level feature surface as the current `frontend/`
- business data access remains aligned with `/api/v1/**`
- backend additions for this project are limited to mini-program-specific auth support and required auth configuration
- `zh` and `en` are supported across the mini program
- the mini program passes shared-layer tests, key client tests, and a page-by-page regression matrix against the existing web frontend

## Open Decisions Resolved In This Design

- Use a standalone mini program client rather than converting the web app to a multi-platform runtime.
- Use `Taro + React + TypeScript` as the recommended implementation direction.
- Reuse existing business APIs under `/api/v1/**`.
- Add only mini-program-specific authentication endpoints on the backend.
- Support both WeChat login and development login.
- Target full feature parity in the mini program release scope.
- Execute implementation through multiple structured sub-plans rather than one monolithic engineering pass.
