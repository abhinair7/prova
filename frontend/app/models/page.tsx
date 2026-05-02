"use client";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { models, verticals } from "@/lib/data";
import { formatNumber } from "@/lib/utils";

const TYPES = ["all", "frontier", "open", "specialist"] as const;
type ModelType = (typeof TYPES)[number];

const PROVIDERS = ["all", ...Array.from(new Set(models.map(m => m.provider)))];

export default function ModelsPage() {
  const [type, setType] = useState<ModelType>("all");
  const [provider, setProvider] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"pci" | "name" | "released">("pci");

  const filtered = useMemo(() => {
    let list = models.slice();
    if (type !== "all") list = list.filter(m => m.type === type);
    if (provider !== "all") list = list.filter(m => m.provider === provider);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        m =>
          m.name.toLowerCase().includes(q) ||
          m.provider.toLowerCase().includes(q) ||
          m.family.toLowerCase().includes(q),
      );
    }
    if (sort === "pci") list.sort((a, b) => b.averagePCI - a.averagePCI);
    if (sort === "name") list.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "released") list.sort((a, b) => b.released.localeCompare(a.released));
    return list;
  }, [type, provider, query, sort]);

  const verticalLookup = useMemo(
    () => Object.fromEntries(verticals.map(v => [v.id, v])),
    [],
  );

  return (
    <div className="min-h-screen bg-[#0A0612] text-white">
      <Navbar />

      <main className="pt-32 pb-24">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
            <p className="text-xs uppercase tracking-widest text-[#06B6D4] mb-3">Model Atlas</p>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight">
              All <span className="text-gradient-purple">{models.length} models</span> benchmarked
            </h1>
            <p className="mt-4 text-[#94A3B8] max-w-2xl">
              Frontier, open-source, and vertical specialists — each benchmarked across 24 verticals
              with confidence intervals on every score.
            </p>
          </motion.div>

          {/* Controls */}
          <div className="flex flex-col gap-3 mb-6">
            <div className="flex flex-wrap gap-2">
              {TYPES.map(t => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`px-3 py-1.5 rounded-full text-xs uppercase tracking-wide border transition ${
                    type === t
                      ? "bg-[#06B6D4] text-black border-[#06B6D4]"
                      : "border-[rgba(255,255,255,0.08)] text-[#94A3B8] hover:text-white"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="flex flex-col md:flex-row gap-3 md:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search models, providers, families…"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] text-sm placeholder:text-[#475569] focus:outline-none focus:border-[#06B6D4]/60"
                />
              </div>

              <select
                value={provider}
                onChange={e => setProvider(e.target.value)}
                className="px-3 py-2 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] text-sm focus:outline-none focus:border-[#06B6D4]/60"
              >
                {PROVIDERS.map(p => (
                  <option key={p} value={p}>{p === "all" ? "All providers" : p}</option>
                ))}
              </select>

              <select
                value={sort}
                onChange={e => setSort(e.target.value as typeof sort)}
                className="px-3 py-2 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] text-sm focus:outline-none focus:border-[#06B6D4]/60"
              >
                <option value="pci">Sort: PCI ↓</option>
                <option value="name">Sort: Name</option>
                <option value="released">Sort: Released ↓</option>
              </select>
            </div>
          </div>

          <div className="text-xs text-[#64748B] mb-3">
            Showing {filtered.length} of {models.length}
          </div>

          {/* Table */}
          <div className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] overflow-hidden">
            <div className="grid grid-cols-12 gap-4 px-5 py-3 text-[10px] uppercase tracking-widest text-[#64748B] border-b border-[rgba(255,255,255,0.05)]">
              <div className="col-span-4">Model</div>
              <div className="col-span-2">Provider</div>
              <div className="col-span-1">Type</div>
              <div className="col-span-1 text-right">Context</div>
              <div className="col-span-1 text-right">Released</div>
              <div className="col-span-2">Best at</div>
              <div className="col-span-1 text-right">PCI</div>
            </div>

            {filtered.map((m, i) => (
              <div
                key={m.id}
                className={`grid grid-cols-12 gap-4 px-5 py-3 items-center text-sm ${
                  i % 2 === 0 ? "bg-[rgba(255,255,255,0.012)]" : ""
                } hover:bg-[rgba(124,58,237,0.04)] transition-colors`}
              >
                <div className="col-span-4">
                  <div className="font-medium text-white">{m.name}</div>
                  <div className="text-xs text-[#64748B]">{m.family} • {formatNumber(m.evaluations)} evals</div>
                </div>
                <div className="col-span-2 text-[#94A3B8]">{m.provider}</div>
                <div className="col-span-1">
                  <span
                    className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full ${
                      m.type === "frontier" ? "bg-[#7C3AED]/15 text-[#A78BFA]"
                      : m.type === "specialist" ? "bg-[#F59E0B]/15 text-[#FBBF24]"
                      : "bg-[#10B981]/15 text-[#34D399]"
                    }`}
                  >
                    {m.type}
                  </span>
                </div>
                <div className="col-span-1 text-right text-[#94A3B8] tabular-nums">
                  {(m.contextWindow / 1000).toLocaleString()}K
                </div>
                <div className="col-span-1 text-right text-[#94A3B8] tabular-nums">{m.released}</div>
                <div className="col-span-2 text-xs text-[#94A3B8] truncate">
                  {m.topVerticals.slice(0, 2).map(id => verticalLookup[id]?.name ?? id).join(", ")}
                </div>
                <div className="col-span-1 text-right">
                  <span className="font-bold text-white tabular-nums">{m.averagePCI.toFixed(1)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
