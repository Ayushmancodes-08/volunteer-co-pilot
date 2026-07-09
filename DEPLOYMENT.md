# Deployment Checklist

## Frontend (Vercel)

1. Push the repository to GitHub
2. Go to [vercel.com](https://vercel.com) → Import repository
3. Set Root Directory: `frontend`
4. Framework Preset: Next.js (auto-detected)
5. Environment Variables:
   - `NEXT_PUBLIC_API_URL` = URL of your deployed backend (e.g., `https://volunteer-co-pilot-api.onrender.com`)
6. Build Command: `next build` (default)
7. Output: Static export (configured in `next.config.js`)
8. Deploy

## Backend (Render)

1. Go to [render.com](https://render.com) → New Web Service
2. Connect your GitHub repo
3. Set Root Directory: `backend`
4. Runtime: Node (Render auto-detects `package.json`)
5. Build Command: `bun install`
6. Start Command: `bun src/app.js`
7. Environment Variables (all required):

| Variable | Example | Notes |
|---|---|---|
| `ANTHROPIC_API_KEY` | `sk-ant-...` | Or `OPENAI_API_KEY` |
| `GENAI_PROVIDER` | `anthropic` | or `openai` |
| `PORT` | `4000` | Render sets this automatically |
| `CORS_ORIGIN` | `https://your-app.vercel.app` | Exact frontend URL, not wildcard |
| `CACHE_TTL` | `300` | In-memory cache TTL in seconds |

8. Deploy

## After Deployment

- [ ] Backend health check: visit `https://your-backend.onrender.com/api/health`
- [ ] Frontend loads and shows 6 gate cards
- [ ] Translation: test a message through the Multilingual Script Generator
- [ ] Alerts: verify that crossing 80% threshold triggers a GenAI recommendation
- [ ] Confirm CORS works (no console errors)

## Alternative: Railway

Railway supports Bun natively. Steps are similar to Render with:
- Build: `bun install`
- Start: `bun src/app.js`
- Health checks path: `/api/health`