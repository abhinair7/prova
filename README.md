# Prova.ai

> The trust and discovery layer for professional AI.
> Verified domain experts test models on their own real work — producing rankings that actually mean something.

Public benchmarks are in a credibility collapse (Llama 4 ranking scandal, the o3 / FrontierMath gap, endemic data contamination). Enterprise eval tools tell teams to build their own — which solves nothing for the 99% of professionals who just need to pick a model. **Prova is the consumer trust layer for vertical AI**, with a clear pivot to a verified-professional agent marketplace.

This repo contains both the **frontend** (Next.js 15 / React 19 / Tailwind) and the **backend** (FastAPI / Python 3.11+) for v1 of the platform.

---

## Table of contents

- [What's in the box](#whats-in-the-box)
- [Tech stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Quick start (frontend only)](#quick-start-frontend-only)
- [Full local setup (frontend + backend)](#full-local-setup-frontend--backend)
- [Docker (alternative)](#docker-alternative)
- [Project structure](#project-structure)
- [Routes & APIs](#routes--apis)
- [Data model](#data-model)
- [Architecture deep-dive](#architecture-deep-dive)
- [Roadmap](#roadmap)
- [License](#license)

---

## What's in the box

- **24 verticals** (Legal · Healthcare · Finance · Engineering · 20 more), each with its own leaderboard, evaluator pool, and Prova Composite Index (PCI).
- **127 benchmarked models** — frontier (Claude / GPT / Gemini / Llama / Mistral / Cohere) plus open-source and vertical specialists.
- **11 public benchmark adapters** (ARC AGI 2 · MMLU · GSM8K · HumanEval · SWE-Bench · TruthfulQA · GPQA Diamond · Terminal Bench 2 · Humanity's Last Exam · Browser Call · MCP Atlas) wired into a unified composite scorer.
- **5 modes of participation**: Mask & test · Synthesize & test · Vote on curated cases · **Browser sandbox · BYO key (real model calls direct from your browser, never via Prova)** · Enterprise tenant.
- **Task-deterministic scoring** — different tasks in the same vertical produce different rankings (hash of the query seeds per-(model, task) score perturbation).
- **Verified-professional sign-in flow** wired to a real waitlist API + JSON store (idempotent on email).
- **Shareable scorecards** at `/scorecard/[id]` with auto-generated **OG images** for LinkedIn previews.
- **Live profession counter** on the landing — real-time signups per vertical from the waitlist.
- **Agent marketplace seed** at `/agents` (the LinkedIn-for-AI-agents destination).

---

## Tech stack

### Frontend
- **Next.js 15.3** (App Router, Turbopack)
- **React 19**
- **Tailwind CSS 4**
- **Framer Motion** (page transitions)
- **lucide-react** (icons)
- **react-dropzone** (file upload)
- **next/og** (OG image generation via satori)

### Backend
- **FastAPI** + **Uvicorn**
- **Pydantic 2**
- **LangChain** + **LlamaIndex** (LLM orchestration & retrieval)
- **OpenAI · Anthropic · Google Gen AI · Mistral · Cohere** clients
- **sentence-transformers** + **FAISS** / **Chroma** (vector search)
- **Presidio** (PII masking)
- **Hugging Face datasets** (benchmark adapters)
- **Redis** (optional cache)

---

## Prerequisites

- **Node.js ≥ 20** and **npm ≥ 10** (frontend)
- **Python ≥ 3.11** (backend)
- **git**
- (Optional) **Docker & docker compose** for the all-in-one path
- (Optional) **Redis** for production-style caching

LLM API keys are only required if you want to run live evaluations against real models. The platform is fully usable without them — leaderboards are seeded with reference scores.

---

## Quick start (frontend only)

The frontend is fully functional standalone — leaderboards, verticals, sign-in/waitlist, scorecards, and OG previews all work without the backend running.

```bash
git clone https://github.com/<your-handle>/prova.git
cd prova/frontend
npm install
npm run dev
```

Open <http://localhost:3000>.

The waitlist persists to `frontend/data/waitlist.json` (created on first signup). Try:

1. Open `/profile` → fill the form → you're slot #1.
2. Click **Share my scorecard** → the page renders at `/scorecard/[your-id]`.
3. View the OG preview at `/api/og?id=[your-id]`.
4. Refresh the landing — the live counter shows your signup.

---

## Full local setup (frontend + backend)

### 1. Clone and bootstrap

```bash
git clone https://github.com/<your-handle>/prova.git
cd prova
```

### 2. Backend

```bash
cd backend
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env and set at minimum SECRET_KEY; LLM keys optional for v1
uvicorn main:app --reload --port 8000
```

Backend runs at <http://localhost:8000>. Interactive API docs at <http://localhost:8000/docs>.

### 3. Frontend (in a second terminal)

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at <http://localhost:3000>.

### 4. (Optional) Configure the frontend to call the backend

Create `frontend/.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

The frontend gracefully falls back to deterministic mock data when the backend isn't reachable, so this is only needed when you want live evaluations.

---

## Docker (alternative)

```bash
git clone https://github.com/<your-handle>/prova.git
cd prova
cp backend/.env.example backend/.env
# Edit backend/.env
docker compose up --build
```

- Frontend: <http://localhost:3000>
- Backend:  <http://localhost:8000>
- Redis:    `localhost:6379`

> Dockerfiles are not yet committed in v1 — `docker-compose.yml` references `Dockerfile.frontend` and `Dockerfile.backend` that are intended for production deployment. For local dev use the non-Docker path above.

---

## Project structure

```
prova/
├── frontend/                          # Next.js 15 App Router
│   ├── app/
│   │   ├── page.tsx                   # Landing
│   │   ├── benchmark/                 # Per-vertical leaderboard
│   │   ├── verticals/                 # All 24 verticals
│   │   ├── models/                    # All 127 models, filterable
│   │   ├── evaluate/                  # Test-on-your-work flow
│   │   ├── agents/                    # Agent marketplace
│   │   ├── profile/                   # Verified-pro sign-in + scorecard
│   │   ├── scorecard/[id]/            # Shareable per-user scorecard
│   │   └── api/
│   │       ├── waitlist/              # POST sign-up, GET counts
│   │       └── og/                    # OG image (next/og)
│   ├── components/
│   │   ├── landing/                   # Hero, WhyNow, LiveCounter, Verticals,
│   │   │                              # FeaturedLeaderboard, HowItWorks,
│   │   │                              # TrustEngine, Architecture, ViralityLoops,
│   │   │                              # CTASection, Navbar, Footer
│   │   └── ui/                        # GlowButton, GlassCard, Badge
│   ├── lib/
│   │   ├── data.ts                    # 24 verticals, 127 models, leaderboardFor()
│   │   ├── waitlist.ts                # JSON-backed waitlist (swap for DB)
│   │   └── utils.ts                   # cn(), scoreColor(), formatNumber()
│   └── data/
│       └── waitlist.json              # Runtime data (gitignored)
│
├── backend/                           # FastAPI
│   ├── main.py                        # App entry
│   ├── requirements.txt
│   ├── .env.example
│   └── app/
│       ├── config.py
│       ├── routers/
│       │   ├── benchmark.py           # /api/benchmark/*
│       │   ├── evaluate.py            # /api/evaluate/*
│       │   ├── meta.py                # /api/meta/* (catalog, why-prova)
│       │   └── pipeline.py            # /api/pipeline/* (RAG + reranking)
│       ├── benchmarks/                # 11 adapters + composite scorer
│       │   ├── adapters/              # arc_agi, mmlu, gsm8k, humaneval,
│       │   │                          # swebench, gpqa, hle, terminal_bench,
│       │   │                          # truthfulqa, browser_call, mcp_atlas
│       │   ├── base.py                # BenchmarkAdapter abstract class
│       │   ├── composite.py           # 14-dimension PCI calculator
│       │   ├── dimensions.py          # Dimension enum + weights
│       │   ├── meta_evaluator.py      # Run all adapters per model
│       │   ├── reference_scores.py    # Fallback when datasets aren't installed
│       │   └── registry.py            # Adapter discovery
│       ├── models/
│       │   └── runner.py              # Multi-LLM call wrapper
│       ├── pipeline/                  # PII masking, retrieval, reranking
│       └── schemas/                   # Pydantic models
│
└── docker-compose.yml
```

---

## Routes & APIs

### Frontend pages

| Route | Purpose |
|---|---|
| `/` | Landing — Hero, live counter, why-now, verticals, leaderboard, architecture |
| `/benchmark` | Per-vertical leaderboard with vertical tabs + filter |
| `/benchmark?vertical=finance` | Deep-link into a specific vertical |
| `/verticals` | All 24 verticals with group filter (Professional/Technical/Creative/Operational) |
| `/models` | All 127 models with type/provider/sort filters + search |
| `/evaluate` | Test-on-your-work with mode + slate selectors |
| `/agents` | Agent marketplace |
| `/profile` | Verified-professional sign-in + personal scorecard + agent feed |
| `/profile?signin=linkedin&vertical=legal` | Deep-linked sign-in pre-selected vertical |
| `/scorecard/[id]` | Shareable scorecard for a verified evaluator |

### Frontend API routes

| Method | Route | Purpose |
|---|---|---|
| `POST` | `/api/waitlist` | Sign up. Body: `{name, email, linkedinUrl?, verticalId, credential?}`. Idempotent on email. |
| `GET`  | `/api/waitlist/counts` | Returns `{total, byVertical}`. |
| `GET`  | `/api/og?id=<entryId>` | Generates a 1200×630 PNG for LinkedIn share previews. |

### Backend API routes (FastAPI)

| Method | Route | Purpose |
|---|---|---|
| `GET`  | `/api/meta/catalog` | List all 11 benchmark adapters with metadata. |
| `POST` | `/api/meta/evaluate` | Run all adapters for a single model → returns PCI breakdown. |
| `POST` | `/api/meta/compare` | Run all adapters for multiple models. |
| `GET`  | `/api/meta/why-prova` | Marketing endpoint explaining the 14-dimension composite. |
| `POST` | `/api/benchmark/run` | Run a single named benchmark on a model. |
| `POST` | `/api/evaluate/upload` | Upload a doc, run multi-model eval, get a scorecard. |
| `POST` | `/api/pipeline/rag` | RAG with PII masking → embedding → retrieval → reranking → answer. |

OpenAPI/Swagger docs at <http://localhost:8000/docs> when the backend is running.

---

## Data model

The frontend ships with deterministic seed data in `frontend/lib/data.ts`:

- **`verticals: Vertical[]`** — 24 entries, grouped Professional/Technical/Creative/Operational.
- **`models: ModelInfo[]`** — 127 entries (57 hand-defined frontier/specialist + 70 generated open-source).
- **`agents: Agent[]`** — 10 vertical-specialist agents seeded for the marketplace.
- **`leaderboardFor(verticalId)`** — produces a deterministic per-vertical leaderboard of top-14 models with seeded variation.

The waitlist is stored in `frontend/data/waitlist.json`. Each entry:
```json
{
  "id": "75b83955fb9d",
  "email": "maya@example.org",
  "name": "Dr. Maya Chen",
  "linkedinUrl": "https://www.linkedin.com/in/...",
  "verticalId": "healthcare",
  "credential": "NPI: 1234567890",
  "createdAt": "2026-04-29T22:00:00.000Z"
}
```

To swap to Postgres/Supabase later, replace the read/write helpers in `frontend/lib/waitlist.ts`. The API route and UI don't change.

---

## Architecture deep-dive

See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for the full system map: directory tree with annotations, every UI filter, every API node, and the data flow from sign-up → scorecard → share.

---

## Roadmap

### v1 (this repo)
- ✅ Landing + 5 trust/virality sections
- ✅ 24 verticals + 127 models + per-vertical leaderboards
- ✅ 5-mode evaluate flow
- ✅ Verified-professional sign-in + waitlist API + JSON store
- ✅ Shareable scorecards + OG images
- ✅ Live profession counter
- ✅ Agent marketplace seed

### v1.5 (next)
- [ ] Real **LinkedIn OAuth** (next-auth + LinkedIn provider)
- [ ] Replace waitlist JSON with **Postgres/Supabase**
- [ ] **Email confirmation** (Resend / Postmark)
- [ ] Per-vertical credential verification pipeline (NPI, Bar, FINRA CRD, CPA)
- [ ] Real backend integration on `/evaluate` (currently shows seeded results)

### v2 (post-launch)
- [ ] Desktop app — extends Browser sandbox to local-model inference (Ollama / WebLLM)
- [ ] Methodology audit (target: Big 4 attestation)
- [ ] Agent listing + certification flow
- [ ] Data-licensing API for AI labs
- [ ] Multi-language vertical support

---

## License

MIT — see [LICENSE](./LICENSE).
