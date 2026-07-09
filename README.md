# Volunteer Co-Pilot

**A GenAI-powered dashboard for stadium volunteers during FIFA World Cup 2026**

## Persona

**Stadium volunteers** — the thousands of ground-level staff managing gates, directing crowds, and assisting international fans. They work under time pressure, without instant access to supervisors or translators.

## Problem

FIFA World Cup 2026 stadiums will face two acute operational challenges:

1. **Crowd congestion & safety** — Gate crowding incidents are well-documented at major events, causing delays, crushing hazards, and fan frustration. Volunteers have no real-time visibility into gate occupancy and must radio supervisors for rerouting instructions.
2. **Language barriers** — Fans arrive from 50+ nations. A volunteer who only speaks English cannot give a safety instruction to a Spanish-speaking family or direct an Arabic-speaking fan to the correct entrance.

**Volunteer Co-Pilot solves both** by putting a GenAI reasoning engine in every volunteer's pocket.

## Solution

### Core Features

| Feature | What it does | Operational pain point it solves |
|---|---|---|
| **Crowd Density Dashboard** | Live-updating view of 6+ gates with color-coded occupancy (green/yellow/red), refreshes every 5s | Volunteers can see which gates are filling up without radioing a supervisor |
| **Threshold Alerts + GenAI Reasoning** | When any gate crosses 80%, GenAI generates an action recommendation + plain-English justification | Static thresholds trigger sirens but don't tell you *what to do* — GenAI provides context-aware rerouting |
| **Multilingual Script Generator** | Select an intent (redirect, medical urgency, etc.) + target language (7 languages) — GenAI outputs translated text + phonetic guide | A volunteer doesn't need a translator app or a bilingual supervisor to communicate safely |
| **Voice Input** | Web Speech API captures spoken message, sends for translation, displays result — falls back gracefully to text input | Hands-free operation in loud, fast-moving environments |

### Architecture

```
volunteer-co-pilot/
├── frontend/           # Next.js 15 (App Router) + TailwindCSS v4 + Recharts
│   ├── src/
│   │   ├── app/        # Pages & layout
│   │   ├── components/ # React components (GateCard, Dashboard, Alerts, etc.)
│   │   ├── hooks/      # useCrowdData, useAlerts, useTranslation
│   │   ├── context/    # I18nContext (English + Spanish UI)
│   │   ├── utils/      # sanitize (XSS prevention)
│   │   └── i18n/       # JSON translation files
│   └── __tests__/      # Component tests (Vitest/Bun)
│
├── backend/            # Bun + Fastify 5 API server
│   ├── src/
│   │   ├── routes/     # Express-style route definitions
│   │   ├── controllers/# Request handlers (thin layer)
│   │   ├── services/   # Business logic (crowd, GenAI, cache)
│   │   ├── validators/ # Zod schemas for all API inputs
│   │   ├── plugins/    # Fastify plugins (rate limiter, error handler)
│   │   └── utils/      # Synthetic crowd data generator
│   └── __tests__/      # Unit + integration tests
```

### Data Flow

1. **Synthetic crowd sensor** runs in `backend/src/utils/crowdSimulator.js` — generates realistic occupancy data for 6 gates every 5 seconds.
2. **Frontend polls** `/api/crowd` every 5s and checks for threshold crossings (>=80%).
3. **When threshold crossed** → frontend POSTs to `/api/alerts/evaluate` → controller delegates to GenAI service → returns `{ gate, action, reasoning }`.
4. **Translation requests** → POST `/api/translate` with `{ text, targetLanguage, intent, urgent }` → cached in-memory with TTL → GenAI returns translated text + phonetic guide.

### Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Next.js 15 (App Router, static export), TailwindCSS v4, Recharts |
| Backend | Bun runtime, Fastify 5, Zod validation |
| GenAI | Anthropic Claude API (primary) / OpenAI fallback |
| Security | Helmet, CORS (scoped), rate limiting (100 req/min), input validation (Zod) |
| Testing | Bun test runner, React Testing Library, Supertest-style via Fastify `inject` |
| Cache | In-memory TTL cache for repeated translation requests (300s default) |

## Setup

### Prerequisites

- [Bun](https://bun.sh) v1.2+
- An Anthropic API key or OpenAI API key

### Clone & Install

```bash
git clone <repo-url>
cd volunteer-co-pilot

# Frontend
cd frontend
bun install
bun dev          # → http://localhost:3000

# Backend (separate terminal)
cd backend
cp .env.example .env
# Edit .env: add your API key
bun dev          # → http://localhost:4000
```

### Environment Variables (`backend/.env`)

```
ANTHROPIC_API_KEY=sk-...     # For Claude API
# or
OPENAI_API_KEY=sk-...           # For GPT-4o-mini
GENAI_PROVIDER=anthropic         # or "openai"
PORT=4000
CORS_ORIGIN=http://localhost:3000
CACHE_TTL=300
```

## Tests

```bash
# Run all backend tests (unit + integration)
cd backend
bun test

# Run all frontend tests
cd frontend
bun test
```

### What's tested

| Test file | Type | What it covers |
|---|---|---|
| `backend/__tests__/validators.test.js` | Unit | Zod schemas reject bad input (negative occupancy, missing fields, oversized payloads, invalid languages) |
| `backend/__tests__/alertController.test.js` | Unit | Threshold detection logic (>=80%), crowd data generation guarantees (6 gates, 0-100 range) |
| `backend/__tests__/genaiService.test.js` | Unit | JSON parsing with/without markdown fences, API key missing error, prompt construction with gate/occupancy/tone |
| `backend/__tests__/alerts.integration.test.js` | Integration | Full HTTP flow: invalid body → 400, missing gate → 400, GenAI unavailable → fallback response, crowd endpoint returns 6 gates |
| `frontend/__tests__/GateCard.test.jsx` | Component | Rendering correct status text (CRITICAL/WARNING/OK) for given occupancy, ARIA labels present |

## Why This Matters for FIFA World Cup 2026

### Real operational pain points (cited from event management literature):

**Gate crowding.** During the 2022 World Cup, several matches saw dangerous crowd surges at entry gates. Volunteers had no real-time visibility into adjacent gate occupancy. *Volunteer Co-Pilot's dashboard shows all 6 gates at a glance, and the GenAI reasoning layer recommends the *best* alternate gate — not just any gate.*

**Language barriers.** With fans from 30+ nations, a volunteer at a single gate may encounter English, Spanish, French, Hindi, Arabic, and Portuguese speakers within minutes. *The multilingual script generator gives them instant, context-appropriate phrases in 7 languages, with a phonetic guide so they can pronounce it correctly.*

**Volunteer overload.** Volunteers are not professional crowd managers or interpreters. They need tools that reduce cognitive load, not increase it. *The GenAI reasoning converts raw occupancy data into actionable instructions with plain-English justifications — "Gate D is at 40% and 120m away, shortest safe reroute" — so a volunteer can act confidently without waiting for a supervisor.*

## Security

- All API inputs validated with Zod schemas (rejects malformed/negative/oversized payloads)
- CORS scoped to frontend origin (no wildcard)
- Helmet security headers set on all responses
- Rate-limited to 100 requests/minute
- React auto-escapes all text content (XSS prevention)
- Environment variables for all secrets, `.env` gitignored

## Accessibility

- Semantic HTML with proper landmarks (`<header>`, `<main>`, `<section>`, `<nav>`)
- ARIA labels on all interactive elements and live-updating regions (`aria-live="polite"` on alerts panel)
- Status paired with icon + text label (color is never the only signal — a red badge also says "CRITICAL")
- Full keyboard navigability (focus rings, no mouse-only interactions)
- Responsive grid layout (1 column on phone, 2 on tablet, 3 on desktop)
- Language toggle for entire UI (English + Spanish)

## Deployment

This project is designed for independent deployment:

- **Frontend**: Vercel (import the `/frontend` directory, set `NEXT_PUBLIC_API_URL` env var)
- **Backend**: Render or Railway (import the `/backend` directory, set all env vars from `.env.example`)

See [deployment checklist](DEPLOYMENT.md) for step-by-step instructions.