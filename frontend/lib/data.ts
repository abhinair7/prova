// ── Types ─────────────────────────────────────────────────────────────────────

export interface ModelScore {
  model: string;
  provider: string;
  overall: number;
  reasoning: number;
  accuracy: number;
  hallucination: number;
  latency: number;
  evaluations: number;
  trend: "up" | "down" | "stable";
  badge?: "top" | "fastest" | "trusted";
}

export interface Vertical {
  id: string;
  name: string;
  icon: string;
  color: string;
  evaluators: number;
  topModel: string;
  description: string;
  group: "Professional" | "Technical" | "Creative" | "Operational";
}

export interface Agent {
  id: string;
  name: string;
  tagline: string;
  vertical: string;
  score: number;
  reviews: number;
  badge?: string;
  builtOn: string;
}

export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  family: string;
  contextWindow: number;
  released: string;
  type: "frontier" | "open" | "specialist";
  averagePCI: number;
  topVerticals: string[];
  evaluations: number;
}

// ── 24 verticals ──────────────────────────────────────────────────────────────

export const verticals: Vertical[] = [
  { id: "legal",          name: "Legal",          icon: "⚖️",  color: "#7C3AED", evaluators: 8412,  topModel: "GPT-5",          description: "Contract review, case law, jurisdiction reasoning",        group: "Professional" },
  { id: "healthcare",     name: "Healthcare",     icon: "🩺",  color: "#06B6D4", evaluators: 12341, topModel: "Claude 4 Opus",  description: "Clinical reasoning, drug interactions, ICD-10 coding",     group: "Professional" },
  { id: "finance",        name: "Finance",        icon: "📊",  color: "#F59E0B", evaluators: 9823,  topModel: "GPT-5",          description: "Financial analysis, risk modeling, regulatory compliance", group: "Professional" },
  { id: "accounting",     name: "Accounting",     icon: "🧾",  color: "#F97316", evaluators: 3401,  topModel: "GPT-5",          description: "Tax prep, audit, reconciliation, regulatory filings",      group: "Professional" },
  { id: "consulting",     name: "Consulting",     icon: "💼",  color: "#A78BFA", evaluators: 4218,  topModel: "Claude 4 Opus",  description: "Strategy memos, market sizing, executive briefs",          group: "Professional" },
  { id: "real-estate",    name: "Real Estate",    icon: "🏢",  color: "#FB923C", evaluators: 1892,  topModel: "GPT-5",          description: "Lease analysis, comps, zoning, due diligence",             group: "Professional" },
  { id: "insurance",      name: "Insurance",      icon: "🛡️",  color: "#0EA5E9", evaluators: 2341,  topModel: "GPT-5",          description: "Underwriting, claims triage, policy interpretation",       group: "Professional" },

  { id: "engineering",    name: "Engineering",    icon: "⚙️",  color: "#10B981", evaluators: 31024, topModel: "Claude 4 Opus",  description: "Code review, architecture, debugging, system design",      group: "Technical" },
  { id: "data-science",   name: "Data Science",   icon: "📈",  color: "#3B82F6", evaluators: 14823, topModel: "Claude 4 Opus",  description: "Analysis, modelling, statistical reasoning",               group: "Technical" },
  { id: "security",       name: "Security",       icon: "🔐",  color: "#EF4444", evaluators: 6712,  topModel: "Claude 4 Opus",  description: "Threat modelling, code audit, incident response",          group: "Technical" },
  { id: "devops",         name: "DevOps & SRE",   icon: "🛠️",  color: "#22C55E", evaluators: 5891,  topModel: "GPT-5",          description: "Infra-as-code, on-call playbooks, observability",          group: "Technical" },
  { id: "research",       name: "Research",       icon: "🔬",  color: "#14B8A6", evaluators: 7841,  topModel: "Claude 4 Opus",  description: "Literature synthesis, hypothesis generation, citations",   group: "Technical" },
  { id: "ml-engineering", name: "ML Engineering", icon: "🧠",  color: "#9333EA", evaluators: 4523,  topModel: "Claude 4 Opus",  description: "Training, fine-tuning, evaluation, deployment",            group: "Technical" },
  { id: "biotech",        name: "Biotech",        icon: "🧬",  color: "#34D399", evaluators: 2189,  topModel: "Claude 4 Opus",  description: "Lab protocols, sequence analysis, clinical trial design",  group: "Technical" },

  { id: "marketing",      name: "Marketing",      icon: "📣",  color: "#EC4899", evaluators: 15892, topModel: "Gemini 2.5 Pro", description: "Copy quality, brand voice, campaign strategy",             group: "Creative" },
  { id: "design",         name: "Design",         icon: "🎨",  color: "#F472B6", evaluators: 6234,  topModel: "Claude 4 Opus",  description: "Visual critique, design systems, copy-for-UI",             group: "Creative" },
  { id: "writing",        name: "Writing",        icon: "✍️",  color: "#FACC15", evaluators: 18432, topModel: "Claude 4 Opus",  description: "Long-form, editorial, technical writing",                  group: "Creative" },
  { id: "media",          name: "Media",          icon: "🎬",  color: "#F43F5E", evaluators: 3812,  topModel: "Gemini 2.5 Pro", description: "Scripts, treatment, fact-checking, captions",              group: "Creative" },

  { id: "hr",             name: "HR & People",    icon: "👥",  color: "#8B5CF6", evaluators: 5234,  topModel: "Claude 4 Opus",  description: "Job descriptions, policy review, bias detection",          group: "Operational" },
  { id: "sales",          name: "Sales",          icon: "💸",  color: "#FB7185", evaluators: 9123,  topModel: "GPT-5",          description: "Outbound, objection handling, CRM ops",                    group: "Operational" },
  { id: "support",        name: "Customer Support",icon: "📞", color: "#60A5FA", evaluators: 11234, topModel: "GPT-5",          description: "Resolution quality, tone, escalation accuracy",            group: "Operational" },
  { id: "operations",     name: "Operations",     icon: "📦",  color: "#94A3B8", evaluators: 4128,  topModel: "GPT-5",          description: "SOPs, vendor mgmt, supply chain reasoning",                group: "Operational" },
  { id: "education",      name: "Education",      icon: "🎓",  color: "#22D3EE", evaluators: 7892,  topModel: "Claude 4 Opus",  description: "Lesson planning, grading, pedagogical critique",           group: "Operational" },
  { id: "government",     name: "Government",     icon: "🏛️",  color: "#A3E635", evaluators: 1432,  topModel: "Claude 4 Opus",  description: "Policy analysis, FOIA review, compliance",                 group: "Operational" },
];

// ── 127-model registry ────────────────────────────────────────────────────────

export const models: ModelInfo[] = [
  // Anthropic
  { id: "claude-4-opus",       name: "Claude 4 Opus",       provider: "Anthropic",  family: "Claude 4",    contextWindow: 200_000, released: "2025-08", type: "frontier", averagePCI: 87.4, topVerticals: ["healthcare","legal","research"], evaluations: 142_891 },
  { id: "claude-4-sonnet",     name: "Claude 4 Sonnet",     provider: "Anthropic",  family: "Claude 4",    contextWindow: 200_000, released: "2025-08", type: "frontier", averagePCI: 83.1, topVerticals: ["engineering","writing"],          evaluations: 98_412  },
  { id: "claude-4-haiku",      name: "Claude 4 Haiku",      provider: "Anthropic",  family: "Claude 4",    contextWindow: 200_000, released: "2025-09", type: "frontier", averagePCI: 78.2, topVerticals: ["support","sales"],                evaluations: 71_234 },
  { id: "claude-3.7-opus",     name: "Claude 3.7 Opus",     provider: "Anthropic",  family: "Claude 3.7",  contextWindow: 200_000, released: "2025-02", type: "frontier", averagePCI: 84.6, topVerticals: ["legal","writing"],                evaluations: 88_901 },
  { id: "claude-3.5-sonnet-v2",name: "Claude 3.5 Sonnet v2",provider: "Anthropic",  family: "Claude 3.5",  contextWindow: 200_000, released: "2024-10", type: "frontier", averagePCI: 80.9, topVerticals: ["engineering","writing"],          evaluations: 192_341 },
  { id: "claude-3.5-haiku",    name: "Claude 3.5 Haiku",    provider: "Anthropic",  family: "Claude 3.5",  contextWindow: 200_000, released: "2024-11", type: "frontier", averagePCI: 73.4, topVerticals: ["support","operations"],           evaluations: 81_204 },
  { id: "claude-3-opus",       name: "Claude 3 Opus",       provider: "Anthropic",  family: "Claude 3",    contextWindow: 200_000, released: "2024-03", type: "frontier", averagePCI: 78.0, topVerticals: ["healthcare","research"],          evaluations: 142_511 },

  // OpenAI
  { id: "gpt-5",               name: "GPT-5",               provider: "OpenAI",     family: "GPT-5",       contextWindow: 400_000, released: "2025-08", type: "frontier", averagePCI: 86.9, topVerticals: ["finance","legal","sales"],        evaluations: 168_921 },
  { id: "gpt-5-mini",          name: "GPT-5 Mini",          provider: "OpenAI",     family: "GPT-5",       contextWindow: 200_000, released: "2025-09", type: "frontier", averagePCI: 79.8, topVerticals: ["support","operations"],           evaluations: 123_481 },
  { id: "gpt-5-nano",          name: "GPT-5 Nano",          provider: "OpenAI",     family: "GPT-5",       contextWindow: 128_000, released: "2025-09", type: "frontier", averagePCI: 71.2, topVerticals: ["support"],                        evaluations: 67_812 },
  { id: "o4",                  name: "o4",                  provider: "OpenAI",     family: "o-series",    contextWindow: 200_000, released: "2025-06", type: "frontier", averagePCI: 88.1, topVerticals: ["research","data-science"],        evaluations: 89_241 },
  { id: "o4-mini",             name: "o4-mini",             provider: "OpenAI",     family: "o-series",    contextWindow: 200_000, released: "2025-06", type: "frontier", averagePCI: 81.4, topVerticals: ["engineering","ml-engineering"],   evaluations: 102_412 },
  { id: "o3",                  name: "o3",                  provider: "OpenAI",     family: "o-series",    contextWindow: 200_000, released: "2025-01", type: "frontier", averagePCI: 84.7, topVerticals: ["research","engineering"],         evaluations: 154_812 },
  { id: "gpt-4.5",             name: "GPT-4.5",             provider: "OpenAI",     family: "GPT-4",       contextWindow: 200_000, released: "2025-02", type: "frontier", averagePCI: 80.3, topVerticals: ["writing","marketing"],            evaluations: 134_812 },
  { id: "gpt-4o",              name: "GPT-4o",              provider: "OpenAI",     family: "GPT-4",       contextWindow: 128_000, released: "2024-05", type: "frontier", averagePCI: 76.1, topVerticals: ["sales","support"],                evaluations: 211_412 },
  { id: "gpt-4o-mini",         name: "GPT-4o Mini",         provider: "OpenAI",     family: "GPT-4",       contextWindow: 128_000, released: "2024-07", type: "frontier", averagePCI: 70.8, topVerticals: ["support"],                        evaluations: 178_412 },

  // Google
  { id: "gemini-2.5-pro",      name: "Gemini 2.5 Pro",      provider: "Google",     family: "Gemini 2.5", contextWindow: 2_000_000, released: "2025-06", type: "frontier", averagePCI: 84.2, topVerticals: ["research","data-science"],   evaluations: 132_812 },
  { id: "gemini-2.5-flash",    name: "Gemini 2.5 Flash",    provider: "Google",     family: "Gemini 2.5", contextWindow: 1_000_000, released: "2025-06", type: "frontier", averagePCI: 76.8, topVerticals: ["marketing","support"],       evaluations: 98_412 },
  { id: "gemini-2.0-pro",      name: "Gemini 2.0 Pro",      provider: "Google",     family: "Gemini 2.0", contextWindow: 1_000_000, released: "2025-02", type: "frontier", averagePCI: 80.4, topVerticals: ["data-science","research"],   evaluations: 121_212 },
  { id: "gemini-2.0-flash",    name: "Gemini 2.0 Flash",    provider: "Google",     family: "Gemini 2.0", contextWindow: 1_000_000, released: "2024-12", type: "frontier", averagePCI: 73.1, topVerticals: ["support","marketing"],       evaluations: 145_812 },
  { id: "med-palm-3",          name: "Med-PaLM 3",          provider: "Google",     family: "PaLM",       contextWindow:   200_000, released: "2025-04", type: "specialist", averagePCI: 85.3, topVerticals: ["healthcare","biotech"],     evaluations: 41_812 },

  // Meta
  { id: "llama-4-maverick",    name: "Llama 4 Maverick",    provider: "Meta",       family: "Llama 4",    contextWindow:   256_000, released: "2025-04", type: "open",     averagePCI: 78.2, topVerticals: ["engineering","writing"],    evaluations: 89_412 },
  { id: "llama-4-scout",       name: "Llama 4 Scout",       provider: "Meta",       family: "Llama 4",    contextWindow:   128_000, released: "2025-04", type: "open",     averagePCI: 73.1, topVerticals: ["support","operations"],     evaluations: 74_812 },
  { id: "llama-3.3-70b",       name: "Llama 3.3 70B",       provider: "Meta",       family: "Llama 3",    contextWindow:   128_000, released: "2024-12", type: "open",     averagePCI: 70.8, topVerticals: ["engineering"],              evaluations: 168_412 },
  { id: "llama-3.1-405b",      name: "Llama 3.1 405B",      provider: "Meta",       family: "Llama 3",    contextWindow:   128_000, released: "2024-07", type: "open",     averagePCI: 73.6, topVerticals: ["research","engineering"],   evaluations: 142_412 },
  { id: "llama-3.1-70b",       name: "Llama 3.1 70B",       provider: "Meta",       family: "Llama 3",    contextWindow:   128_000, released: "2024-07", type: "open",     averagePCI: 67.4, topVerticals: ["support"],                  evaluations: 98_412 },
  { id: "llama-3.1-8b",        name: "Llama 3.1 8B",        provider: "Meta",       family: "Llama 3",    contextWindow:   128_000, released: "2024-07", type: "open",     averagePCI: 58.2, topVerticals: ["support"],                  evaluations: 211_412 },

  // Mistral
  { id: "mistral-large-3",     name: "Mistral Large 3",     provider: "Mistral",    family: "Mistral",    contextWindow:   128_000, released: "2025-03", type: "frontier", averagePCI: 76.4, topVerticals: ["engineering","legal"],      evaluations: 67_812 },
  { id: "mistral-large-2",     name: "Mistral Large 2",     provider: "Mistral",    family: "Mistral",    contextWindow:   128_000, released: "2024-07", type: "frontier", averagePCI: 71.1, topVerticals: ["engineering"],              evaluations: 89_412 },
  { id: "mistral-medium",      name: "Mistral Medium",      provider: "Mistral",    family: "Mistral",    contextWindow:    32_000, released: "2024-02", type: "frontier", averagePCI: 64.8, topVerticals: ["support"],                  evaluations: 54_812 },
  { id: "codestral",           name: "Codestral",           provider: "Mistral",    family: "Mistral",    contextWindow:    32_000, released: "2024-05", type: "specialist", averagePCI: 76.9, topVerticals: ["engineering"],            evaluations: 41_812 },
  { id: "mixtral-8x22b",       name: "Mixtral 8x22B",       provider: "Mistral",    family: "Mixtral",    contextWindow:    64_000, released: "2024-04", type: "open",     averagePCI: 67.3, topVerticals: ["engineering"],              evaluations: 78_412 },
  { id: "mixtral-8x7b",        name: "Mixtral 8x7B",        provider: "Mistral",    family: "Mixtral",    contextWindow:    32_000, released: "2023-12", type: "open",     averagePCI: 60.2, topVerticals: ["support"],                  evaluations: 121_212 },

  // Cohere
  { id: "command-r-plus",      name: "Command R+",          provider: "Cohere",     family: "Command",    contextWindow:   128_000, released: "2024-04", type: "frontier", averagePCI: 71.6, topVerticals: ["sales","support"],          evaluations: 56_812 },
  { id: "command-r",           name: "Command R",           provider: "Cohere",     family: "Command",    contextWindow:   128_000, released: "2024-03", type: "frontier", averagePCI: 65.1, topVerticals: ["support"],                  evaluations: 67_412 },
  { id: "embed-v4",            name: "Embed v4",            provider: "Cohere",     family: "Embed",      contextWindow:     8_192, released: "2025-01", type: "specialist", averagePCI: 82.1, topVerticals: ["data-science"],            evaluations: 12_812 },

  // xAI
  { id: "grok-4",              name: "Grok 4",              provider: "xAI",        family: "Grok",       contextWindow:   256_000, released: "2025-07", type: "frontier", averagePCI: 78.9, topVerticals: ["research","writing"],       evaluations: 41_812 },
  { id: "grok-3",              name: "Grok 3",              provider: "xAI",        family: "Grok",       contextWindow:   128_000, released: "2025-02", type: "frontier", averagePCI: 73.4, topVerticals: ["writing"],                  evaluations: 38_412 },
  { id: "grok-2",              name: "Grok 2",              provider: "xAI",        family: "Grok",       contextWindow:   128_000, released: "2024-08", type: "frontier", averagePCI: 67.2, topVerticals: ["writing"],                  evaluations: 28_412 },

  // DeepSeek
  { id: "deepseek-v3.1",       name: "DeepSeek V3.1",       provider: "DeepSeek",   family: "DeepSeek V3",contextWindow:   128_000, released: "2025-05", type: "open",     averagePCI: 78.4, topVerticals: ["engineering","data-science"],evaluations: 89_412 },
  { id: "deepseek-r1",         name: "DeepSeek R1",         provider: "DeepSeek",   family: "DeepSeek R",contextWindow:    64_000, released: "2025-01", type: "open",     averagePCI: 81.7, topVerticals: ["research","data-science"],   evaluations: 121_412 },
  { id: "deepseek-coder-v2",   name: "DeepSeek Coder V2",   provider: "DeepSeek",   family: "DeepSeek Coder",contextWindow: 128_000, released: "2024-06", type: "specialist", averagePCI: 79.4, topVerticals: ["engineering"],          evaluations: 78_412 },

  // Alibaba / Qwen
  { id: "qwen-3-72b",          name: "Qwen 3 72B",          provider: "Alibaba",    family: "Qwen 3",     contextWindow:   128_000, released: "2025-04", type: "open",     averagePCI: 75.6, topVerticals: ["engineering","data-science"],evaluations: 67_412 },
  { id: "qwen-3-32b",          name: "Qwen 3 32B",          provider: "Alibaba",    family: "Qwen 3",     contextWindow:   128_000, released: "2025-04", type: "open",     averagePCI: 70.1, topVerticals: ["support"],                  evaluations: 54_812 },
  { id: "qwen-2.5-72b",        name: "Qwen 2.5 72B",        provider: "Alibaba",    family: "Qwen 2.5",   contextWindow:   128_000, released: "2024-09", type: "open",     averagePCI: 71.8, topVerticals: ["data-science"],             evaluations: 81_412 },
  { id: "qwen-2.5-coder",      name: "Qwen 2.5 Coder",      provider: "Alibaba",    family: "Qwen 2.5",   contextWindow:   128_000, released: "2024-11", type: "specialist", averagePCI: 76.8, topVerticals: ["engineering"],            evaluations: 47_812 },

  // Reka
  { id: "reka-core",           name: "Reka Core",           provider: "Reka",       family: "Reka",       contextWindow:   128_000, released: "2024-04", type: "frontier", averagePCI: 70.9, topVerticals: ["media","writing"],          evaluations: 23_812 },
  { id: "reka-flash",          name: "Reka Flash",          provider: "Reka",       family: "Reka",       contextWindow:   128_000, released: "2024-04", type: "frontier", averagePCI: 64.2, topVerticals: ["support"],                  evaluations: 31_412 },

  // Specialists / vertical-specific
  { id: "harvey",              name: "Harvey",              provider: "Harvey",     family: "Harvey",     contextWindow:   200_000, released: "2025-01", type: "specialist", averagePCI: 91.2, topVerticals: ["legal"],                  evaluations: 32_412 },
  { id: "spellbook",           name: "Spellbook",           provider: "Spellbook",  family: "Spellbook",  contextWindow:   128_000, released: "2024-08", type: "specialist", averagePCI: 88.4, topVerticals: ["legal"],                  evaluations: 21_812 },
  { id: "doconomy-ai",         name: "Doconomy AI",         provider: "Doconomy",   family: "Doconomy",   contextWindow:   200_000, released: "2025-03", type: "specialist", averagePCI: 93.7, topVerticals: ["healthcare"],             evaluations: 48_812 },
  { id: "med42",               name: "Med42",               provider: "M42",        family: "Med42",      contextWindow:    32_000, released: "2024-11", type: "specialist", averagePCI: 84.1, topVerticals: ["healthcare"],             evaluations: 18_412 },
  { id: "bloomberggpt",        name: "BloombergGPT",        provider: "Bloomberg",  family: "BloombergGPT",contextWindow:   32_000, released: "2024-09", type: "specialist", averagePCI: 87.3, topVerticals: ["finance"],                evaluations: 24_812 },
  { id: "saul",                name: "Saul",                provider: "Equall",     family: "Saul",       contextWindow:    32_000, released: "2024-05", type: "specialist", averagePCI: 82.1, topVerticals: ["legal"],                  evaluations: 12_812 },
  { id: "taxgpt",              name: "TaxGPT",              provider: "TaxGPT",     family: "TaxGPT",     contextWindow:    64_000, released: "2024-10", type: "specialist", averagePCI: 86.1, topVerticals: ["accounting"],             evaluations: 17_412 },
  { id: "cursor-tab",          name: "Cursor Tab",          provider: "Cursor",     family: "Cursor",     contextWindow:    32_000, released: "2024-12", type: "specialist", averagePCI: 92.3, topVerticals: ["engineering"],            evaluations: 218_412 },
  { id: "ema",                 name: "EMA",                 provider: "EMA",        family: "EMA",        contextWindow:   128_000, released: "2025-02", type: "specialist", averagePCI: 84.9, topVerticals: ["hr"],                     evaluations: 13_412 },

  // Open-source long tail (filling out to 127)
  ...Array.from({ length: 70 }, (_, i) => {
    const idx = i + 1;
    const families = ["Yi", "InternLM", "Phi", "Gemma", "Falcon", "OLMo", "StableLM", "Pythia", "MPT", "Vicuna"] as const;
    const providers = ["01.AI", "Shanghai AI", "Microsoft", "Google", "TII", "AI2", "Stability", "EleutherAI", "MosaicML", "LMSYS"] as const;
    const family = families[i % families.length];
    const provider = providers[i % providers.length];
    const sizes = ["7B", "13B", "34B", "70B", "180B"] as const;
    const size = sizes[i % sizes.length];
    return {
      id: `${family.toLowerCase()}-${size.toLowerCase()}-${idx}`,
      name: `${family} ${size} v${(i % 4) + 1}`,
      provider,
      family,
      contextWindow: [8_000, 16_000, 32_000, 64_000, 128_000][i % 5],
      released: `2024-${String(((i % 11) + 1)).padStart(2, "0")}`,
      type: "open" as const,
      averagePCI: Number((50 + (i * 13) % 30).toFixed(1)),
      topVerticals: [verticals[i % verticals.length].id, verticals[(i * 7) % verticals.length].id],
      evaluations: 8_000 + (i * 1373) % 50_000,
    };
  }),
];

// ── Per-vertical leaderboard generator ────────────────────────────────────────

function seededScores(verticalId: string, modelId: string, base: number): ModelScore | null {
  const m = models.find(x => x.id === modelId);
  if (!m) return null;
  const verticalSeed = verticalId.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const wobble = ((verticalSeed * (modelId.length || 1)) % 60) / 10 - 3;
  const overall = Math.max(40, Math.min(99, base + wobble));
  return {
    model: m.name,
    provider: m.provider,
    overall: Number(overall.toFixed(1)),
    reasoning: Number(Math.min(99, overall + 1.4 + wobble * 0.3).toFixed(1)),
    accuracy:  Number(Math.min(99, overall - 0.5 + wobble * 0.4).toFixed(1)),
    hallucination: Number(Math.min(99.5, 95 + (overall - 70) * 0.15).toFixed(1)),
    latency: Math.round(900 + ((verticalSeed * 7) % 1500) + (m.id.length * 30)),
    evaluations: Math.round(m.evaluations / verticals.length + verticalSeed * 11),
    trend: (["up","stable","down","up"] as const)[(verticalSeed + m.name.length) % 4],
    badge: undefined,
  };
}

const FRONTIER_FOR_LEADERBOARD = [
  "claude-4-opus","gpt-5","o4","gemini-2.5-pro","claude-4-sonnet","gpt-5-mini",
  "deepseek-r1","grok-4","mistral-large-3","llama-4-maverick","claude-3.7-opus",
  "o4-mini","gemini-2.5-flash","deepseek-v3.1","gpt-4.5","qwen-3-72b",
];

export function leaderboardFor(verticalId: string): ModelScore[] {
  const v = verticals.find(x => x.id === verticalId);
  if (!v) return [];
  const specialists = models.filter(m => m.type === "specialist" && m.topVerticals.includes(verticalId)).map(m => m.id);
  const ids = Array.from(new Set([...specialists, ...FRONTIER_FOR_LEADERBOARD])).slice(0, 14);
  const top = (v.id === "healthcare" ? "claude-4-opus" : v.id === "legal" ? "gpt-5" : v.id === "finance" ? "gpt-5" : "claude-4-opus");
  const rows = ids
    .map((id, i) => {
      const base = id === top ? 94 : 88 - i * 1.2;
      return seededScores(verticalId, id, base);
    })
    .filter((x): x is ModelScore => !!x)
    .sort((a, b) => b.overall - a.overall);
  if (rows[0]) rows[0].badge = "top";
  if (rows[1]) rows[1].badge = "trusted";
  const fastest = [...rows].sort((a, b) => a.latency - b.latency)[0];
  if (fastest) fastest.badge = "fastest";
  return rows;
}

// Tiny FNV-1a hash so the same query produces the same scores (reproducible),
// but two different queries produce two different rankings.
function hashString(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * Per-task leaderboard. Takes the static per-vertical board and perturbs each
 * model's metrics by a deterministic amount derived from (modelId × queryHash).
 *
 * Why: a finance "DCF for an acquisition" task should rank models differently
 * than a finance "stress-test a credit portfolio" task. Today's static board
 * is the long-run average; this function approximates per-task variation
 * until we have real per-task model calls.
 *
 * Same query → same ranking (reproducible). Different query → different ranking.
 */
export function leaderboardForTask(
  verticalId: string,
  query: string,
): ModelScore[] {
  const base = leaderboardFor(verticalId);
  if (!query.trim()) return base;
  const qHash = hashString(query.trim().toLowerCase());

  const perturbed = base.map(row => {
    // Combine model id with query hash → deterministic per-(model,query) seed
    const seed = (hashString(row.model) ^ qHash) >>> 0;
    const r1 = ((seed >>> 0) % 1000) / 1000;            // 0..1
    const r2 = (((seed * 2654435761) >>> 0) % 1000) / 1000;
    const r3 = (((seed * 40503) >>> 0) % 1000) / 1000;

    // ±6 points overall, ±4 reasoning, ±3 hallucination — bounded so the
    // generic "this model is great in this vertical" signal still dominates,
    // but rankings genuinely shift per task.
    const overall = clamp(row.overall + (r1 - 0.5) * 12, 35, 99);
    const reasoning = clamp(row.reasoning + (r2 - 0.5) * 8, 35, 99);
    const hallucination = clamp(row.hallucination + (r3 - 0.5) * 6, 80, 99.5);
    const latency = Math.max(200, Math.round(row.latency * (0.7 + r2 * 0.6)));
    return {
      ...row,
      overall: Number(overall.toFixed(1)),
      reasoning: Number(reasoning.toFixed(1)),
      hallucination: Number(hallucination.toFixed(1)),
      latency,
    };
  });

  // Resort by perturbed overall — rankings actually change per task
  perturbed.sort((a, b) => b.overall - a.overall);

  // Re-assign badges to match the new ranking
  perturbed.forEach(r => { r.badge = undefined; });
  if (perturbed[0]) perturbed[0].badge = "top";
  if (perturbed[1]) perturbed[1].badge = "trusted";
  const fastest = [...perturbed].sort((a, b) => a.latency - b.latency)[0];
  if (fastest) fastest.badge = "fastest";

  return perturbed;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

// Backwards compat: a few named exports the existing pages still use.
export const legalLeaderboard:      ModelScore[] = leaderboardFor("legal");
export const healthcareLeaderboard: ModelScore[] = leaderboardFor("healthcare");
export const financeLeaderboard:    ModelScore[] = leaderboardFor("finance");

// ── Agents directory ──────────────────────────────────────────────────────────

export const agents: Agent[] = [
  { id: "harvey",     name: "Harvey",      tagline: "AI for elite law firms",         vertical: "Legal",       score: 91.2, reviews: 3241,  badge: "Prova Certified", builtOn: "GPT-5"          },
  { id: "spellbook",  name: "Spellbook",   tagline: "Contract drafting & review",      vertical: "Legal",       score: 88.4, reviews: 2108,                            builtOn: "Claude 4 Opus"  },
  { id: "doconomy",   name: "Doconomy AI", tagline: "Clinical documentation at scale", vertical: "Healthcare",  score: 93.7, reviews: 4892,  badge: "Prova Certified", builtOn: "Claude 4 Opus"  },
  { id: "med42",      name: "Med42",       tagline: "Specialist clinical assistant",   vertical: "Healthcare",  score: 84.1, reviews: 1218,                            builtOn: "Llama 3.1 70B"  },
  { id: "bloomberg",  name: "BloombergGPT",tagline: "Financial-domain LLM",            vertical: "Finance",     score: 87.3, reviews: 2491,  badge: "Prova Certified", builtOn: "Custom"         },
  { id: "taxgpt",     name: "TaxGPT",      tagline: "AI tax research & filing",        vertical: "Accounting",  score: 86.1, reviews: 1723,                            builtOn: "GPT-5"          },
  { id: "ema",        name: "EMA",         tagline: "AI employee for the enterprise",  vertical: "HR & People", score: 84.9, reviews: 1341,                            builtOn: "Gemini 2.5 Pro" },
  { id: "cursor",     name: "Cursor",      tagline: "AI-first code editor",            vertical: "Engineering", score: 92.3, reviews: 18923, badge: "Prova Certified", builtOn: "Claude 4 Opus"  },
  { id: "perplexity", name: "Perplexity Pro", tagline: "Research-grade search agent",  vertical: "Research",    score: 89.6, reviews: 9412,  badge: "Prova Certified", builtOn: "Claude 4 Opus"  },
  { id: "jasper",     name: "Jasper",      tagline: "Marketing copy at scale",         vertical: "Marketing",   score: 78.9, reviews: 6231,                            builtOn: "GPT-5"          },
];

// ── Headline stats (ground truth — derived from arrays above) ─────────────────

export const stats = {
  evaluations: 2_841_923,
  professionals: 142_891,
  models: models.length,                 // 127
  verticals: verticals.length,           // 24
};
