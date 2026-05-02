"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, Search } from "lucide-react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { verticals } from "@/lib/data";
import { formatNumber } from "@/lib/utils";

const GROUPS = ["All", "Professional", "Technical", "Creative", "Operational"] as const;
type Group = (typeof GROUPS)[number];

export default function VerticalsPage() {
  const [group, setGroup] = useState<Group>("All");
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () =>
      verticals.filter(
        v =>
          (group === "All" || v.group === group) &&
          (!query.trim() ||
            v.name.toLowerCase().includes(query.toLowerCase()) ||
            v.description.toLowerCase().includes(query.toLowerCase())),
      ),
    [group, query],
  );

  return (
    <div className="min-h-screen bg-[#0A0612] text-white">
      <Navbar />

      <main className="pt-32 pb-24">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-10"
          >
            <p className="text-xs uppercase tracking-widest text-[#7C3AED] mb-3">
              Domain Coverage
            </p>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight">
              All <span className="text-gradient-purple">{verticals.length} verticals</span>
            </h1>
            <p className="mt-4 text-[#94A3B8] max-w-2xl">
              Each vertical has its own leaderboard, evaluators, and Prova Composite Index.
              Generic benchmarks die at the door — every score here is voted on by domain practitioners.
            </p>
          </motion.div>

          {/* Filter row */}
          <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between mb-8">
            <div className="flex flex-wrap gap-2">
              {GROUPS.map(g => (
                <button
                  key={g}
                  onClick={() => setGroup(g)}
                  className={`px-3.5 py-1.5 rounded-full text-sm border transition ${
                    group === g
                      ? "bg-[#7C3AED] text-white border-[#7C3AED]"
                      : "border-[rgba(255,255,255,0.08)] text-[#94A3B8] hover:text-white hover:border-[rgba(255,255,255,0.16)]"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search verticals…"
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] text-sm placeholder:text-[#475569] focus:outline-none focus:border-[#7C3AED]/60"
              />
            </div>
          </div>

          {/* Grid */}
          {filtered.length === 0 ? (
            <p className="text-[#64748B] text-sm">No verticals match those filters.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map((v, i) => (
                <motion.div
                  key={v.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: Math.min(i, 12) * 0.03 }}
                >
                  <Link href={`/benchmark?vertical=${v.id}`}>
                    <div
                      className="group relative p-5 rounded-2xl border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.04)] transition-all overflow-hidden h-full"
                    >
                      <div
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                        style={{ background: `radial-gradient(circle at 50% 0%, ${v.color}18, transparent 70%)` }}
                      />
                      <div className="relative">
                        <div className="flex items-start justify-between mb-3">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                            style={{ background: `${v.color}18` }}
                          >
                            {v.icon}
                          </div>
                          <ArrowUpRight className="w-4 h-4 text-[#475569] group-hover:text-white transition-colors" />
                        </div>
                        <h3 className="text-sm font-semibold mb-1">{v.name}</h3>
                        <p className="text-xs text-[#64748B] mb-4 leading-relaxed line-clamp-2">{v.description}</p>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[#475569]">{formatNumber(v.evaluators)} evaluators</span>
                          <span
                            className="font-medium px-2 py-0.5 rounded-full"
                            style={{ color: v.color, background: `${v.color}15` }}
                          >
                            #{1} {v.topModel.split(" ")[0]}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
