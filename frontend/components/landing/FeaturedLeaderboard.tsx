"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, Trophy, Zap, ShieldCheck } from "lucide-react";
import { legalLeaderboard, healthcareLeaderboard, financeLeaderboard } from "@/lib/data";
import type { ModelScore } from "@/lib/data";
import { scoreColor } from "@/lib/utils";
import Link from "next/link";

const tabs = [
  { id: "healthcare", label: "Healthcare", data: healthcareLeaderboard },
  { id: "legal", label: "Legal", data: legalLeaderboard },
  { id: "finance", label: "Finance", data: financeLeaderboard },
];

const badgeConfig = {
  top: { icon: Trophy, label: "#1 Overall", color: "#F59E0B" },
  fastest: { icon: Zap, label: "Fastest", color: "#06B6D4" },
  trusted: { icon: ShieldCheck, label: "Most Trusted", color: "#10B981" },
};

function TrendIcon({ trend }: { trend: ModelScore["trend"] }) {
  if (trend === "up")
    return <TrendingUp className="w-3.5 h-3.5 text-[#4ADE80]" />;
  if (trend === "down")
    return <TrendingDown className="w-3.5 h-3.5 text-[#F87171]" />;
  return <Minus className="w-3.5 h-3.5 text-[#475569]" />;
}

function ScoreBar({ score, color }: { score: number; color: string }) {
  return (
    <div className="w-full h-1.5 rounded-full bg-[rgba(255,255,255,0.06)] overflow-hidden">
      <motion.div
        className="h-full rounded-full"
        style={{ background: color }}
        initial={{ width: 0 }}
        animate={{ width: `${score}%` }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
      />
    </div>
  );
}

function ModelRow({ model, rank }: { model: ModelScore; rank: number }) {
  const color = scoreColor(model.overall);
  const badge = model.badge ? badgeConfig[model.badge] : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 16 }}
      transition={{ duration: 0.35, delay: rank * 0.05 }}
      className="grid grid-cols-[32px_1fr_80px_80px_80px_100px] gap-3 items-center px-4 py-3.5 rounded-xl hover:bg-[rgba(255,255,255,0.03)] transition-colors group border border-transparent hover:border-[rgba(255,255,255,0.06)]"
    >
      {/* Rank */}
      <span
        className={`text-sm font-bold tabular-nums text-center ${rank <= 3 ? "text-[#F59E0B]" : "text-[#475569]"}`}
      >
        {rank}
      </span>

      {/* Model name */}
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-white truncate">{model.model}</span>
          {badge && (
            <span
              className="hidden sm:inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ color: badge.color, background: `${badge.color}12`, border: `1px solid ${badge.color}25` }}
            >
              <badge.icon className="w-2.5 h-2.5" />
              {badge.label}
            </span>
          )}
        </div>
        <span className="text-xs text-[#475569]">{model.provider}</span>
      </div>

      {/* Overall */}
      <div className="text-right">
        <span className="text-sm font-bold tabular-nums" style={{ color }}>
          {model.overall}
        </span>
        <ScoreBar score={model.overall} color={color} />
      </div>

      {/* Accuracy */}
      <div className="hidden md:block text-right">
        <span className="text-xs text-[#94A3B8] tabular-nums">{model.accuracy}</span>
        <ScoreBar score={model.accuracy} color="#06B6D4" />
      </div>

      {/* Hallucination */}
      <div className="hidden md:block text-right">
        <span className="text-xs text-[#94A3B8] tabular-nums">{model.hallucination}</span>
        <ScoreBar score={model.hallucination} color="#10B981" />
      </div>

      {/* Trend + latency */}
      <div className="flex items-center justify-end gap-2">
        <TrendIcon trend={model.trend} />
        <span className="text-xs text-[#475569] tabular-nums">{model.latency}ms</span>
      </div>
    </motion.div>
  );
}

export function FeaturedLeaderboard() {
  const [activeTab, setActiveTab] = useState("healthcare");
  const current = tabs.find((t) => t.id === activeTab)!;

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="orb w-[400px] h-[400px] bg-[#7C3AED] opacity-[0.05] top-0 left-[-100px]" />

      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <p className="text-sm font-medium text-[#7C3AED] uppercase tracking-widest mb-4">
            Live Leaderboards
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-white">
            The rankings that{" "}
            <span className="text-gradient-cyan">professionals trust</span>
          </h2>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] overflow-hidden"
        >
          {/* Tabs */}
          <div className="px-4 pt-4 border-b border-[rgba(255,255,255,0.06)]">
            <div className="flex gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                    activeTab === tab.id
                      ? "bg-[rgba(124,58,237,0.15)] text-[#A78BFA] border border-[rgba(124,58,237,0.3)]"
                      : "text-[#94A3B8] hover:text-white hover:bg-[rgba(255,255,255,0.04)]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Column headers */}
          <div className="grid grid-cols-[32px_1fr_80px_80px_80px_100px] gap-3 items-center px-4 py-3 border-b border-[rgba(255,255,255,0.04)]">
            <span className="text-xs text-[#475569] text-center">#</span>
            <span className="text-xs text-[#475569]">Model</span>
            <span className="text-xs text-[#475569] text-right">Overall</span>
            <span className="text-xs text-[#475569] text-right hidden md:block">Accuracy</span>
            <span className="text-xs text-[#475569] text-right hidden md:block">Trust</span>
            <span className="text-xs text-[#475569] text-right">Latency</span>
          </div>

          {/* Rows */}
          <div className="p-3">
            <AnimatePresence mode="wait">
              <motion.div key={activeTab}>
                {current.data.map((model, i) => (
                  <ModelRow key={model.model} model={model} rank={i + 1} />
                ))}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-[rgba(255,255,255,0.05)] flex items-center justify-between">
            <p className="text-xs text-[#475569]">
              Updated 3 minutes ago · {current.data[0].evaluations.toLocaleString()} evaluations
            </p>
            <Link
              href={`/benchmark?vertical=${activeTab}`}
              className="text-xs text-[#7C3AED] hover:text-[#A78BFA] transition-colors"
            >
              Full leaderboard →
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
