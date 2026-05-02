"use client";
import { useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDropzone } from "react-dropzone";
import {
  Upload, FileText, X, ChevronRight, Loader2,
  CheckCircle, Copy, Share2, Shield, Zap,
  Vote, Wand2, EyeOff, Cpu, Building2, Lock,
} from "lucide-react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { GlowButton } from "@/components/ui/GlowButton";
import { Badge } from "@/components/ui/Badge";
import { scoreColor } from "@/lib/utils";
import { verticals as ALL_VERTICALS, leaderboardFor } from "@/lib/data";

type Step = "upload" | "running" | "results";
type Mode = "vote" | "synthesize" | "mask" | "local" | "enterprise";
type Slate = 5 | 10 | 25 | 50;

const MODES: {
  id: Mode;
  label: string;
  icon: typeof Vote;
  blurb: string;
  privacy: string;
  status: "live" | "beta" | "soon" | "request";
  color: string;
}[] = [
  {
    id: "vote",
    label: "Vote on curated cases",
    icon: Vote,
    blurb: "We show expert-seeded tasks for your vertical. You judge — nothing of yours is uploaded.",
    privacy: "Zero data leaves your device.",
    status: "live",
    color: "#10B981",
  },
  {
    id: "synthesize",
    label: "Synthesize & test",
    icon: Wand2,
    blurb: "On-device model rewrites your task into a structurally equivalent one with all identifying details swapped.",
    privacy: "We never see the original.",
    status: "beta",
    color: "#A78BFA",
  },
  {
    id: "mask",
    label: "Mask & test",
    icon: EyeOff,
    blurb: "Client-side NER strips PII (names, MRNs, tickers, account numbers) before send. You approve the diff first.",
    privacy: "Redacted version only.",
    status: "live",
    color: "#06B6D4",
  },
  {
    id: "local",
    label: "Local mode (BYO key)",
    icon: Cpu,
    blurb: "Desktop / browser-extension app — runs models from your own keys, only the vote returns to Prova. Reserve a slot in the waitlist.",
    privacy: "Document never leaves your machine.",
    status: "soon",
    color: "#F59E0B",
  },
  {
    id: "enterprise",
    label: "Enterprise tenant",
    icon: Building2,
    blurb: "Org-isolated infra · BAA · SOC 2 · DPA. Private leaderboard for your team.",
    privacy: "Tenant-isolated, never enters public pool.",
    status: "request",
    color: "#EC4899",
  },
];

const SLATES: { value: Slate; label: string; sublabel: string }[] = [
  { value: 5,  label: "Top 5",   sublabel: "~60s · default" },
  { value: 10, label: "Top 10",  sublabel: "~2 min" },
  { value: 25, label: "Top 25",  sublabel: "~5 min" },
  { value: 50, label: "All frontier", sublabel: "~10 min" },
];

interface ModelResult {
  model: string;
  provider: string;
  output: string;
  score: number;
  reasoning: number;
  hallucination: number;
  latency: number;
  color: string;
}

const MODEL_PALETTE = ["#A78BFA", "#67E8F9", "#FCD34D", "#F97316", "#4ADE80"];

// Per-vertical output templates — keyed by vertical id, with {hook} replaced by the user's query if present.
const OUTPUT_TEMPLATES: Record<string, string[]> = {
  legal: [
    "Reviewed the clause set against MAC, indemnity, and limitation-of-liability standards. Flag: §7.3 caps liability at fees paid in prior 6 months — below market for this deal size. Recommend negotiating to 12 months or 2× fees. Privilege: no waiver risk identified. Citations cross-checked against Westlaw.",
    "Contract appears mostly standard. Two material concerns: (1) auto-renewal in §11 lacks opt-out window, (2) governing law is Delaware but venue is NY — inconsistency that creates litigation cost. Suggested redlines attached. Hallucination check: all cited statutes verified.",
    "Standard SaaS MSA. IP assignment is buyer-favorable; data processing addendum is GDPR-compliant. Indemnity is mutual but capped — uncapped carve-outs missing for IP infringement. Recommend adding. Confidence: high.",
  ],
  healthcare: [
    "Clinical presentation suggests community-acquired pneumonia (CAP). ICD-10: J18.9. Differential: J15.9 bacterial, J12.9 viral. Empirical antibiotic per ATS/IDSA guidelines. Hallucination risk LOW — diagnostic criteria cross-referenced against documented findings.",
    "ICD-10 J18.9 appropriate. Key indicators: fever 38.8°C, productive cough, consolidation on CXR, elevated CRP. CURB-65 = 2 (moderate). Recommend hospitalization. Antibiotic: amoxicillin-clavulanate + azithromycin.",
    "Radiological and clinical features consistent with pneumonia (J18.9). CURB-65 stratification recommended. Consider atypical pathogens given age and travel history. Procalcitonin guidance for stewardship where available.",
  ],
  finance: [
    "DCF inputs reviewed. WACC of 9.2% is reasonable given target's beta (1.15) and current 10Y yield. Terminal growth at 2.5% is conservative. Sensitivity shows ±$340M EV swing for 50bps WACC change. Flag: synergy assumptions of $80M/yr appear aggressive — base case should haircut to $50M.",
    "Risk decomposition: 62% market, 24% credit, 14% operational. VaR (95%, 1-day) = $4.2M. Stress test (2008 replay) shows -18% portfolio drawdown vs -22% benchmark — within mandate. Concentration risk in tech (31%) above policy ceiling of 25%; recommend trimming.",
    "Financial statement quality: clean. Free cash flow conversion 92% — strong. Three concerns: (1) DSO trending up 6 days YoY, (2) inventory turnover declining, (3) capex/sales below maintenance threshold. Adjusted EBITDA reconciliation checks out. No restatement risk identified.",
  ],
  accounting: [
    "Reviewed reconciliation. Variance of $12,400 in Q3 traces to timing on AR cutoff — reverses in Q4. Recommend journal entry to accrue in correct period. SOC 1 controls intact. Tax provision: effective rate 21.4%, in line with statutory.",
    "Tax position: §174 capitalization correctly applied. R&D credit calculation supportable. Concern: §163(j) interest limitation may apply given EBITDA decline — needs scenario analysis before filing. State apportionment looks correct for nexus footprint.",
    "Audit trail: all journal entries supported. Two control exceptions: (1) segregation of duties in vendor master, (2) one bank rec posted late. Neither material. Recommend remediation memo. Going-concern: no flag.",
  ],
  engineering: [
    "Code review: the lock acquisition order in `transferFunds` differs between the two helpers — classic deadlock setup under contention. Suggest enforcing a global ordering on account IDs. Test coverage misses the concurrent-write path entirely. Hallucination check: all referenced symbols exist in repo.",
    "Architecture: the message bus is a SPOF. Recommend partitioning by tenant_id or moving hot path to direct RPC. The retry policy in `worker.py` will amplify load during downstream outages — replace with token bucket + circuit breaker.",
    "Bug located at L142: off-by-one in pagination causes the last item per page to be silently dropped. Repro: any list ≥51 items. Fix: `<` → `<=`. Add a property test for boundary sizes.",
  ],
  "data-science": [
    "Model: the +3.2% AUC lift is within the 95% CI of the baseline given the test-set size — not statistically significant. Need n≈14k for power. Also: feature `last_login_days` leaks the label (post-event signal). Strip and re-run.",
    "Causal claim is shaky — pre-treatment trends diverge, so DiD assumption fails. Suggest synthetic control or IV with a stronger first stage. Effect size of 8% is plausible upper bound.",
    "Data quality: 4.1% of rows have impossible timestamps (future-dated). Drop or impute? Recommend drop — they correlate with a known ETL bug. Also flag class imbalance 1:97; rebalance via focal loss, not naive oversampling.",
  ],
  security: [
    "Threat model: this endpoint accepts user-controlled XML — XXE risk if the parser doesn't disable external entities. Verify `setFeature` is called or migrate to a safe parser. Auth check: token validated but not bound to source IP — replay possible.",
    "Code audit: SQL parameterization is correct on 14/15 paths. The 15th (search filter) interpolates a column name — restrict to an allowlist. Secrets scan: one AWS key in test fixtures (rotate immediately). No P1 findings outside of these.",
    "Incident response plan: detection coverage is good for north-south, weak for east-west lateral movement. Recommend EDR on critical assets and segmenting the prod VLAN. Tabletop on the ransomware scenario shows MTTD ~4h — target <1h.",
  ],
  marketing: [
    "Copy is direct but generic. Hook lacks specificity for the ICP. Suggest: lead with the 3-day quantified outcome, drop the adjective stack in para 2. CTA verb is weak (\"Learn more\") — try \"See your ROI\". Brand voice: matches guidelines on register, slightly off on cadence.",
    "Campaign strategy: top-of-funnel reach is fine but mid-funnel has a leak — the case-study page bounces at 71%. Re-cut with vertical-specific proof. Channel mix is over-indexed on paid social vs your buyer's actual research path (analyst reports + peer review).",
    "Brand fact-check: the \"trusted by 10,000 teams\" claim is not substantiated by current customer count. Soften to \"thousands of teams\" or pull. Tone is on-brand.",
  ],
  research: [
    "Literature gap: only 2 of 14 cited papers are post-2024 — the field has moved. Most notably, [Liu et al. 2025] supersedes the foundational claim in §2.1. Recommend updated synthesis. Citation accuracy: 13/14 verified, one DOI does not resolve.",
    "Hypothesis: plausible but the proposed test is underpowered for the effect size you're predicting. Run a pilot or pre-register a sequential design. Also: confound from cohort effect not addressed.",
    "Methodology: solid otherwise, but the inclusion criteria exclude exactly the population where the effect is theoretically strongest. Justify or broaden. Reproducibility checklist 9/12 — three items missing.",
  ],
};

const FALLBACK_TEMPLATE = (vertical: string) => [
  `Detailed analysis of the ${vertical.toLowerCase()} task. Reasoning is structured, claims are sourced where relevant, and edge cases are surfaced explicitly. Hallucination check passed.`,
  `Concise breakdown for the ${vertical.toLowerCase()} workflow with prioritized recommendations and risk flags. Confidence intervals included on quantitative claims.`,
  `Practical, action-oriented response calibrated to ${vertical.toLowerCase()} norms. Output is structured for downstream use; references included where applicable.`,
];

function buildResults(verticalId: string, query: string, slate: Slate): ModelResult[] {
  const board = leaderboardFor(verticalId).slice(0, slate);
  if (board.length === 0) return [];
  const v = ALL_VERTICALS.find(x => x.id === verticalId);
  const templates = OUTPUT_TEMPLATES[verticalId] ?? FALLBACK_TEMPLATE(v?.name ?? "this");
  const hook = query.trim()
    ? `Re: "${query.trim().slice(0, 80)}${query.trim().length > 80 ? "…" : ""}". `
    : "";
  return board.map((row, i) => ({
    model: row.model,
    provider: row.provider,
    output: hook + (templates[i % templates.length] ?? templates[templates.length - 1]),
    score: row.overall,
    reasoning: row.reasoning,
    hallucination: row.hallucination,
    latency: row.latency,
    color: MODEL_PALETTE[i % MODEL_PALETTE.length],
  }));
}

function UploadZone({ onFile }: { onFile: (f: File) => void }) {
  const onDrop = useCallback(
    (files: File[]) => { if (files[0]) onFile(files[0]); },
    [onFile]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "text/plain": [".txt"],
      "text/csv": [".csv"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    },
    maxFiles: 1,
  });

  return (
    <div
      {...getRootProps()}
      className={`relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-200 ${
        isDragActive
          ? "border-[#7C3AED] bg-[rgba(124,58,237,0.08)]"
          : "border-[rgba(255,255,255,0.12)] hover:border-[rgba(124,58,237,0.5)] hover:bg-[rgba(124,58,237,0.04)]"
      }`}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-[rgba(124,58,237,0.15)] flex items-center justify-center">
          <Upload className="w-6 h-6 text-[#A78BFA]" />
        </div>
        <div>
          <p className="text-base font-medium text-white mb-1">
            {isDragActive ? "Drop it here" : "Drop your document or click to browse"}
          </p>
          <p className="text-sm text-[#64748B]">
            PDF, DOCX, TXT, CSV — up to 10MB
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-[#475569]">
          <Shield className="w-3.5 h-3.5 text-[#10B981]" />
          PII masked automatically before any processing
        </div>
      </div>
    </div>
  );
}

function RunningStep({ models }: { models: { name: string; color: string }[] }) {

  return (
    <div className="flex flex-col items-center gap-8 py-12">
      <div className="relative">
        <div className="w-20 h-20 rounded-full border-2 border-[#7C3AED] border-t-transparent animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Zap className="w-7 h-7 text-[#7C3AED]" />
        </div>
      </div>
      <div className="text-center">
        <h3 className="text-xl font-semibold text-white mb-2">
          Running parallel evaluation
        </h3>
        <p className="text-sm text-[#64748B]">
          PII masked · 5 models in parallel · Cross-encoder reranking
        </p>
      </div>
      <div className="w-full max-w-sm space-y-3">
        {models.map((m, i) => (
          <motion.div
            key={m.name}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.3 }}
            className="flex items-center gap-3 p-3 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)]"
          >
            <Loader2 className="w-4 h-4 animate-spin" style={{ color: m.color }} />
            <span className="text-sm text-[#94A3B8] flex-1">{m.name}</span>
            <motion.div
              className="h-1 rounded-full"
              style={{ background: m.color, width: "60px" }}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function ResultCard({
  result,
  rank,
  isWinner,
}: {
  result: ModelResult;
  rank: number;
  isWinner: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.1 }}
      className={`relative rounded-2xl border p-5 ${
        isWinner
          ? "border-[rgba(124,58,237,0.4)] bg-[rgba(124,58,237,0.06)]"
          : "border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)]"
      }`}
    >
      {isWinner && (
        <div className="absolute -top-3 left-4">
          <span className="inline-flex items-center gap-1 bg-[#7C3AED] text-white text-xs font-bold px-3 py-1 rounded-full">
            ✦ Best for your task
          </span>
        </div>
      )}

      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="font-semibold text-white">{result.model}</p>
          <p className="text-xs text-[#64748B]">{result.provider}</p>
        </div>
        <div className="text-right">
          <p
            className="text-2xl font-bold tabular-nums"
            style={{ color: scoreColor(result.score) }}
          >
            {result.score}
          </p>
          <p className="text-xs text-[#475569]">overall</p>
        </div>
      </div>

      {/* Sub-scores */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: "Reasoning", value: result.reasoning, color: result.color },
          { label: "Trust", value: result.hallucination, color: "#10B981" },
          { label: "Latency", value: null, raw: `${result.latency}ms`, color: "#06B6D4" },
        ].map(({ label, value, raw, color }) => (
          <div
            key={label}
            className="p-2.5 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)]"
          >
            <p className="text-xs text-[#475569] mb-0.5">{label}</p>
            <p className="text-sm font-bold tabular-nums" style={{ color }}>
              {raw ?? value}
            </p>
          </div>
        ))}
      </div>

      {/* Output preview */}
      <div className="p-3 rounded-xl bg-[rgba(0,0,0,0.3)] border border-[rgba(255,255,255,0.04)]">
        <p className="text-xs text-[#94A3B8] leading-relaxed line-clamp-3">
          {result.output}
        </p>
      </div>
    </motion.div>
  );
}

export default function EvaluatePage() {
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [verticalId, setVerticalId] = useState<string>("finance");
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<Mode>("vote");
  const [slate, setSlate] = useState<Slate>(5);

  const vertical = useMemo(
    () => ALL_VERTICALS.find(v => v.id === verticalId) ?? ALL_VERTICALS[0],
    [verticalId],
  );

  const results = useMemo(
    () => (step === "running" || step === "results" ? buildResults(verticalId, query, slate) : []),
    [verticalId, query, step, slate],
  );

  const runningModels = useMemo(
    () =>
      leaderboardFor(verticalId)
        .slice(0, Math.min(slate, 8))
        .map((row, i) => ({ name: row.model, color: MODEL_PALETTE[i % MODEL_PALETTE.length] })),
    [verticalId, slate],
  );

  const requiresUpload = mode === "synthesize" || mode === "mask";
  const canRun =
    mode === "vote" ||
    (requiresUpload && (file !== null || query.trim().length > 0));

  function handleFile(f: File) {
    setFile(f);
  }

  function handleRun() {
    if (!canRun) return;
    setStep("running");
    setTimeout(() => setStep("results"), 3500);
  }

  return (
    <div className="min-h-screen bg-[#000000]">
      <Navbar />

      <section className="pt-28 pb-8 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-[#080810] to-[#000000]" />
        <div className="orb w-[400px] h-[300px] bg-[#06B6D4] opacity-[0.06] top-0 right-0" />
        <div className="relative max-w-4xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <Badge variant="cyan" className="mb-4">
              <Zap className="w-3 h-3" />
              {SLATES.find(s => s.value === slate)?.label} for your vertical · {SLATES.find(s => s.value === slate)?.sublabel}
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Test AI on your actual work
            </h1>
            <p className="text-[#94A3B8] text-lg">
              Pick how much of your work you're willing to share — vote on curated cases,
              synthesize a structurally-equivalent task, or run locally with your own keys.
              All 127 models are continuously benchmarked offline; live runs default to the top {slate}.
            </p>
          </motion.div>

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-3 mb-10">
            {(["upload", "running", "results"] as Step[]).map((s, i) => (
              <div key={s} className="flex items-center gap-3">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    step === s
                      ? "bg-[#7C3AED] text-white"
                      : i < ["upload", "running", "results"].indexOf(step)
                      ? "bg-[#10B981] text-white"
                      : "bg-[rgba(255,255,255,0.06)] text-[#475569]"
                  }`}
                >
                  {i < ["upload", "running", "results"].indexOf(step) ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    i + 1
                  )}
                </div>
                <span
                  className={`text-sm capitalize ${
                    step === s ? "text-white" : "text-[#475569]"
                  }`}
                >
                  {s === "upload" ? "Upload" : s === "running" ? "Evaluating" : "Results"}
                </span>
                {i < 2 && <ChevronRight className="w-3.5 h-3.5 text-[#2D3748]" />}
              </div>
            ))}
          </div>

          {/* Main card */}
          <div className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] overflow-hidden">
            <AnimatePresence mode="wait">
              {step === "upload" && (
                <motion.div
                  key="upload"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="p-6"
                >
                  {/* Participation mode */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-medium text-[#94A3B8]">
                        How would you like to participate?
                      </label>
                      <span className="inline-flex items-center gap-1 text-[10px] text-[#475569]">
                        <Lock className="w-3 h-3" /> Your privacy, your call
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {MODES.map((m) => {
                        const active = mode === m.id;
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => setMode(m.id)}
                            className={`text-left p-3 rounded-xl border transition-all ${
                              active
                                ? "bg-[rgba(124,58,237,0.10)] border-[rgba(124,58,237,0.45)]"
                                : "bg-[rgba(255,255,255,0.02)] border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.14)]"
                            }`}
                          >
                            <div className="flex items-start justify-between mb-1.5">
                              <div
                                className="w-7 h-7 rounded-lg flex items-center justify-center"
                                style={{ background: `${m.color}1A`, border: `1px solid ${m.color}33` }}
                              >
                                <m.icon className="w-3.5 h-3.5" style={{ color: m.color }} />
                              </div>
                              <span
                                className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-full"
                                style={{
                                  color:
                                    m.status === "live" ? "#4ADE80"
                                      : m.status === "beta" ? "#FBBF24"
                                      : m.status === "soon" ? "#06B6D4"
                                      : "#94A3B8",
                                  background:
                                    m.status === "live" ? "rgba(74,222,128,0.10)"
                                      : m.status === "beta" ? "rgba(251,191,36,0.10)"
                                      : m.status === "soon" ? "rgba(6,182,212,0.10)"
                                      : "rgba(148,163,184,0.10)",
                                }}
                              >
                                {m.status === "soon" ? "App · Q3" : m.status}
                              </span>
                            </div>
                            <p className="text-xs font-semibold text-white mb-1">{m.label}</p>
                            <p className="text-[11px] text-[#94A3B8] leading-snug mb-1.5">{m.blurb}</p>
                            <p className="text-[10px]" style={{ color: m.color }}>{m.privacy}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Slate selector */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-medium text-[#94A3B8]">
                        How many models to run live?
                      </label>
                      <a href="/benchmark" className="text-[10px] text-[#7C3AED] hover:text-[#A78BFA] transition-colors">
                        See all 127 in the offline leaderboard →
                      </a>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {SLATES.map((s) => {
                        const active = slate === s.value;
                        return (
                          <button
                            key={s.value}
                            type="button"
                            onClick={() => setSlate(s.value)}
                            className={`p-2.5 rounded-xl border transition-all ${
                              active
                                ? "bg-[rgba(6,182,212,0.10)] border-[rgba(6,182,212,0.45)]"
                                : "bg-[rgba(255,255,255,0.02)] border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.14)]"
                            }`}
                          >
                            <p className={`text-sm font-semibold ${active ? "text-white" : "text-[#94A3B8]"}`}>{s.label}</p>
                            <p className="text-[10px] text-[#475569] mt-0.5">{s.sublabel}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Mode-specific note */}
                  {mode === "vote" && (
                    <div className="mb-5 p-3 rounded-xl bg-[rgba(16,185,129,0.06)] border border-[rgba(16,185,129,0.18)]">
                      <p className="text-xs text-[#94A3B8]">
                        <span className="text-white font-medium">No upload needed.</span>{" "}
                        We'll show you a curated case from the {vertical.name} benchmark when you click Run. Just judge which output is best.
                      </p>
                    </div>
                  )}
                  {mode === "synthesize" && (
                    <div className="mb-5 p-3 rounded-xl bg-[rgba(167,139,250,0.06)] border border-[rgba(167,139,250,0.20)]">
                      <p className="text-xs text-[#94A3B8]">
                        <span className="text-white font-medium">On-device rewrite.</span>{" "}
                        Paste your task below — a small model in your browser will swap identifiers, names, and surface details before anything is sent. You'll review the synthesized version first.
                      </p>
                    </div>
                  )}
                  {mode === "local" && (
                    <div className="mb-5 p-3 rounded-xl bg-[rgba(245,158,11,0.06)] border border-[rgba(245,158,11,0.20)]">
                      <p className="text-xs text-[#94A3B8]">
                        <span className="text-white font-medium">App, coming Q3 2026.</span>{" "}
                        For workflows where the document can never leave your machine, the desktop app is the right fit.{" "}
                        <a href="/profile?signin=linkedin" className="text-[#F59E0B] hover:underline">Reserve a spot from your profile →</a>
                      </p>
                    </div>
                  )}
                  {mode === "enterprise" && (
                    <div className="mb-5 p-3 rounded-xl bg-[rgba(236,72,153,0.06)] border border-[rgba(236,72,153,0.20)]">
                      <p className="text-xs text-[#94A3B8]">
                        <span className="text-white font-medium">Tenant-isolated for your org.</span>{" "}
                        BAA / SOC 2 / DPA available. Your team gets a private leaderboard; raw data never enters the public pool.{" "}
                        <a href="mailto:enterprise@prova.ai" className="text-[#EC4899] hover:underline">Request access →</a>
                      </p>
                    </div>
                  )}

                  {/* Vertical selector */}
                  <div className="mb-6">
                    <label className="block text-xs font-medium text-[#94A3B8] mb-2">
                      Your profession / vertical
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {ALL_VERTICALS.map((v) => (
                        <button
                          key={v.id}
                          onClick={() => setVerticalId(v.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            verticalId === v.id
                              ? "bg-[rgba(124,58,237,0.2)] text-[#A78BFA] border border-[rgba(124,58,237,0.4)]"
                              : "bg-[rgba(255,255,255,0.04)] text-[#94A3B8] border border-[rgba(255,255,255,0.08)] hover:text-white"
                          }`}
                        >
                          <span className="mr-1">{v.icon}</span>
                          {v.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Upload + textarea — only when the chosen mode actually needs the user's task */}
                  {requiresUpload && (
                    <>
                      <UploadZone onFile={handleFile} />

                      {file && (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-3 flex items-center gap-3 p-3 rounded-xl bg-[rgba(16,185,129,0.08)] border border-[rgba(16,185,129,0.2)]"
                        >
                          <FileText className="w-4 h-4 text-[#10B981]" />
                          <span className="text-sm text-white flex-1 truncate">{file.name}</span>
                          <button onClick={() => setFile(null)}>
                            <X className="w-4 h-4 text-[#475569] hover:text-white" />
                          </button>
                        </motion.div>
                      )}

                      <div className="flex items-center gap-3 my-5">
                        <div className="flex-1 h-px bg-[rgba(255,255,255,0.06)]" />
                        <span className="text-xs text-[#475569]">or type your task</span>
                        <div className="flex-1 h-px bg-[rgba(255,255,255,0.06)]" />
                      </div>

                      <textarea
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={`Paste a ${vertical.name.toLowerCase()} task, question, or case summary here...`}
                        rows={4}
                        className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-xl p-4 text-sm text-white placeholder:text-[#475569] resize-none focus:outline-none focus:border-[rgba(124,58,237,0.4)] transition-colors"
                      />
                    </>
                  )}

                  {/* Run button */}
                  <div className="mt-5 flex items-center justify-between">
                    <p className="text-[11px] text-[#475569]">
                      {mode === "vote" && "We'll seed a curated case from the benchmark."}
                      {mode === "synthesize" && "Your task will be rewritten on-device before send."}
                      {mode === "mask" && "PII is stripped client-side. You'll approve the diff first."}
                      {mode === "local" && "Models run via your own keys. We never see the document."}
                      {mode === "enterprise" && "Talk to us about a tenant-isolated deployment."}
                    </p>
                    <GlowButton
                      onClick={handleRun}
                      disabled={!canRun || mode === "enterprise" || mode === "local"}
                      size="lg"
                    >
                      {mode === "enterprise"
                        ? "Request access"
                        : mode === "local"
                        ? "Reserve app slot"
                        : `Run ${slate} models`}
                      <ChevronRight className="w-4 h-4" />
                    </GlowButton>
                  </div>
                </motion.div>
              )}

              {step === "running" && (
                <motion.div
                  key="running"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="p-6"
                >
                  <RunningStep models={runningModels} />
                </motion.div>
              )}

              {step === "results" && (
                <motion.div
                  key="results"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-6"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        Your personalized scorecard
                      </h3>
                      <p className="text-xs text-[#64748B] mt-0.5">
                        {vertical.name} · {results.length} models evaluated · vote to improve rankings
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <GlowButton variant="secondary" size="sm">
                        <Copy className="w-3.5 h-3.5" />
                        Copy
                      </GlowButton>
                      <GlowButton size="sm">
                        <Share2 className="w-3.5 h-3.5" />
                        Share scorecard
                      </GlowButton>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {results.map((r, i) => (
                      <ResultCard
                        key={r.model}
                        result={r}
                        rank={i + 1}
                        isWinner={i === 0}
                      />
                    ))}
                  </div>

                  <div className="mt-6 p-4 rounded-xl bg-[rgba(124,58,237,0.06)] border border-[rgba(124,58,237,0.2)]">
                    <p className="text-sm text-[#94A3B8]">
                      <span className="text-white font-medium">Vote to improve accuracy.</span>{" "}
                      Which output was most useful for your work? Your vote
                      updates the {vertical.name} AI Index in real time.
                    </p>
                    <div className="flex gap-2 mt-3">
                      {results.map((r) => (
                        <button
                          key={r.model}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.1)] hover:bg-[rgba(124,58,237,0.2)] hover:border-[rgba(124,58,237,0.4)] transition-all"
                        >
                          {r.model.split(" ")[0]}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 text-center">
                    <button
                      onClick={() => { setStep("upload"); setFile(null); setQuery(""); }}
                      className="text-sm text-[#475569] hover:text-white transition-colors"
                    >
                      ← Test another document
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
