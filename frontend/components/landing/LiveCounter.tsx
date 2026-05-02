"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Users, ArrowRight } from "lucide-react";
import { verticals } from "@/lib/data";

interface Counts {
  total: number;
  byVertical: Record<string, number>;
}

export function LiveCounter() {
  const [counts, setCounts] = useState<Counts | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/waitlist/counts", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as Counts;
        if (!cancelled) setCounts(data);
      } catch {
        // Silent — landing still renders the static fallback below
      }
    }
    load();
    const id = setInterval(load, 30_000); // poll every 30s — light, no websocket needed for v1
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  // Show the top 6 verticals by current sign-up count, falling back to seed evaluator counts.
  const sorted = [...verticals]
    .map(v => ({
      ...v,
      live: counts?.byVertical[v.id] ?? 0,
      // The static evaluator number is the long-run target; the live count is what users see growing.
    }))
    .sort((a, b) => b.live - a.live || b.evaluators - a.evaluators)
    .slice(0, 6);

  return (
    <section className="py-16 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6"
        >
          <div>
            <p className="text-xs uppercase tracking-widest text-[#10B981] mb-2 inline-flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] live-dot" />
              Live · updates every 30s
            </p>
            <h2 className="text-2xl md:text-3xl font-bold text-white">
              {counts === null
                ? "Verified professionals signing up"
                : counts.total === 0
                ? "Be one of the first verified evaluators"
                : `${counts.total.toLocaleString()} verified professionals have joined`}
            </h2>
            <p className="text-sm text-[#94A3B8] mt-2 max-w-2xl">
              Each vertical needs its first 5,000 to make the leaderboard statistically meaningful. Pick yours below — or sign in to claim a slot.
            </p>
          </div>
          <Link
            href="/profile?signin=linkedin"
            className="inline-flex items-center gap-1.5 self-start md:self-auto px-4 py-2 rounded-xl text-sm font-medium text-white bg-[#0A66C2] hover:bg-[#0959A8] transition-colors"
          >
            <Users className="w-4 h-4" /> Claim my slot
          </Link>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {sorted.map((v, i) => (
            <motion.div
              key={v.id}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
            >
              <Link href={`/profile?signin=linkedin&vertical=${v.id}`} className="block">
                <div className="p-4 rounded-2xl border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.04)] transition-all">
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-base"
                      style={{ background: `${v.color}1A` }}
                    >
                      {v.icon}
                    </div>
                    <span className="text-xs font-semibold text-white truncate">{v.name}</span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-bold tabular-nums" style={{ color: v.color }}>
                      {(v.live > 0 ? v.live : Math.floor(v.evaluators / 100)).toLocaleString()}
                    </span>
                    <span className="text-[10px] text-[#475569]">
                      {v.live > 0 ? "verified" : "target"}
                    </span>
                  </div>
                  <div className="mt-2 h-1 rounded-full bg-[rgba(255,255,255,0.05)] overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(100, ((v.live > 0 ? v.live : Math.floor(v.evaluators / 100)) / Math.max(v.evaluators / 50, 1)) * 100)}%`,
                        background: v.color,
                      }}
                    />
                  </div>
                  <div className="mt-2 inline-flex items-center gap-1 text-[10px] text-[#475569] hover:text-white transition-colors">
                    Join <ArrowRight className="w-2.5 h-2.5" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
