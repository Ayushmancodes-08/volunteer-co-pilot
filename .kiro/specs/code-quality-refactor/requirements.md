# Requirements Document

## Introduction

This feature addresses automated code quality improvements across the `volunteer-co-pilot` project — a GenAI-enabled stadium operations and fan experience platform for FIFA World Cup 2026. The goal is to achieve a 100/100 automated Code Quality evaluation score by eliminating type-safety gaps, consolidating shared types, centralizing API configuration, removing code smells, enforcing naming conventions, and mapping design tokens to CSS variables. The refactoring spans the Next.js/React frontend (`frontend/src/`) and the Fastify backend (`backend/src/`), without altering any runtime behavior or public interfaces.

## Glossary

- **Refactoring_Tool**: The automated code quality refactoring system described in this document.
- **Frontend**: The Next.js/React application in `frontend/src/`.
- **Backend**: The Fastify application in `backend/src/`.
- **Shared_Type**: A TypeScript interface or type alias that is used in more than one file.
- **API_Base_Constant**: The `process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'` string, currently duplicated across all five frontend hooks.
- **GenAI_Response**: The raw text returned by Gemini, OpenAI, or Anthropic APIs.
- **ParseJSONResponse**: The `parseJSONResponse` function in `backend/src/services/genaiService.ts`.
- **SpeechRecognition_Window**: The browser `window.SpeechRecognition` / `window.webkitSpeechRecognition` accessor, currently duplicated twice inside `VoiceInput.tsx`.
- **Design_Token**: A named color value from the project palette (YinMin Blue `#2e5b88`, Deep Ocean `#0b1d33`, and their semantic variants) used to style UI components.
- **Console_Statement**: Any `console.log`, `console.warn`, `console.debug`, or `console.info` call used for non-error diagnostic output.
- **Dead_Code**: Unused imports, unreachable code branches, and unused variable declarations.
- **camelCase**: Naming convention for variables, function parameters, and non-component functions.
- **PascalCase**: Naming convention for React components, TypeScript interfaces, and type aliases.

---

## Requirements

### Requirement 1: Eliminate Explicit `any` Types in the Backend GenAI Service

**User Story:** As a developer, I want all backend GenAI service functions to return explicitly typed values instead of `any`, so that TypeScript's strict mode catches contract violations at compile time.

#### Acceptance Criteria

1. THE `Refactoring_Tool` SHALL replace the `any` return type of `callGemini`, `callOpenAI`, and `callAnthropic` in `backend/src/services/genaiService.ts` with `Promise<string>`, which matches their actual runtime return value.
2. THE `Refactoring_Tool` SHALL replace the `any` return type of `ParseJSONResponse` in `backend/src/services/genaiService.ts` with `unknown`, preserving the caller's obligation to narrow the type before use.
3. THE `Refactoring_Tool` SHALL replace all `(await resp.json()) as any` casts in `backend/src/services/genaiService.ts` with typed intermediate variables that use the narrowest correct type for the specific provider response shape.
4. WHEN `tsc --noEmit` is run on the backend after the changes, THE `Refactoring_Tool` SHALL produce zero type errors in total, including any pre-existing type issues exposed by removing `any` casts.

---

### Requirement 2: Eliminate Duplicate `API_Base_Constant` Across Frontend Hooks

**User Story:** As a developer, I want the API base URL to be declared in one place and imported everywhere it is needed, so that changing the URL requires editing a single file.

#### Acceptance Criteria

1. THE `Refactoring_Tool` SHALL create a new file `frontend/src/lib/apiClient.ts` that exports a single `API_BASE` constant derived from `process.env.NEXT_PUBLIC_API_URL` with a `'http://localhost:4000'` fallback.
2. THE `Refactoring_Tool` SHALL remove the inline `API_BASE` declarations from `useAlerts.ts`, `useBriefing.ts`, `useCrowdData.ts`, `useTranslation.ts`, and `useVolunteer.ts`, replacing each with an import from `frontend/src/lib/apiClient.ts`.
3. WHEN `tsc --noEmit` is run on the frontend after the changes, THE `Refactoring_Tool` SHALL produce zero new type errors compared to the pre-refactor baseline.

---

### Requirement 3: Type-Safe GenAI Provider Response Interfaces

**User Story:** As a developer, I want explicit TypeScript interfaces for each third-party GenAI API response shape, so that property accesses on parsed API responses are verified at compile time.

#### Acceptance Criteria

1. THE `Refactoring_Tool` SHALL add a `GeminiApiResponse` interface to `backend/src/types/index.ts` that models the `candidates[].content.parts[].text` structure returned by the Gemini API.
2. THE `Refactoring_Tool` SHALL add an `OpenAIApiResponse` interface to `backend/src/types/index.ts` that models the `choices[].message.content` structure returned by the OpenAI Chat Completions API.
3. THE `Refactoring_Tool` SHALL add an `AnthropicApiResponse` interface to `backend/src/types/index.ts` that models the `content[].text` structure returned by the Anthropic Messages API.
4. THE `Refactoring_Tool` SHALL update `callGemini`, `callOpenAI`, and `callAnthropic` in `genaiService.ts` to cast `resp.json()` to the corresponding typed interface instead of `any`.
5. WHEN `tsc --noEmit` is run on the backend, THE `Refactoring_Tool` SHALL produce zero new type errors.

---

### Requirement 4: Extract Duplicated `SpeechRecognition` Window Accessor

**User Story:** As a developer, I want the browser SpeechRecognition API accessor extracted into a utility function, so that `VoiceInput.tsx` does not repeat the same unsafe window cast twice.

#### Acceptance Criteria

1. THE `Refactoring_Tool` SHALL create a `getSpeechRecognition` function in `frontend/src/utils/speechRecognition.ts` that returns the browser's `SpeechRecognition` constructor or `null` if unsupported, typed with a locally declared `ISpeechRecognitionConstructor` interface.
2. THE `Refactoring_Tool` SHALL remove both duplicate `window as unknown as { SpeechRecognition?; webkitSpeechRecognition? }` casts from `VoiceInput.tsx` and replace each call site with an invocation of `getSpeechRecognition`.
3. WHEN `tsc --noEmit` is run on the frontend, THE `Refactoring_Tool` SHALL produce zero new type errors.

---

### Requirement 5: Remove Dead `Console_Statement` Calls from Frontend Hooks

**User Story:** As a developer, I want `console.error` calls used for transient error logging removed from production frontend hook code, so that sensitive internal error messages are not exposed in browser developer tools.

#### Acceptance Criteria

1. THE `Refactoring_Tool` SHALL remove all `console.error` debug-logging calls from `useAlerts.ts`, `useBriefing.ts`, `useCrowdData.ts`, and `useVolunteer.ts`.
2. THE `Refactoring_Tool` SHALL preserve any `console.error` call that is the only mechanism surfacing an error to an operator (i.e., where no other error state is set and the caller has no error return value).
3. WHEN `eslint --ext .ts,.tsx frontend/src` is run after the changes, THE `Refactoring_Tool` SHALL produce zero `no-console` rule violations in the modified hook files.

---

### Requirement 6: Remove All Unused Imports and Dead Code

**User Story:** As a developer, I want unused imports and unreachable code removed from the codebase, so that linting passes cleanly and bundle size is minimized.

#### Acceptance Criteria

1. THE `Refactoring_Tool` SHALL remove any import statement in `frontend/src/` and `backend/src/` that is flagged as unused by the TypeScript compiler (`noUnusedLocals: true`) or the ESLint `no-unused-vars` rule.
2. THE `Refactoring_Tool` SHALL remove any variable or function declaration in `frontend/src/` and `backend/src/` that is never referenced after its declaration point.
3. WHEN `eslint` is run on `frontend/src/` and `backend/src/` after the changes, THE `Refactoring_Tool` SHALL produce zero `no-unused-vars` or `@typescript-eslint/no-unused-vars` violations, and IF any violations remain that cannot be safely removed, THEN THE `Refactoring_Tool` SHALL fail the operation rather than proceed with outstanding violations.

---

### Requirement 7: Normalize Naming Conventions

**User Story:** As a developer, I want all identifiers to follow the project's established camelCase/PascalCase conventions, so that the codebase is consistent and tools like ESLint `@typescript-eslint/naming-convention` can enforce it automatically.

#### Acceptance Criteria

1. THE `Refactoring_Tool` SHALL rename any TypeScript interface or type alias in `frontend/src/` and `backend/src/` that does not start with a PascalCase letter to use PascalCase, updating all import references.
2. THE `Refactoring_Tool` SHALL rename any React component file or export in `frontend/src/components/` that does not use PascalCase to use PascalCase, updating all import references.
3. THE `Refactoring_Tool` SHALL rename any non-component function or variable in `frontend/src/` and `backend/src/` that uses PascalCase or kebab-case to use camelCase.
4. WHEN `eslint --ext .ts,.tsx` is run with `@typescript-eslint/naming-convention` enabled after the changes, THE `Refactoring_Tool` SHALL execute ESLint to verify its output and produce zero naming-convention violations for the renamed identifiers before completing.

---

### Requirement 8: Map Design Tokens to CSS Variables — No Hardcoded Inline Color Styles

**User Story:** As a developer, I want all color values from the project's palette mapped exclusively through CSS custom properties or Tailwind configuration, so that design tokens can be updated in one place without searching the component tree.

#### Acceptance Criteria

1. THE `Refactoring_Tool` SHALL verify that `--color-yinmin-blue` and `--color-deep-ocean` CSS custom properties are declared in `frontend/src/app/globals.css` under the `@theme` block, which is already present and correct.
2. THE `Refactoring_Tool` SHALL replace every hardcoded hex color value in inline `style` props within `frontend/src/components/` (e.g., `style={{ color: '#2e5b88' }}`) with a reference to the corresponding CSS variable using `var(--color-yinmin-blue)` syntax or a Tailwind utility class derived from `tailwind.config`.
3. THE `Refactoring_Tool` SHALL not alter existing Tailwind utility class usage (e.g., `text-blue-600`, `bg-slate-900`) that is already resolved through the Tailwind config system.
4. WHEN `eslint` with `eslint-plugin-tailwindcss` is run on `frontend/src/components/` after the changes, THE `Refactoring_Tool` SHALL internally execute ESLint and fix any violations before completing, producing zero `no-custom-classname` violations for the modified style attributes.

---

### Requirement 9: Strict TypeScript Configuration Enforcement

**User Story:** As a developer, I want the TypeScript compiler configured to flag the most common sources of runtime type errors, so that future contributions cannot silently introduce untyped code.

#### Acceptance Criteria

1. THE `Refactoring_Tool` SHALL ensure `"strict": true` is present and not overridden in `frontend/tsconfig.json` and `backend/tsconfig.json`, both of which already satisfy this requirement and must not be weakened.
2. THE `Refactoring_Tool` SHALL add `"noUnusedLocals": true` to `frontend/tsconfig.json` if not already present.
3. THE `Refactoring_Tool` SHALL add `"noUnusedParameters": true` to `frontend/tsconfig.json` if not already present.
4. THE `Refactoring_Tool` SHALL add `"noUnusedLocals": true` to `backend/tsconfig.json` if not already present.
5. THE `Refactoring_Tool` SHALL add `"noUnusedParameters": true` to `backend/tsconfig.json` if not already present.
6. WHEN `tsc --noEmit` is run on the frontend and backend after adding the new flags, THE `Refactoring_Tool` SHALL resolve any compiler errors that actually exist as a result of the stricter settings before the changes are considered complete; IF no new errors exist, THEN no additional error-resolution step is required.

---

### Requirement 10: Centralize Shared Type Definitions (DRY)

**User Story:** As a developer, I want the duplicate interface declarations that exist in both `frontend/src/types/index.ts` and `backend/src/types/index.ts` to be documented as intentionally separate, so that future contributors understand the boundary and do not accidentally create cross-package type coupling.

#### Acceptance Criteria

1. THE `Refactoring_Tool` SHALL add a file-level JSDoc comment to `frontend/src/types/index.ts` stating that these types represent the frontend view model and must remain decoupled from the backend types package.
2. THE `Refactoring_Tool` SHALL add a file-level JSDoc comment to `backend/src/types/index.ts` stating that these types represent backend domain models and API contracts.
3. THE `Refactoring_Tool` SHALL ensure that the `VolunteerProfile` interface in `frontend/src/types/index.ts` does not include the `shiftStart` field (which is a backend-only concern present in `backend/src/types/index.ts`), confirming the boundary is correctly maintained.
4. THE `Refactoring_Tool` SHALL ensure that the `VolunteerProfile` interface in `backend/src/types/index.ts` retains the `shiftStart?: string` field as a backend domain concern.

---

### Requirement 11: Typed `CrowdDashboard` Chart Data

**User Story:** As a developer, I want the chart data structure in `CrowdDashboard.tsx` to use a named interface instead of an inline `Record<string, string | number>`, so that the type is self-documenting and reusable.

#### Acceptance Criteria

1. THE `Refactoring_Tool` SHALL add a `ChartDataPoint` interface to `frontend/src/types/index.ts` with a required `name: string` field and an index signature `[gate: string]: string | number` for the dynamic gate keys.
2. WHEN the `ChartDataPoint` interface from AC1 has been added, THE `Refactoring_Tool` SHALL update the `chartData` variable in `CrowdDashboard.tsx` to use `ChartDataPoint[]` instead of the inline `Record<string, string | number>[]` type.
3. WHEN `tsc --noEmit` is run on the frontend after the changes, THE `Refactoring_Tool` SHALL produce zero new type errors.

---

### Requirement 12: Strict ESLint Configuration for No-Console and No-Any Rules

**User Story:** As a developer, I want ESLint configured to flag `any` types and `console` statements in new code automatically, so that the quality improvements made by this refactoring are enforced going forward.

#### Acceptance Criteria

1. THE `Refactoring_Tool` SHALL add `"@typescript-eslint/no-explicit-any": "error"` to the `rules` block of `frontend/.eslintrc.json`.
2. THE `Refactoring_Tool` SHALL add `"no-console": ["error", { "allow": ["error"] }]` to the `rules` block of `frontend/.eslintrc.json`, permitting only `console.error` for legitimate error reporting.
3. THE `Refactoring_Tool` SHALL add `"@typescript-eslint/no-explicit-any": "error"` to the `rules` block of `backend/.eslintrc.json`.
4. WHEN `eslint --ext .ts,.tsx` is run on `frontend/src/` and `backend/src/` after the configuration changes and all code-level fixes from Requirements 1–11 are applied, THE `Refactoring_Tool` SHALL fail the build if any `@typescript-eslint/no-explicit-any` violations or disallowed `no-console` violations remain.
