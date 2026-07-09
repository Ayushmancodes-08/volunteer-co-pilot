🚀 I built Volunteer Co-Pilot for @PromptWars Virtual Challenge 4 — and I want to show you why GenAI reasoning changes the game for event operations.

FIFA World Cup 2026 will bring 50,000+ volunteers and millions of international fans into stadiums. Two problems keep operations teams up at night:

1️⃣ Gate crowding. In past World Cups, dangerous surges happened because ground-level volunteers couldn't see adjacent gate occupancy.

2️⃣ Language barriers. A single volunteer may face English, Spanish, Arabic, Hindi, and French speakers in the same shift — with no translator available.

My submission, **Volunteer Co-Pilot**, puts a GenAI reasoning engine in every volunteer's pocket. It's not just a dashboard with static rules — when a gate crosses 80% capacity, Claude (or GPT-4o-mini) analyzes the full gate map and recommends the *optimal* reroute with a plain-English justification: "Gate D is at 40% and 120m away, shortest safe reroute."

It also generates multilingual scripts in 7 languages, adjusts tone based on urgency, and includes a phonetic pronunciation guide so volunteers can speak the message aloud.

Built with Next.js 15 + Bun + Fastify + TailwindCSS. 29 tests, Zod validation, rate limiting, Helmet security headers, in-memory caching, and full keyboard/ARIA accessibility.

The persona choice is deliberate: volunteers aren't crowd managers or interpreters. They need tools that reduce cognitive load under pressure — not add to it.

🔗 Live demo & repo: [link]  
Want to try it? Just add an API key.

#PromptWars #GenAI #FIFAWorldCup #VolunteerCoPilot #FullStack #Hackathon