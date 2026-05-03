// ── Browser-only LLM sandbox ─────────────────────────────────────────────────
// All calls go directly from the user's browser to the provider's API.
// The user's API key is stored in localStorage and is NEVER sent to Prova.
// Prova never sees the prompt, the response, or the key.
//
// This file deliberately has zero server dependencies — it runs in the browser only.

export type SandboxProvider = "openai" | "anthropic" | "google";

export interface SandboxModel {
  id: string;            // model id sent to the provider
  label: string;         // human-readable name on the UI
  provider: SandboxProvider;
}

// A small, current slate of models that work over CORS-permitted browser fetches.
// Add more as providers expand CORS support.
export const SANDBOX_MODELS: SandboxModel[] = [
  // OpenAI
  { id: "gpt-4o-mini",  label: "GPT-4o Mini",    provider: "openai" },
  { id: "gpt-4o",       label: "GPT-4o",         provider: "openai" },
  // Anthropic
  { id: "claude-3-5-sonnet-latest", label: "Claude 3.5 Sonnet", provider: "anthropic" },
  { id: "claude-3-5-haiku-latest",  label: "Claude 3.5 Haiku",  provider: "anthropic" },
  // Google
  { id: "gemini-1.5-flash", label: "Gemini 1.5 Flash", provider: "google" },
  { id: "gemini-1.5-pro",   label: "Gemini 1.5 Pro",   provider: "google" },
];

const LS_PREFIX = "prova.sandbox.key.";

export function loadKey(provider: SandboxProvider): string {
  if (typeof window === "undefined") return "";
  try { return window.localStorage.getItem(LS_PREFIX + provider) ?? ""; } catch { return ""; }
}

export function saveKey(provider: SandboxProvider, key: string): void {
  if (typeof window === "undefined") return;
  try {
    if (key.trim()) window.localStorage.setItem(LS_PREFIX + provider, key.trim());
    else window.localStorage.removeItem(LS_PREFIX + provider);
  } catch { /* ignore quota errors */ }
}

export function clearAllKeys(): void {
  if (typeof window === "undefined") return;
  try {
    (["openai", "anthropic", "google"] as SandboxProvider[]).forEach(p =>
      window.localStorage.removeItem(LS_PREFIX + p),
    );
  } catch { /* ignore */ }
}

export function hasKeyFor(provider: SandboxProvider): boolean {
  return loadKey(provider).length > 10;
}

export interface SandboxCallResult {
  model: SandboxModel;
  ok: boolean;
  output: string;
  latencyMs: number;
  errorMessage?: string;
  // Token usage when the provider returns it; otherwise undefined.
  usage?: { input?: number; output?: number; totalCostUsd?: number };
}

// Per-model rough $/1K tokens — used only for an in-browser cost estimate.
const COST_PER_1K_USD: Record<string, { input: number; output: number }> = {
  "gpt-4o":           { input: 0.0025, output: 0.010  },
  "gpt-4o-mini":      { input: 0.00015, output: 0.00060 },
  "claude-3-5-sonnet-latest": { input: 0.003, output: 0.015 },
  "claude-3-5-haiku-latest":  { input: 0.0008, output: 0.004 },
  "gemini-1.5-pro":   { input: 0.00125, output: 0.005 },
  "gemini-1.5-flash": { input: 0.000075, output: 0.0003 },
};

function estimateCost(model: SandboxModel, inputTokens?: number, outputTokens?: number): number | undefined {
  const c = COST_PER_1K_USD[model.id];
  if (!c || inputTokens === undefined || outputTokens === undefined) return undefined;
  return (inputTokens * c.input + outputTokens * c.output) / 1000;
}

// ── OpenAI ──────────────────────────────────────────────────────────────────
async function callOpenAI(model: SandboxModel, prompt: string, key: string, signal: AbortSignal): Promise<SandboxCallResult> {
  const t0 = performance.now();
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      signal,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: model.id,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
        max_tokens: 600,
      }),
    });
    const json = await res.json();
    const latencyMs = Math.round(performance.now() - t0);
    if (!res.ok) {
      return { model, ok: false, output: "", latencyMs, errorMessage: json?.error?.message ?? `HTTP ${res.status}` };
    }
    const output: string = json?.choices?.[0]?.message?.content ?? "";
    const usage = {
      input: json?.usage?.prompt_tokens,
      output: json?.usage?.completion_tokens,
      totalCostUsd: estimateCost(model, json?.usage?.prompt_tokens, json?.usage?.completion_tokens),
    };
    return { model, ok: true, output, latencyMs, usage };
  } catch (e) {
    return { model, ok: false, output: "", latencyMs: Math.round(performance.now() - t0), errorMessage: errorMessageOf(e) };
  }
}

// ── Anthropic ───────────────────────────────────────────────────────────────
async function callAnthropic(model: SandboxModel, prompt: string, key: string, signal: AbortSignal): Promise<SandboxCallResult> {
  const t0 = performance.now();
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      signal,
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        // Required to permit browser-origin requests
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: model.id,
        max_tokens: 600,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const json = await res.json();
    const latencyMs = Math.round(performance.now() - t0);
    if (!res.ok) {
      return { model, ok: false, output: "", latencyMs, errorMessage: json?.error?.message ?? `HTTP ${res.status}` };
    }
    const output: string = json?.content?.map((b: { type: string; text?: string }) => b?.text ?? "").join("") ?? "";
    const usage = {
      input: json?.usage?.input_tokens,
      output: json?.usage?.output_tokens,
      totalCostUsd: estimateCost(model, json?.usage?.input_tokens, json?.usage?.output_tokens),
    };
    return { model, ok: true, output, latencyMs, usage };
  } catch (e) {
    return { model, ok: false, output: "", latencyMs: Math.round(performance.now() - t0), errorMessage: errorMessageOf(e) };
  }
}

// ── Google Gen AI ───────────────────────────────────────────────────────────
async function callGoogle(model: SandboxModel, prompt: string, key: string, signal: AbortSignal): Promise<SandboxCallResult> {
  const t0 = performance.now();
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model.id)}:generateContent?key=${encodeURIComponent(key)}`;
    const res = await fetch(url, {
      method: "POST",
      signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 600 },
      }),
    });
    const json = await res.json();
    const latencyMs = Math.round(performance.now() - t0);
    if (!res.ok) {
      return { model, ok: false, output: "", latencyMs, errorMessage: json?.error?.message ?? `HTTP ${res.status}` };
    }
    const output: string = json?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p?.text ?? "").join("") ?? "";
    const usage = {
      input: json?.usageMetadata?.promptTokenCount,
      output: json?.usageMetadata?.candidatesTokenCount,
      totalCostUsd: estimateCost(model, json?.usageMetadata?.promptTokenCount, json?.usageMetadata?.candidatesTokenCount),
    };
    return { model, ok: true, output, latencyMs, usage };
  } catch (e) {
    return { model, ok: false, output: "", latencyMs: Math.round(performance.now() - t0), errorMessage: errorMessageOf(e) };
  }
}

function errorMessageOf(e: unknown): string {
  if (e instanceof DOMException && e.name === "AbortError") return "Cancelled";
  if (e instanceof Error) return e.message;
  return "Network error";
}

// ── Public dispatcher ───────────────────────────────────────────────────────
export async function runSandbox(
  prompt: string,
  models: SandboxModel[],
  signal: AbortSignal,
  onResult?: (r: SandboxCallResult) => void,
): Promise<SandboxCallResult[]> {
  const calls = models.map(m => {
    const key = loadKey(m.provider);
    if (!key) {
      const r: SandboxCallResult = { model: m, ok: false, output: "", latencyMs: 0, errorMessage: `No ${m.provider} API key set` };
      onResult?.(r);
      return Promise.resolve(r);
    }
    const promise =
      m.provider === "openai"    ? callOpenAI(m, prompt, key, signal) :
      m.provider === "anthropic" ? callAnthropic(m, prompt, key, signal) :
                                   callGoogle(m, prompt, key, signal);
    return promise.then(r => { onResult?.(r); return r; });
  });
  return Promise.all(calls);
}
