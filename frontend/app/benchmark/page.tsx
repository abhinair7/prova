"use client";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp, TrendingDown, Minus, Trophy, Zap, ShieldCheck,
  Filter, ChevronDown, Info, Search,
} from "lucide-react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Badge } from "@/components/ui/Badge";
import { GlowButton } from "@/components/ui/GlowButton";
import { leaderboardFor, verticals } from "@/lib/data";
import type { ModelScore } from "@/lib/data";
import { scoreColor, formatNumber } from "@/lib/utils";

const badgeConfig = {
  top: { icon: Trophy, label: "#1 Overall", color: "#F59E0B" },
  fastest: { icon: Zap, label: "Fastest", color: "#06B6D4" },
  trusted: { icon: ShieldCheck, label: "Most Trusted", color: "#10B981" },
};

function ScoreCell({
  value,
  showBar = true,
  color,
}: {
  value: number;
  showBar?: boolean;
  color?: string;
}) {
  const c = color ?? scoreColor(value);
  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm font-bold tabular-nums" style={{ color: c }}>
        {value.toFixed(1)}
      </span>
      {showBar && (
        <div className="h-1 w-16 rounded-full bg-[rgba(255,255,255,0.06)] overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: c }}
            initial={{ width: 0 }}
            animate={{ width: `${value}%` }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
      )}
    </div>
  );
}

function TrendChip({ trend }: { trend: ModelScore["trend"] }) {
  if (trend === "up")
    return (
      <span className="flex items-center gap-0.5 text-[#4ADE80] text-xs">
        <TrendingUp className="w-3 h-3" /> Up
      </span>
    );
  if (trend === "down")
    return (
      <span className="flex items-center gap-0.5 text-[#F87171] text-xs">
        <TrendingDown className="w-3 h-3" /> Down
      </span>
    );
  return (
    <span className="flex items-center gap-0.5 text-[#475569] text-xs">
      <Minus className="w-3 h-3" /> —
    </span>
  );
}

export default function BenchmarkPage() {
  const params = useSearchParams();
  const initial = params?.get("vertical") ?? "healthcare";
  const [activeVertical, setActiveVertical] = useState(
    verticals.some(v => v.id === initial) ? initial : "healthcare",
  );
  const [sortKey, setSortKey] = useState<keyof ModelScore>("overall");
  const [filter, setFilter] = useState("");

  useEffect(() => {
    const v = params?.get("vertical");
    if (v && verticals.some(x => x.id === v)) setActiveVertical(v);
  }, [params]);

  const rows = useMemo(() => leaderboardFor(activeVertical), [activeVertical]);
  const data = useMemo(
    () =>
      [...rows]
        .filter(r => !filter.trim() || r.model.toLowerCase().includes(filter.toLowerCase()) || r.provider.toLowerCase().includes(filter.toLowerCase()))
        .sort((a, b) => (b[sortKey] as number) - (a[sortKey] as number)),
    [rows, sortKey, filter],
  );

  const vertical = verticals.find((v) => v.id === activeVertical);

  const cols: { key: keyof ModelScore; label: string; tooltip: string }[] = [
    { key: "overall", label: "Overall", tooltip: "Weighted composite of all sub-scores" },
    { key: "reasoning", label: "Reasoning", tooltip: "Multi-step logical deduction" },
    { key: "accuracy", label: "Accuracy", tooltip: "Factual correctness on expert-validated cases" },
    { key: "hallucination", label: "Trust", tooltip: "100 − hallucination rate. Higher is safer." },
    { key: "latency", label: "Latency (ms)", tooltip: "Median time to first token" },
    { key: "evaluations", label: "Evals", tooltip: "Number of professional evaluations" },
  ];

  return (
    <div className="min-h-screen bg-[#000000]">
      <Navbar />

      {/* Hero */}
      <section className="pt-28 pb-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#080810] to-[#000000]" />
        <div className="orb w-[500px] h-[300px] bg-[#7C3AED] opacity-[0.08] top-0 left-1/2 -translate-x-1/2" />
        <div className="relative max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl"
          >
            <Badge variant="purple" className="mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-[#7C3AED] live-dot" />
              Live · Updated every 15 minutes
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              AI Leaderboards
            </h1>
            <p className="text-[#94A3B8] text-lg">
              Domain-specific rankings voted on by verified professionals.
              No gaming. No cherry-picking. Confidence intervals on every score.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 pb-24">
        {/* Vertical selector */}
        <div className="flex flex-wrap gap-2 mb-8">
          {verticals.map((v) => (
            <button
              key={v.id}
              onClick={() => setActiveVertical(v.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeVertical === v.id
                  ? "text-white border"
                  : "text-[#94A3B8] hover:text-white bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.07)] hover:bg-[rgba(255,255,255,0.06)]"
              }`}
              style={
                activeVertical === v.id
                  ? {
                      background: `${v.color}15`,
                      borderColor: `${v.color}40`,
                      color: "white",
                    }
                  : {}
              }
            >
              <span>{v.icon}</span>
              {v.name}
              <span className="text-xs opacity-50">
                {formatNumber(v.evaluators)}
              </span>
            </button>
          ))}
        </div>

        {/* Meta bar */}
        {vertical && (
          <motion.div
            key={activeVertical}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap items-center gap-4 mb-6 p-4 rounded-xl border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.02)]"
          >
            <span className="text-xl">{vertical.icon}</span>
            <div>
              <p className="text-sm font-semibold text-white">{vertical.name} AI Index</p>
              <p className="text-xs text-[#64748B]">{vertical.description}</p>
            </div>
            <div className="ml-auto flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs text-[#475569]">Evaluators</p>
                <p className="text-sm font-bold text-white">{formatNumber(vertical.evaluators)}</p>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#64748B]" />
                <input
                  value={filter}
                  onChange={e => setFilter(e.target.value)}
                  placeholder="Filter models…"
                  className="pl-8 pr-3 py-1.5 rounded-lg bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] text-xs placeholder:text-[#475569] focus:outline-none focus:border-[#7C3AED]/60 w-40"
                />
              </div>
              <GlowButton size="sm" variant="secondary">
                <Filter className="w-3.5 h-3.5" />
                Filters
                <ChevronDown className="w-3 h-3 opacity-50" />
              </GlowButton>
            </div>
          </motion.div>
        )}

        {/* Table */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeVertical}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="rounded-2xl border border-[rgba(255,255,255,0.08)] overflow-hidden"
          >
            {/* Column headers */}
            <div className="grid grid-cols-[40px_200px_repeat(6,1fr)] gap-4 items-center px-5 py-3 bg-[rgba(255,255,255,0.02)] border-b border-[rgba(255,255,255,0.06)]">
              <span className="text-xs text-[#475569] text-center">#</span>
              <span className="text-xs text-[#475569]">Model</span>
              {cols.map((col) => (
                <button
                  key={col.key}
                  onClick={() => setSortKey(col.key)}
                  className={`text-xs text-right flex items-center justify-end gap-1 transition-colors ${
                    sortKey === col.key ? "text-[#A78BFA]" : "text-[#475569] hover:text-white"
                  }`}
                >
                  {col.label}
                  <Info className="w-3 h-3 opacity-40" />
                </button>
              ))}
            </div>

            {/* Rows */}
            <div className="divide-y divide-[rgba(255,255,255,0.04)]">
              {data.map((model, i) => {
                const badge = model.badge ? badgeConfig[model.badge] : null;
                return (
                  <motion.div
                    key={model.model}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="grid grid-cols-[40px_200px_repeat(6,1fr)] gap-4 items-center px-5 py-4 hover:bg-[rgba(255,255,255,0.02)] transition-colors group"
                  >
                    {/* Rank */}
                    <div className="text-center">
                      {i === 0 ? (
                        <span className="text-base">🥇</span>
                      ) : i === 1 ? (
                        <span className="text-base">🥈</span>
                      ) : i === 2 ? (
                        <span className="text-base">🥉</span>
                      ) : (
                        <span className="text-sm font-bold text-[#475569]">{i + 1}</span>
                      )}
                    </div>

                    {/* Model */}
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-white">{model.model}</span>
                        {badge && (
                          <span
                            className="hidden lg:inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{
                              color: badge.color,
                              background: `${badge.color}12`,
                              border: `1px solid ${badge.color}25`,
                            }}
                          >
                            <badge.icon className="w-2.5 h-2.5" />
                            {badge.label}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-[#475569]">{model.provider}</span>
                    </div>

                    {/* Scores */}
                    <ScoreCell value={model.overall} color={scoreColor(model.overall)} />
                    <ScoreCell value={model.reasoning} color="#A78BFA" />
                    <ScoreCell value={model.accuracy} color="#06B6D4" />
                    <ScoreCell value={model.hallucination} color="#10B981" />

                    {/* Latency */}
                    <div className="text-right">
                      <span className="text-sm text-[#94A3B8] tabular-nums">
                        {model.latency.toLocaleString()}
                      </span>
                      <p className="text-xs text-[#475569]">
                        {model.latency < 800 ? "Fast" : model.latency < 1500 ? "Moderate" : "Slow"}
                      </p>
                    </div>

                    {/* Evals */}
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-sm text-[#94A3B8] tabular-nums">
                        {formatNumber(model.evaluations)}
                      </span>
                      <TrendChip trend={model.trend} />
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.01)] flex items-center justify-between">
              <p className="text-xs text-[#475569]">
                Scores are weighted composites with 95% confidence intervals.{" "}
                <a href="#" className="text-[#7C3AED] hover:text-[#A78BFA]">
                  Read methodology →
                </a>
              </p>
              <p className="text-xs text-[#475569]">
                Min. 50 evaluations to appear
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <Footer />
    </div>
  );
}
