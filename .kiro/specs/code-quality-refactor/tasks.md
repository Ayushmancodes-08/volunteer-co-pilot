# Implementation Plan: Code Quality Refactor

## Overview

Mechanical refactoring to achieve a 100/100 automated Code Quality score. All changes are purely structural — no runtime behavior, public API contracts, or UI output changes. The work is sequenced so that new shared files are created first, then consumers are updated, then compiler strictness flags are enabled, and finally ESLint config is locked down last.

## Tasks

- [x] 1. Create shared frontend utility files
  - [x] 1.1 Create `frontend/src/lib/apiClient.ts`
    - Export a single `API_BASE` constant: `process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'`
    - Use `??` (nullish coalescing) rather than `||` so an empty string env var does not fall back
    - _Requirements: 2.1_

  - [x] 1.2 Create `frontend/src/utils/speechRecognition.ts`
    - Declare a local `ISpeechRecognitionConstructor` interface (`new(): ISpeechRecognition`)
    - Export `getSpeechRecognition(): ISpeechRecognitionConstructor | null`
    - Guard with `typeof window === 'undefined'` for SSR safety
    - Cast `window as unknown as { SpeechRecognition?; webkitSpeechRecognition? }` exactly once
    - _Requirements: 4.1_

- [x] 2. Add typed GenAI response interfaces to the backend
  - [x] 2.1 Add `GeminiApiResponse`, `OpenAIApiResponse`, and `AnthropicApiResponse` interfaces to `backend/src/types/index.ts`
    - `GeminiApiResponse`: `candidates: Array<{ content: { parts: Array<{ text: string }> } }>`
    - `OpenAIApiResponse`: `choices: Array<{ message: { content: string } }>`
    - `AnthropicApiResponse`: `content: Array<{ text: string }>`
    - Add the file-level JSDoc boundary comment above all existing declarations (backend domain model note, do not import into frontend)
    - _Requirements: 3.1, 3.2, 3.3, 10.2_

- [x] 3. Add `ChartDataPoint` interface and JSDoc to the frontend types
  - [x] 3.1 Update `frontend/src/types/index.ts`
    - Add file-level JSDoc boundary comment (frontend view-model note, do not import from backend)
    - Add `ChartDataPoint` interface: required `name: string` field plus index signature `[gate: string]: string | number`
    - Confirm `VolunteerProfile` does not include `shiftStart` (already correct — no change needed)
    - _Requirements: 10.1, 10.3, 11.1_

- [x] 4. Refactor `backend/src/services/genaiService.ts` — eliminate `any` casts
  - [x] 4.1 Replace `any` casts in `callGemini`, `callOpenAI`, `callAnthropic`
    - Import `GeminiApiResponse`, `OpenAIApiResponse`, `AnthropicApiResponse` from `'../types/index'`
    - Replace `(await resp.json()) as any` in `callGemini` with `(await resp.json()) as GeminiApiResponse`
    - Replace `(await resp.json()) as any` in `callOpenAI` with `(await resp.json()) as OpenAIApiResponse`
    - Replace `(await resp.json()) as any` in `callAnthropic` with `(await resp.json()) as AnthropicApiResponse`
    - `callGemini`, `callOpenAI`, `callAnthropic` already return `Promise<string>` — no signature change needed
    - _Requirements: 1.1, 1.3, 3.4_

  - [x] 4.2 Tighten `parseJSONResponse` return type and fix callers
    - Change `parseJSONResponse` signature from `): any` to `): unknown`
    - Update `getAlertRecommendation` return type from `Promise<any>` to `Promise<unknown>`
    - Update `translateText` return type from `Promise<any>` to `Promise<unknown>`
    - Verify that controllers consuming these results already narrow the type before property access; add type narrowing where needed
    - _Requirements: 1.2_

- [x] 5. Update all five frontend hooks to import `API_BASE`
  - [x] 5.1 Update `useAlerts.ts`
    - Add `import { API_BASE } from '../lib/apiClient';`
    - Remove the local `const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';` declaration
    - No other logic changes
    - _Requirements: 2.2_

  - [x] 5.2 Update `useBriefing.ts`
    - Add `import { API_BASE } from '../lib/apiClient';`
    - Remove the local `API_BASE` declaration
    - Remove the redundant `console.error` calls in the catch blocks (both the typed and untyped branches); `setError` already surfaces the error
    - _Requirements: 2.2, 5.1_

  - [x] 5.3 Update `useCrowdData.ts`
    - Add `import { API_BASE } from '../lib/apiClient';`
    - Remove the local `API_BASE` declaration
    - Preserve the `console.error('Failed to fetch crowd data:', err)` call — this is the only error-surfacing mechanism in this hook (no `setError`)
    - _Requirements: 2.2, 5.2_

  - [x] 5.4 Update `useTranslation.ts`
    - Add `import { API_BASE } from '../lib/apiClient';`
    - Remove the local `API_BASE` declaration
    - No console changes needed (hook already has no `console.error` calls)
    - _Requirements: 2.2_

  - [x] 5.5 Update `useVolunteer.ts`
    - Add `import { API_BASE } from '../lib/apiClient';`
    - Remove the local `API_BASE` declaration
    - Remove the redundant `console.error` calls in `fetchProfile` and `updateProfile` catch blocks (both typed and untyped branches); `setError` already surfaces the errors
    - _Requirements: 2.2, 5.1_

- [x] 6. Update `VoiceInput.tsx` to use `getSpeechRecognition()`
  - [x] 6.1 Replace the two duplicate window casts in `VoiceInput.tsx`
    - Add `import { getSpeechRecognition } from '../utils/speechRecognition';`
    - In the `useEffect` support check: replace the inline double window cast with `const SpeechRecognition = getSpeechRecognition(); if (!SpeechRecognition) { setSupported(false); }`
    - In `startListening`: replace the inline double window cast with `const SpeechRecognition = getSpeechRecognition(); if (!SpeechRecognition) return;`
    - The `ISpeechRecognition` instance interface stays in `VoiceInput.tsx` (used only there)
    - _Requirements: 4.2_

- [x] 7. Update `CrowdDashboard.tsx` to use `ChartDataPoint[]`
  - [x] 7.1 Replace the inline `Record<string, string | number>` type in `CrowdDashboard.tsx`
    - Add `ChartDataPoint` to the existing `import { GateCrowdData } from '../types';` import
    - Change `const dataPoint: Record<string, string | number>` to `const dataPoint: ChartDataPoint`
    - The `chartData` array type becomes `ChartDataPoint[]` implicitly
    - _Requirements: 11.2_

- [x] 8. Checkpoint — verify type safety before enabling strict compiler flags
  - Run `tsc --noEmit` in both `frontend/` and `backend/` and confirm zero type errors before proceeding
  - Ensure all tests pass, ask the user if questions arise

- [x] 9. Add `noUnusedLocals` and `noUnusedParameters` to both TypeScript configs
  - [x] 9.1 Update `frontend/tsconfig.json`
    - Add `"noUnusedLocals": true` to `compilerOptions`
    - Add `"noUnusedParameters": true` to `compilerOptions`
    - _Requirements: 9.2, 9.3_

  - [x] 9.2 Update `backend/tsconfig.json`
    - Add `"noUnusedLocals": true` to `compilerOptions`
    - Add `"noUnusedParameters": true` to `compilerOptions`
    - _Requirements: 9.4, 9.5_

- [x] 10. Dead-code and unused-import sweep driven by the new compiler flags
  - [x] 10.1 Run `tsc --noEmit` in `frontend/` and fix every unused local/parameter error reported
    - The compiler flags from task 9.1 are the authoritative detector — fix each violation in the file where it is reported
    - Do not suppress violations with `// @ts-ignore`; remove or use the symbol
    - _Requirements: 6.1, 6.2, 9.6_

  - [x] 10.2 Run `tsc --noEmit` in `backend/` and fix every unused local/parameter error reported
    - Same approach as 10.1 for the backend package
    - _Requirements: 6.1, 6.2, 9.6_

  - [x] 10.3 Run ESLint `no-unused-vars` across `frontend/src/` and `backend/src/` and fix remaining violations
    - Address any import or variable violations not caught by the TypeScript compiler
    - If a violation cannot be safely removed (e.g., intentional catch-binding), use the `_` prefix convention already established in both ESLint configs
    - _Requirements: 6.3_

- [x] 11. Verify naming conventions
  - [x] 11.1 Audit interfaces, type aliases, components, and functions in `frontend/src/` and `backend/src/`
    - Confirm all interfaces/type aliases are PascalCase (already correct per design analysis — task is to verify and update any missed)
    - Confirm all React component files and exports in `frontend/src/components/` are PascalCase
    - Confirm all non-component functions use camelCase; `PROVIDERS` and `MAX_RETRIES` SCREAMING_SNAKE_CASE is intentional — do not rename
    - Update any violations found, keeping all import references in sync
    - _Requirements: 7.1, 7.2, 7.3_

- [x] 12. Checkpoint — full lint and type-check before ESLint config changes
  - Run `tsc --noEmit` on both packages and confirm zero errors
  - Ensure all tests pass, ask the user if questions arise

- [x] 13. Update `frontend/.eslintrc.json` with TypeScript ESLint plugin
  - [x] 13.1 Add TypeScript ESLint parser and plugin rules to `frontend/.eslintrc.json`
    - Verify `@typescript-eslint/eslint-plugin` and `@typescript-eslint/parser` are installed as dev dependencies; install with exact version if missing
    - Set `"parser": "@typescript-eslint/parser"` at the top level
    - Add `"plugin:@typescript-eslint/recommended"` to the `extends` array (after existing entries, before `"prettier"`)
    - Add to `rules`: `"@typescript-eslint/no-explicit-any": "error"`
    - Add to `rules`: `"no-console": ["error", { "allow": ["error"] }]`
    - Preserve all existing rules (`react/react-in-jsx-scope`, `react/prop-types`, `import/order`, `react-hooks/exhaustive-deps`, `jsx-a11y/*`)
    - _Requirements: 12.1, 12.2_

- [x] 14. Update `backend/.eslintrc.json` with TypeScript ESLint plugin
  - [x] 14.1 Add TypeScript ESLint parser and plugin rules to `backend/.eslintrc.json`
    - Verify `@typescript-eslint/eslint-plugin` and `@typescript-eslint/parser` are installed as dev dependencies; install with exact version if missing
    - Set `"parser": "@typescript-eslint/parser"` at the top level
    - Add `"plugin:@typescript-eslint/recommended"` to the `extends` array (after existing entries, before `"prettier"`)
    - Add to `rules`: `"@typescript-eslint/no-explicit-any": "error"`
    - Upgrade existing `"no-console": ["warn", ...]` to `"error"` level; evaluate any `console.warn` in infrastructure code and suppress with `// eslint-disable-next-line no-console` only where genuinely necessary
    - Preserve all existing rules (`no-unused-vars`, `import/order`, `eqeqeq`, `curly`, `import/no-unresolved`)
    - _Requirements: 12.3_

- [x] 15. Final checkpoint — run full lint suite to confirm zero violations
  - Run `eslint --ext .ts,.tsx frontend/src/` and confirm zero `@typescript-eslint/no-explicit-any` and `no-console` violations
  - Run `eslint --ext .ts backend/src/` and confirm zero `@typescript-eslint/no-explicit-any` violations
  - Run `tsc --noEmit` on both packages one final time
  - Ensure all tests pass, ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP (none in this refactor — all tasks are required)
- The sequencing is strict: tasks 1–7 must complete before task 9 (compiler flags), tasks 9–11 must complete before tasks 13–14 (ESLint config)
- ESLint config changes come last intentionally — adding `no-explicit-any: error` before code-level `any` fixes would immediately fail the lint run
- `useAlerts.ts` and `useCrowdData.ts` `console.error` calls are intentionally preserved (only error-surfacing mechanism — no `setError` in those paths)
- The `VolunteerProfile` interface divergence between packages is intentional and documented by the JSDoc comments added in tasks 2.1 and 3.1
- No cross-package imports: frontend and backend remain independent npm workspaces throughout

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "2.1", "3.1"] },
    { "id": 1, "tasks": ["4.1", "4.2", "5.1", "5.2", "5.3", "5.4", "5.5", "6.1", "7.1"] },
    { "id": 2, "tasks": ["9.1", "9.2"] },
    { "id": 3, "tasks": ["10.1", "10.2"] },
    { "id": 4, "tasks": ["10.3", "11.1"] },
    { "id": 5, "tasks": ["13.1", "14.1"] }
  ]
}
```
