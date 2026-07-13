# Design Document

## Overview

This design covers the mechanical refactoring changes required to achieve a 100/100 automated Code Quality score for the `volunteer-co-pilot` project. All changes are purely structural — no runtime behavior, public API contracts, or UI output changes. The work is split across twelve targeted change-sets that map 1:1 to the requirements.

The key architectural principle throughout: **no cross-package coupling**. The frontend and backend are independent npm workspaces. Types are intentionally duplicated at the boundary layer; the design documents this explicitly rather than introducing a shared package.

---

## Architecture

### Current State vs Target State

```
CURRENT                               TARGET
───────────────────────────────────   ────────────────────────────────────
frontend/src/hooks/useAlerts.ts       (no change to structure)
  const API_BASE = process.env...  ─► removed; imported from lib/apiClient
frontend/src/hooks/useBriefing.ts     (same)
frontend/src/hooks/useCrowdData.ts    (same)
frontend/src/hooks/useTranslation.ts  (same)
frontend/src/hooks/useVolunteer.ts    (same)

                                      NEW: frontend/src/lib/apiClient.ts
                                      NEW: frontend/src/utils/speechRecognition.ts

frontend/src/types/index.ts           + JSDoc boundary comment
                                      + ChartDataPoint interface
                                      VolunteerProfile: no shiftStart ✓

backend/src/types/index.ts            + JSDoc boundary comment
                                      + GeminiApiResponse interface
                                      + OpenAIApiResponse interface
                                      + AnthropicApiResponse interface
                                      VolunteerProfile: retains shiftStart ✓

backend/src/services/genaiService.ts  any → typed interfaces
                                      parseJSONResponse returns unknown

frontend/tsconfig.json                + noUnusedLocals: true
                                      + noUnusedParameters: true

backend/tsconfig.json                 + noUnusedLocals: true
                                      + noUnusedParameters: true

frontend/.eslintrc.json               + @typescript-eslint/no-explicit-any: error
                                      + no-console: ["error", {allow:["error"]}]
                                      + @typescript-eslint/parser + plugin

backend/.eslintrc.json                + @typescript-eslint/no-explicit-any: error
                                      + @typescript-eslint/parser + plugin

CrowdDashboard.tsx                    chartData: ChartDataPoint[]
                                      lineColors: hardcoded hex → CSS var
VoiceInput.tsx                        duplicate window casts → getSpeechRecognition()
```

---

## Component Design

### 1. `frontend/src/lib/apiClient.ts` (new file)

Single responsibility: export the `API_BASE` constant.

```typescript
export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
```

All five hooks (`useAlerts`, `useBriefing`, `useCrowdData`, `useTranslation`, `useVolunteer`) remove their local `const API_BASE = ...` declaration and add:

```typescript
import { API_BASE } from '../lib/apiClient';
```

No other changes to hook logic.

---

### 2. `frontend/src/utils/speechRecognition.ts` (new file)

Encapsulates the unsafe browser window cast in one place.

```typescript
interface ISpeechRecognitionConstructor {
  new (): ISpeechRecognition;
}

export function getSpeechRecognition(): ISpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    SpeechRecognition?: ISpeechRecognitionConstructor;
    webkitSpeechRecognition?: ISpeechRecognitionConstructor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}
```

`ISpeechRecognition` (the instance type) stays in `VoiceInput.tsx` since it is only used there. The constructor accessor is what was duplicated.

**VoiceInput.tsx changes:**
- `useEffect` support check: `const SpeechRecognition = getSpeechRecognition(); if (!SpeechRecognition) { setSupported(false); }`
- `startListening`: `const SpeechRecognition = getSpeechRecognition(); if (!SpeechRecognition) return;`
- Both inline `window as unknown as { ... }` casts removed.

---

### 3. Backend GenAI response interfaces (`backend/src/types/index.ts`)

Three new interfaces added, modelling only the properties accessed by the service:

```typescript
export interface GeminiApiResponse {
  candidates: Array<{
    content: {
      parts: Array<{ text: string }>;
    };
  }>;
}

export interface OpenAIApiResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export interface AnthropicApiResponse {
  content: Array<{ text: string }>;
}
```

**genaiService.ts changes:**
- `callGemini`: `const data = (await resp.json()) as GeminiApiResponse;`
- `callOpenAI`: `const data = (await resp.json()) as OpenAIApiResponse;`
- `callAnthropic`: `const data = (await resp.json()) as AnthropicApiResponse;`
- Import the three interfaces from `'../types/index'`

`callGemini`, `callOpenAI`, `callAnthropic` already declare `Promise<string>` return types — no change needed there.

---

### 4. `parseJSONResponse` return type

**Current:** `function parseJSONResponse(raw: string, maxBytes = 8192): any`

**Target:** `function parseJSONResponse(raw: string, maxBytes = 8192): unknown`

The callers (`getAlertRecommendation`, `translateText`) return `Promise<any>` — those must also be tightened to `Promise<unknown>`. Controllers that consume those results will need to type-narrow before property access, which is the correct pattern and the intent of Requirement 1 AC2.

---

### 5. `frontend/src/types/index.ts` — additions and JSDoc

```typescript
/**
 * @fileoverview Frontend view-model types.
 * These types represent the shape of data as consumed by the React UI layer.
 * They are intentionally decoupled from the backend domain types in
 * `backend/src/types/index.ts`. Do NOT import from the backend package.
 */
```

New interface added:

```typescript
export interface ChartDataPoint {
  name: string;
  [gate: string]: string | number;
}
```

Confirm `VolunteerProfile` does NOT contain `shiftStart` — current file already satisfies this.

---

### 6. `backend/src/types/index.ts` — JSDoc

```typescript
/**
 * @fileoverview Backend domain model and API contract types.
 * These types represent the server-side data model, Zod-validated payloads,
 * and API response shapes. Do NOT import these into the frontend package.
 */
```

Confirm `VolunteerProfile` retains `shiftStart?: string` — current file already satisfies this.

---

### 7. `CrowdDashboard.tsx` — typed chart data

**Current:**
```typescript
const dataPoint: Record<string, string | number> = { name: `T-${8 - idx - 1}m` };
```

**Target:**
```typescript
import { GateCrowdData, ChartDataPoint } from '../types';
// ...
const dataPoint: ChartDataPoint = { name: `T-${8 - idx - 1}m` };
```

The `chartData` array type becomes `ChartDataPoint[]` implicitly.

The `lineColors` object is already using `var(--color-yinmin-blue, #2e5b88)` for Gate A — this satisfies Requirement 8 AC2. Gates B–F use standard color literals (`#10b981`, `#f59e0b`, etc.) that are not project palette tokens, so they are unchanged per Requirement 8 AC3 ("not alter existing Tailwind utility class usage"). These are chart stroke colors, not inline `style` props on components, so they do not constitute palette design-token violations.

---

### 8. Console statement removal from hooks

Audit result from reading all four hooks:

| Hook | `console.error` call | Has `setError`? | Remove? |
|---|---|---|---|
| `useAlerts.ts` | `loadHistory` catch: logs err | No `setError` in this path | **Preserve** (only error surface) |
| `useAlerts.ts` | `evaluateGate` catch: logs err | No `setError` | **Preserve** (only error surface) |
| `useAlerts.ts` | `dismissAlert` catch: logs err | No `setError` | **Preserve** (only error surface) |
| `useBriefing.ts` | catch: logs err + sets `setError` | Yes, `setError` is also called | **Remove** log, keep `setError` |
| `useCrowdData.ts` | catch: logs err | No `setError` | **Preserve** (only error surface) |
| `useVolunteer.ts` | `fetchProfile` catch: logs err + sets `setError` | Yes | **Remove** log, keep `setError` |
| `useVolunteer.ts` | `updateProfile` catch: logs err + sets `setError` | Yes | **Remove** log, keep `setError` |

Requirement 5 AC2 says preserve if it is "the only mechanism surfacing an error". In `useAlerts` and `useCrowdData`, no `setError` state exists, so the `console.error` calls are the only signal — they are preserved.

After removing the duplicate logs in `useBriefing` and `useVolunteer`, the Requirement 12 ESLint rule `"no-console": ["error", { "allow": ["error"] }]` will permit the remaining `console.error` calls.

---

### 9. Dead code and unused imports

Scan is deferred to task execution where the TypeScript compiler (`noUnusedLocals: true`) and ESLint (`no-unused-vars`) are the authoritative detectors. The design simply specifies the process:

1. Add strict compiler flags (Requirement 9).
2. Run `tsc --noEmit` in both packages.
3. Fix every reported unused local/parameter.
4. Run ESLint with `no-unused-vars` in both packages.
5. Fix every reported violation.

No specific unused symbols are pre-identified here because the compiler flags aren't enabled yet — the flags themselves drive discovery.

---

### 10. TypeScript configuration changes

**`frontend/tsconfig.json`** — add to `compilerOptions`:
```json
"noUnusedLocals": true,
"noUnusedParameters": true
```

**`backend/tsconfig.json`** — add to `compilerOptions`:
```json
"noUnusedLocals": true,
"noUnusedParameters": true
```

Both files already have `"strict": true`. The `noUnusedLocals`/`noUnusedParameters` flags are not implied by `strict` — they must be added explicitly.

---

### 11. ESLint configuration changes

**`frontend/.eslintrc.json`:**
- Add `"@typescript-eslint/parser"` to `parser` field (currently missing — required for TypeScript rules).
- Add `"plugin:@typescript-eslint/recommended"` to `extends`.
- Add to `rules`:
  ```json
  "@typescript-eslint/no-explicit-any": "error",
  "no-console": ["error", { "allow": ["error"] }]
  ```
- The existing `"react/react-in-jsx-scope": "off"` and other rules are preserved.

**`backend/.eslintrc.json`:**
- Add `"@typescript-eslint/parser"` to `parser` field.
- Add `"plugin:@typescript-eslint/recommended"` to `extends`.
- Add to `rules`:
  ```json
  "@typescript-eslint/no-explicit-any": "error"
  ```
- The existing `"no-console": ["warn", { "allow": ["error", "warn"] }]` is upgraded to `"error"` consistent with the frontend rule. The backend legitimately uses `console.warn` in some infrastructure code — this will be evaluated at task time and suppressed with `// eslint-disable-next-line` only where genuinely necessary.

> **Note on `@typescript-eslint` availability:** The frontend's `package.json` must have `@typescript-eslint/eslint-plugin` and `@typescript-eslint/parser` as dev dependencies. The task executor will verify these are installed before modifying ESLint config; if not, it will install them.

---

### 12. Naming convention audit

Based on code reading:

- All interfaces in both `types/index.ts` files are already PascalCase (`Task`, `VolunteerProfile`, `GateCrowdData`, `Alert`, `AIBriefingData`, `TranslationResult`). No renames needed.
- All React component files and exports in `frontend/src/components/` use PascalCase (`AIBriefing`, `AlertsPanel`, `CrowdDashboard`, etc.). No renames needed.
- All non-component functions use camelCase (`callGemini`, `buildReasoningPrompt`, `retryWithBackoff`, etc.). No renames needed.
- The `PROVIDERS` constant and `MAX_RETRIES` use SCREAMING_SNAKE_CASE which is the standard convention for module-level constants — these are intentionally exempt from camelCase.

Requirement 7 is satisfied by confirming no violations exist, then enabling the ESLint naming-convention rule to prevent future regressions.

---

## Data Flow (unchanged)

The refactoring makes zero changes to runtime data flow. The existing pattern is preserved:

```
Browser → React hooks (fetch) → Fastify routes → Controllers → Services → GenAI APIs
                                                                         → Cache
```

---

## Error Handling (unchanged)

All existing `try/catch` blocks, `AbortController` patterns, and error state management are preserved. The only change is removing `console.error` calls in hooks where `setError` already surfaces the error to the UI layer.

---

## File Change Summary

| File | Change Type | Description |
|---|---|---|
| `frontend/src/lib/apiClient.ts` | **Create** | Single `API_BASE` export |
| `frontend/src/utils/speechRecognition.ts` | **Create** | `getSpeechRecognition()` utility |
| `frontend/src/hooks/useAlerts.ts` | **Modify** | Remove local `API_BASE`, import from apiClient |
| `frontend/src/hooks/useBriefing.ts` | **Modify** | Remove local `API_BASE`, remove redundant `console.error` |
| `frontend/src/hooks/useCrowdData.ts` | **Modify** | Remove local `API_BASE` |
| `frontend/src/hooks/useTranslation.ts` | **Modify** | Remove local `API_BASE` |
| `frontend/src/hooks/useVolunteer.ts` | **Modify** | Remove local `API_BASE`, remove redundant `console.error` calls |
| `frontend/src/components/VoiceInput.tsx` | **Modify** | Replace duplicate window casts with `getSpeechRecognition()` |
| `frontend/src/components/CrowdDashboard.tsx` | **Modify** | Use `ChartDataPoint[]` type |
| `frontend/src/types/index.ts` | **Modify** | Add JSDoc, add `ChartDataPoint` |
| `backend/src/types/index.ts` | **Modify** | Add JSDoc, add `GeminiApiResponse`, `OpenAIApiResponse`, `AnthropicApiResponse` |
| `backend/src/services/genaiService.ts` | **Modify** | Replace `as any` casts, `parseJSONResponse` returns `unknown` |
| `frontend/tsconfig.json` | **Modify** | Add `noUnusedLocals`, `noUnusedParameters` |
| `backend/tsconfig.json` | **Modify** | Add `noUnusedLocals`, `noUnusedParameters` |
| `frontend/.eslintrc.json` | **Modify** | Add TypeScript ESLint parser/plugin, `no-explicit-any`, `no-console` rules |
| `backend/.eslintrc.json` | **Modify** | Add TypeScript ESLint parser/plugin, `no-explicit-any` rule |
