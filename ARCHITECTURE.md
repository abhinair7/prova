# Prova.ai — Architecture

This document maps every node in the system: routes, components, APIs, data flow, and filters. It complements [`README.md`](./README.md) (which covers setup).

---

## 1. Top-level layout

```
prova/
├── frontend/                    Next.js 15 App Router · React 19 · Tailwind 4
├── backend/                     FastAPI · Python 3.11 · LangChain / LlamaIndex
├── docker-compose.yml           Frontend + backend + Redis (production-style)
├── README.md                    Setup + run docs
├── ARCHITECTURE.md              This file
└── LICENSE                      MIT
```

The frontend is fully usable standalone — leaderboards, sign-in, scorecards, OG images all work without the backend running.
The backend is independently deployable and exposes a typed API at `:8000/docs`.

---

## 2. The 8 layers of Prova

Prova is more than the 3-layer pitch (benchmark · runner · interpretation). The product surfaces these in code:

| L | Layer                            | Where it lives                                              |
|---|----------------------------------|-------------------------------------------------------------|
| 0 | Verified-professional identity   | `frontend/app/profile/`, `frontend/app/api/waitlist/`       |
| 1 | The benchmark (the moat)         | `backend/app/benchmarks/`, `frontend/lib/data.ts`           |
| 2 | The runner (commodity)           | `backend/app/models/runner.py`                              |
| 3 | The interpretation (consultative)| `frontend/app/scorecard/[id]/`, `backend/app/routers/meta.py` |
| 4 | Virality + community             | `frontend/components/landing/LiveCounter.tsx`, ViralityLoops, OG image route |
| 5 | Trust attestation                | `frontend/components/landing/TrustEngine.tsx`, WhyNow.tsx    |
| 6 | Agent marketplace (destination)  | `frontend/app/agents/`                                      |
| 7 | Data flywheel                    | (planned) anonymized aggregate signal → labs/buyers          |

---

## 3. Frontend — full directory map

```
frontend/
├── app/
│   ├── layout.tsx                Root layout, fonts, providers
│   ├── page.tsx                  Landing — composes 11 sections
│   ├── globals.css               Tailwind base + tokens
│   │
│   ├── benchmark/
│   │   └── page.tsx              Per-vertical leaderboard
│   │                             Filter inputs:
│   │                               • vertical tabs (24 verticals from data.ts)
│   │                               • text filter on model/provider/family
│   │                             Reads URL: ?vertical=<id>
│   │                             Calls leaderboardFor(verticalId) → 14 rows
│   │
│   ├── verticals/
│   │   └── page.tsx              All 24 verticals
│   │                             Filter inputs:
│   │                               • group: All | Professional | Technical | Creative | Operational
│   │                               • text search across name + description
│   │                             Each card → /benchmark?vertical=<id>
│   │
│   ├── models/
│   │   └── page.tsx              All 127 models, table view
│   │                             Filter inputs:
│   │                               • type: all | frontier | open | specialist
│   │                               • provider: dropdown of unique providers
│   │                               • sort: pci ↓ | name | released ↓
│   │                               • text search across name + provider + family
│   │
│   ├── evaluate/
│   │   └── page.tsx              Test-on-your-work flow
│   │                             Selectors:
│   │                               • Mode (5): vote | synthesize | mask | local | enterprise
│   │                               • Slate (4): Top 5 | Top 10 | Top 25 | All frontier
│   │                               • Vertical pills (24)
│   │                             States: upload → running → results
│   │                             Output: ResultCard list with model output snippets
│   │
│   ├── agents/
│   │   └── page.tsx              Agent marketplace seed (10 agents)
│   │
│   ├── profile/
│   │   └── page.tsx              Verified-pro sign-in + dashboard
│   │                             Sign-in form fields:
│   │                               • name
│   │                               • work email (validated)
│   │                               • LinkedIn URL (optional)
│   │                               • vertical (24 pills, deep-link via ?vertical=)
│   │                               • credential (per-vertical: NPI / Bar / CRD / NPN / CPA …)
│   │                             POSTs to /api/waitlist
│   │                             On success: VerifiedHeader + PersonalScorecard + AgentFeed
│   │                             Share buttons: Copy link, Post to LinkedIn
│   │
│   ├── scorecard/
│   │   └── [id]/page.tsx         Shareable per-user scorecard (server-rendered)
│   │                             Reads waitlist entry → renders top-5 leaderboard for their vertical
│   │                             Sets <meta property="og:image"> → /api/og?id=<id>
│   │                             Three CTAs: Post to LinkedIn · See full leaderboard · Get my own
│   │
│   └── api/                      Next.js Route Handlers
│       ├── waitlist/
│       │   ├── route.ts          POST — sign up (idempotent on email)
│       │   └── counts/route.ts   GET  — { total, byVertical }
│       └── og/
│           └── route.tsx         GET  — 1200×630 PNG via next/og
│
├── components/
│   ├── landing/                  Sections composed by app/page.tsx
│   │   ├── Navbar.tsx            Logo · 6 nav links · LinkedIn sign-in CTA · mobile menu
│   │   ├── Hero.tsx              Animated neural canvas · headline · pillars · CTA · mini-leaderboard
│   │   ├── Stats.tsx             127 models · 24 verticals · 142,891 evaluators · 99.4% PII
│   │   ├── LiveCounter.tsx       Polls /api/waitlist/counts every 30s; shows top-6 verticals + signups
│   │   ├── WhyNow.tsx            3 cards: Llama 4 scandal · o3/FrontierMath · contamination
│   │   ├── Verticals.tsx         12 vertical cards (preview); link to /verticals for all 24
│   │   ├── HowItWorks.tsx        Numbered steps walkthrough
│   │   ├── FeaturedLeaderboard.tsx
│   │   ├── TrustEngine.tsx       6 trust pillars: verification · rotation · CIs · no cherry-picking · hallucination · PII
│   │   ├── Architecture.tsx      The 8 layers of Prova
│   │   ├── ViralityLoops.tsx     4 loops: scorecard sharing · profession leagues · model release · lab citations
│   │   ├── CTASection.tsx
│   │   └── Footer.tsx
│   │
│   └── ui/
│       ├── GlowButton.tsx        Primary / secondary CTA with gradient glow
│       ├── GlassCard.tsx         Glassmorphic surface with hover glow
│       └── Badge.tsx             Pill-shaped status indicator
│
├── lib/
│   ├── data.ts                   24 verticals · 127 models · 10 agents · leaderboardFor()
│   ├── waitlist.ts               JSON-backed waitlist store (swap for Postgres/Supabase later)
│   └── utils.ts                  cn() · scoreColor() · formatNumber()
│
├── data/
│   └── waitlist.json             Runtime data (gitignored, created on first signup)
│
├── public/                       Static assets
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── postcss.config.mjs
└── package.json
```

---

## 4. Frontend filters — exhaustive

| Page | Filter | Options | Source |
|---|---|---|---|
| `/verticals` | Group     | All · Professional · Technical · Creative · Operational | hardcoded |
| `/verticals` | Text      | Free text on name + description | controlled input |
| `/models`    | Type      | all · frontier · open · specialist | hardcoded |
| `/models`    | Provider  | All providers (derived from `models[]`) | dynamic |
| `/models`    | Sort      | PCI ↓ · Name · Released ↓ | hardcoded |
| `/models`    | Text      | Free text on name + provider + family | controlled input |
| `/benchmark` | Vertical  | 24 vertical tabs | from `verticals[]` |
| `/benchmark` | Text      | Filter rows by model/provider | controlled input |
| `/evaluate`  | Mode      | Mask · Synthesize · Vote · Browser sandbox (BYO key) · Enterprise | hardcoded |
| `/evaluate`  | Slate     | Top 5 · Top 10 · Top 25 · All frontier (mock modes only) | hardcoded |
| `/evaluate`  | API key   | OpenAI / Anthropic / Google (sandbox mode only · localStorage · never POSTed) | localStorage |
| `/evaluate`  | Vertical  | 24 vertical pills | from `verticals[]` |
| `/profile`   | Vertical  | 24 vertical pills | from `verticals[]`, deep-linkable via `?vertical=` |
| `/profile`   | Credential| Per-vertical input (NPI / Bar / CRD / NPN / CPA …) | derived from vertical |

---

## 5. Backend — full directory map

```
backend/
├── main.py                       FastAPI app entry; mounts routers
├── requirements.txt
├── .env.example                  LLM keys · vector store · cache · secrets
├── data/
│   └── seeds/                    Seeded benchmark cases per vertical
└── app/
    ├── config.py                 Pydantic-Settings — env-driven config
    │
    ├── routers/                  HTTP surface
    │   ├── benchmark.py          POST /api/benchmark/run
    │   │                         POST /api/benchmark/list
    │   ├── evaluate.py           POST /api/evaluate/upload
    │   │                         POST /api/evaluate/text
    │   ├── meta.py               GET  /api/meta/catalog
    │   │                         POST /api/meta/evaluate     (single model PCI)
    │   │                         POST /api/meta/compare      (multi-model PCI)
    │   │                         GET  /api/meta/why-prova
    │   └── pipeline.py           POST /api/pipeline/rag      (PII → embed → retrieve → rerank → answer)
    │
    ├── benchmarks/               The composite scorer
    │   ├── __init__.py           Lazy __getattr__ exports (heavy imports deferred)
    │   ├── base.py               BenchmarkAdapter ABC; BenchmarkResult dataclass
    │   ├── dimensions.py         Dimension enum (14) + DEFAULT_PCI_WEIGHTS + VERTICAL_DIMENSION_BIAS
    │   ├── composite.py          compute_pci(); ProvaSignals; PCIBreakdown; Wilson math
    │   ├── reference_scores.py   Fallback reference table per (benchmark, model)
    │   ├── registry.py           Adapter discovery; list_benchmarks() / get_adapter() / all_adapters()
    │   ├── meta_evaluator.py     MetaEvaluator: orchestrates all adapters
    │   └── adapters/             11 benchmark adapters, all subclass BenchmarkAdapter
    │       ├── __init__.py
    │       ├── arc_agi.py        ARC AGI 2 — abstract reasoning
    │       ├── mmlu.py           MMLU — broad knowledge
    │       ├── gsm8k.py          GSM 8K — grade-school math
    │       ├── humaneval.py      HumanEval — code generation
    │       ├── swebench.py       SWE-Bench — real GitHub bug fixes
    │       ├── truthfulqa.py     TruthfulQA — hallucination + truthfulness
    │       ├── gpqa.py           GPQA Diamond — graduate physics/chem/bio
    │       ├── terminal_bench.py Terminal Bench 2 — long-horizon shell tasks
    │       ├── hle.py            Humanity's Last Exam — frontier reasoning
    │       ├── browser_call.py   Browser Call — web agent benchmark
    │       └── mcp_atlas.py      MCP Atlas — tool-use benchmark
    │
    ├── models/
    │   └── runner.py             ModelRunner — multi-provider LLM call wrapper
    │                             call_model(model_id, prompt, ...) → string
    │                             Providers: OpenAI · Anthropic · Google · Mistral · Cohere · HF
    │
    ├── pipeline/                 RAG pipeline
    │   ├── pii.py                Presidio-based NER masking
    │   ├── retrieval.py          FAISS / Chroma backends
    │   ├── reranker.py           Cross-encoder reranking
    │   └── answer.py             Final LLM call with retrieved context
    │
    └── schemas/                  Pydantic request/response models
```

---

## 6. The 14-dimension PCI

The Prova Composite Index reweights 11 public benchmark dimensions plus 3 Prova-exclusive dimensions, then de-rates by contamination risk.

```
Dimension                            Source                   Default weight
───────────────────────────────────────────────────────────────────────────
ABSTRACT_REASONING                   ARC AGI 2                0.04
BROAD_KNOWLEDGE                      MMLU                     0.04
ARITHMETIC_REASONING                 GSM 8K                   0.04
CODE_GENERATION                      HumanEval                0.04
SOFTWARE_ENGINEERING                 SWE-Bench                0.06
TRUTHFULNESS                         TruthfulQA               0.06
GRADUATE_SCIENCE                     GPQA Diamond             0.04
LONG_HORIZON_SHELL                   Terminal Bench 2         0.04
FRONTIER_REASONING                   Humanity's Last Exam     0.06
WEB_AGENT                            Browser Call             0.05
TOOL_USE                             MCP Atlas                0.04
PROFESSIONAL_VERIFIED  (Prova-only)  Verified-pro votes        0.20
REAL_WORK_GENERALIZATION (Prova-only)  Synthesize-mode evals  0.15
STATISTICAL_RIGOR      (Prova-only)  Wilson lower-bound on votes 0.10
                                                        ─────
                                                              1.00
```

Public benchmarks cap at 55% of weight. Prova-exclusive dimensions account for 45%. Per-vertical biases re-weight dimensions (e.g. `healthcare` bumps `TRUTHFULNESS` ×1.6, `engineering` bumps `SOFTWARE_ENGINEERING` ×1.8). Each adapter declares a `contamination_baseline`; the composite de-rates each dimension by `0.5 × contamination_risk`.

See `backend/app/benchmarks/composite.py` for the math.

---

## 7. Data flow — end-to-end signup → scorecard → share

```
                                  [ Visitor lands on / ]
                                            │
                          ┌─────────────────┼─────────────────┐
                          ▼                                   ▼
              [LiveCounter (client)]              [WhyNow + Verticals + ...]
                          │
                fetch /api/waitlist/counts
                          │
                          ▼
              { total, byVertical }
                          │
        Visitor clicks "Claim my slot" →  /profile?signin=linkedin&vertical=legal
                          │
                          ▼
                   [SignInGate form]
                          │
          name · email · LinkedInURL · verticalId · credential
                          │
                  POST /api/waitlist
                          │
                          ▼
   ┌────────────────────────────────────────────────────────────────┐
   │ lib/waitlist.ts → addEntry()                                   │
   │   ├─ readAll()      reads data/waitlist.json                   │
   │   ├─ idempotent on email (returns existing if duplicate)       │
   │   ├─ generates id (12 hex)                                     │
   │   ├─ writeAll()     persists                                   │
   │   └─ getPositionFor(id) → { position, verticalPosition, total }│
   └────────────────────────────────────────────────────────────────┘
                          │
                          ▼
           Response: { id, name, verticalId, position,
                       verticalPosition, total, shareUrl }
                          │
                          ▼
             Profile page renders dashboard:
             ├─ Position banner (#N overall, #N in vertical)
             ├─ VerifiedHeader (avatar, credential, verticals)
             ├─ PersonalScorecard (top 5 from leaderboardFor(verticalId))
             │    ├─ "Copy link" → clipboard write
             │    └─ "Post to LinkedIn" → linkedin.com/sharing/share-offsite/?url=<scorecard>
             └─ AgentFeed (vertical-matched agents from data.ts)
                          │
        User clicks "Share my scorecard" → /scorecard/<id>
                          │
                          ▼
             [Server-rendered scorecard page]
              ├─ generateMetadata() → fetches entry, sets <meta og:image="/api/og?id=<id>">
              ├─ getEntry(id), getPositionFor(id), leaderboardFor(verticalId)
              └─ Shareable card UI + CTAs
                          │
        LinkedIn crawler hits /scorecard/<id> → reads og:image
                          │
                          ▼
                  GET /api/og?id=<id>
                          │
                          ▼
   ┌────────────────────────────────────────────────────────────────┐
   │ next/og + satori                                               │
   │   └─ ImageResponse(<JSX>) → PNG 1200×630                       │
   │      Renders verified badge, name, top-3 leaderboard           │
   └────────────────────────────────────────────────────────────────┘
                          │
                          ▼
        LinkedIn renders rich card preview → click-through traffic
                          │
                          ▼
                 [ Visitor lands on / ]   ← Loop 1 closed
```

---

## 8. Filter & node summary table

| Surface         | Filters                                             | Backing data                    |
|-----------------|-----------------------------------------------------|---------------------------------|
| `/verticals`    | group, search                                       | `verticals[]` (24)              |
| `/models`       | type, provider, sort, search                        | `models[]` (127)                |
| `/benchmark`    | vertical, search                                    | `leaderboardFor(verticalId)`    |
| `/evaluate`     | mode (5), slate (4), vertical                       | `verticals[]` + `leaderboardFor`|
| `/profile`      | vertical, credential                                | `verticals[]` + `addEntry()`    |

| Node            | Type            | Purpose                                          |
|-----------------|-----------------|--------------------------------------------------|
| `Hero`          | client section  | Headline + animated canvas + 2 CTAs              |
| `Stats`         | server section  | 4 headline metrics                               |
| `LiveCounter`   | client section  | Polls counts every 30s; deep-links per vertical  |
| `WhyNow`        | client section  | 3 named events justifying timing                 |
| `Verticals`     | client section  | First 12 vertical cards                          |
| `FeaturedLeaderboard` | client section | Featured per-vertical scoreboard           |
| `HowItWorks`    | client section  | 3-step walkthrough                               |
| `TrustEngine`   | client section  | 6 trust pillars                                  |
| `Architecture`  | client section  | The 8 layers card grid                           |
| `ViralityLoops` | client section  | 4 growth loops                                   |
| `CTASection`    | client section  | Final conversion block                           |
| `Navbar`        | client          | 6 links + LinkedIn sign-in CTA                   |
| `SignInGate`    | client form     | POST /api/waitlist; sets profile state           |
| `VerifiedHeader`| client          | Avatar, credential, vertical pills, stats        |
| `PersonalScorecard` | client      | Top-5 board + Copy / Post to LinkedIn            |
| `AgentFeed`     | client          | Vertical-matched agents from `agents[]`          |
| `ResultCard`    | client          | Per-model output card on /evaluate               |
| `UploadZone`    | client          | react-dropzone wrapper                           |
| `RunningStep`   | client          | Live progress simulation                         |

---

## 9. How to extend

| Want to… | Edit |
|---|---|
| Add a vertical | `frontend/lib/data.ts` → push to `verticals[]` |
| Add a model | `frontend/lib/data.ts` → push to `models[]` (set `topVerticals`) |
| Add an agent | `frontend/lib/data.ts` → push to `agents[]` |
| Add a benchmark | `backend/app/benchmarks/adapters/` → subclass `BenchmarkAdapter`, register in `registry.py` |
| Tweak PCI weights | `backend/app/benchmarks/dimensions.py` |
| Re-bias a vertical | `VERTICAL_DIMENSION_BIAS` in `dimensions.py` |
| Swap waitlist storage | `frontend/lib/waitlist.ts` — replace `readAll/writeAll/addEntry/getEntry` |
| Add a new mode to evaluate | `frontend/app/evaluate/page.tsx` — append to `MODES` |
| Style the OG image | `frontend/app/api/og/route.tsx` |

---

## 10. Quick reference — file → owner

- **Brand voice / copy** → `frontend/components/landing/*.tsx`
- **Data shape** → `frontend/lib/data.ts`
- **Sign-in & waitlist** → `frontend/app/profile/page.tsx` + `frontend/app/api/waitlist/`
- **Scorecards & sharing** → `frontend/app/scorecard/[id]/page.tsx` + `frontend/app/api/og/route.tsx`
- **Composite scoring math** → `backend/app/benchmarks/composite.py`
- **Benchmark catalog** → `backend/app/benchmarks/registry.py`
- **LLM provider routing** → `backend/app/models/runner.py`
- **API surface** → `backend/app/routers/*.py`
- **Production infra** → `docker-compose.yml`
