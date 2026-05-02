"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Star, ExternalLink, ShieldCheck, Trophy, Zap } from "lucide-react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { GlowButton } from "@/components/ui/GlowButton";
import { agents, verticals } from "@/lib/data";
import { formatNumber, scoreColor } from "@/lib/utils";

const filterTabs = ["All", "Legal", "Healthcare", "Finance", "Engineering", "Accounting", "HR & People"];

export default function AgentsPage() {
  const [activeFilter, setActiveFilter] = useState("All");

  const filtered = activeFilter === "All"
    ? agents
    : agents.filter((a) => a.vertical === activeFilter);

  return (
    <div className="min-h-screen bg-[#000000]">
      <Navbar />

      {/* Hero */}
      <section className="pt-28 pb-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#080810] to-[#000000]" />
        <div className="orb w-[400px] h-[400px] bg-[#F59E0B] opacity-[0.05] top-0 right-0" />

        <div className="relative max-w-7xl mx-auto px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <Badge variant="gold" className="mb-4">
              <Trophy className="w-3 h-3" />
              Prova Certified Agents
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              The agent marketplace{" "}
              <span className="text-gradient-gold">professionals trust</span>
            </h1>
            <p className="text-[#94A3B8] text-lg max-w-2xl mx-auto mb-8">
              Every agent here has been benchmarked by verified domain professionals on Prova.
              No vendor claims — just peer-reviewed scores from practitioners like you.
            </p>

            {/* Marketplace stats */}
            <div className="inline-flex items-center gap-6 glass-purple rounded-2xl px-6 py-3">
              {[
                { value: "127", label: "Agents listed" },
                { value: "24", label: "Verticals" },
                { value: "6", label: "Prova Certified" },
              ].map(({ value, label }) => (
                <div key={label} className="text-center">
                  <p className="text-lg font-bold text-white">{value}</p>
                  <p className="text-xs text-[#64748B]">{label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 pb-24">
        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-8">
          {filterTabs.map((f) => {
            const v = verticals.find((vt) => vt.name === f);
            return (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  activeFilter === f
                    ? "bg-[rgba(124,58,237,0.15)] text-[#A78BFA] border border-[rgba(124,58,237,0.4)]"
                    : "text-[#94A3B8] hover:text-white bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.07)] hover:bg-[rgba(255,255,255,0.06)]"
                }`}
              >
                {v?.icon && <span>{v.icon}</span>}
                {f}
              </button>
            );
          })}
        </div>

        {/* Agent grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((agent, i) => {
            const v = verticals.find((vt) => vt.name === agent.vertical);
            const color = v?.color ?? "#7C3AED";
            const isCertified = !!agent.badge;

            return (
              <GlassCard key={agent.id} delay={i * 0.06} glow={isCertified ? "purple" : "none"} className="p-5">
                {/* Top row */}
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-xl font-bold"
                    style={{ background: `${color}18`, border: `1px solid ${color}30` }}
                  >
                    {agent.name[0]}
                  </div>
                  {isCertified && (
                    <Badge variant="purple">
                      <ShieldCheck className="w-2.5 h-2.5" />
                      Prova Certified
                    </Badge>
                  )}
                </div>

                {/* Name + tagline */}
                <h3 className="text-base font-semibold text-white mb-0.5">{agent.name}</h3>
                <p className="text-xs text-[#64748B] mb-4">{agent.tagline}</p>

                {/* Score */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 h-2 rounded-full bg-[rgba(255,255,255,0.06)] overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: scoreColor(agent.score) }}
                      initial={{ width: 0 }}
                      animate={{ width: `${agent.score}%` }}
                      transition={{ duration: 1, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] }}
                    />
                  </div>
                  <span className="text-sm font-bold tabular-nums" style={{ color: scoreColor(agent.score) }}>
                    {agent.score}
                  </span>
                </div>

                {/* Meta */}
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-1 text-xs text-[#94A3B8]">
                    <Star className="w-3 h-3 fill-[#F59E0B] text-[#F59E0B]" />
                    {formatNumber(agent.reviews)} professional reviews
                  </div>
                  <div
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{ color, background: `${color}12` }}
                  >
                    {agent.vertical}
                  </div>
                </div>

                {/* Built on */}
                <div className="flex items-center gap-2 mb-5 text-xs text-[#475569]">
                  <Zap className="w-3 h-3" />
                  Built on {agent.builtOn}
                </div>

                {/* CTA */}
                <GlowButton variant="secondary" size="sm" className="w-full">
                  View on Prova
                  <ExternalLink className="w-3.5 h-3.5" />
                </GlowButton>
              </GlassCard>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 text-center p-10 rounded-2xl border border-[rgba(245,158,11,0.2)] bg-[rgba(245,158,11,0.04)]"
        >
          <h3 className="text-2xl font-bold text-white mb-3">
            Building an AI agent for professionals?
          </h3>
          <p className="text-[#94A3B8] mb-6 max-w-lg mx-auto">
            Get Prova Certified. Pass our benchmark threshold and display the badge
            that domain professionals actually recognize and trust.
          </p>
          <GlowButton>
            Submit your agent for certification
          </GlowButton>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
}
