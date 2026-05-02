import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, BadgeCheck, Trophy, Share2, Linkedin, ExternalLink } from "lucide-react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { GlowButton } from "@/components/ui/GlowButton";
import { agents, leaderboardFor, verticals } from "@/lib/data";
import { scoreColor, formatNumber } from "@/lib/utils";
import { getEntry, getPositionFor } from "@/lib/waitlist";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const entry = await getEntry(id);
  if (!entry) {
    return {
      title: "Scorecard — Prova",
      description: "Verified-professional AI scorecards on Prova.",
    };
  }
  const v = verticals.find(x => x.id === entry.verticalId);
  const verticalName = v?.name ?? "AI";
  const title = `${entry.name}'s ${verticalName} AI scorecard`;
  const description = `${entry.name} is a verified ${verticalName.toLowerCase()} professional ranking AI on real-work tasks. See the leaderboard.`;
  const ogUrl = `/api/og?id=${encodeURIComponent(id)}`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "profile",
      images: [{ url: ogUrl, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogUrl],
    },
  };
}

export default async function ScorecardPage({ params }: PageProps) {
  const { id } = await params;
  const entry = await getEntry(id);
  if (!entry) notFound();

  const v = verticals.find(x => x.id === entry.verticalId);
  if (!v) notFound();

  const board = leaderboardFor(entry.verticalId).slice(0, 5);
  const matchedAgents = agents.filter(a => a.vertical === v.name).slice(0, 3);
  const pos = await getPositionFor(id);

  return (
    <div className="min-h-screen bg-[#0A0612] text-white">
      <Navbar />

      <main className="pt-28 pb-24">
        <div className="max-w-3xl mx-auto px-6">

          {/* The shareable card itself — designed to look good as a screenshot */}
          <div
            className="relative rounded-3xl overflow-hidden border border-[rgba(124,58,237,0.30)] p-8 md:p-10"
            style={{
              background: `radial-gradient(circle at 30% 0%, ${v.color}22, transparent 60%), radial-gradient(circle at 90% 100%, rgba(124,58,237,0.18), transparent 60%), #0A0612`,
            }}
          >
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.06]"
              style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)", backgroundSize: "32px 32px" }}
            />

            <div className="relative">
              {/* Header strip */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#7C3AED] flex items-center justify-center shadow-[0_0_16px_rgba(124,58,237,0.6)]">
                    <span className="text-white text-xs font-bold">P</span>
                  </div>
                  <span className="text-sm font-semibold tracking-tight">prova<span className="text-[#7C3AED]">.ai</span></span>
                </div>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[rgba(16,185,129,0.10)] border border-[rgba(16,185,129,0.30)] text-[10px] font-medium text-[#4ADE80]">
                  <BadgeCheck className="w-3 h-3" /> Verified evaluator
                </span>
              </div>

              <p className="text-xs uppercase tracking-widest text-[#A78BFA] mb-2">
                {v.name} AI Scorecard · {v.icon}
              </p>
              <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-1">
                {entry.name}
              </h1>
              <p className="text-sm text-[#94A3B8] mb-6">
                Top AI models for {v.name.toLowerCase()} work · ranked by {formatNumber(v.evaluators)} verified peers
              </p>

              {/* The leaderboard */}
              <div className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(0,0,0,0.30)] backdrop-blur-sm overflow-hidden mb-5">
                <div className="px-4 py-3 border-b border-[rgba(255,255,255,0.06)] flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-[#FBBF24]" />
                  <span className="text-xs font-semibold">Top 5 for {v.name}</span>
                </div>
                <div className="divide-y divide-[rgba(255,255,255,0.05)]">
                  {board.map((row, i) => (
                    <div key={row.model} className="px-4 py-3 grid grid-cols-12 gap-3 items-center text-sm">
                      <span className="col-span-1 text-xs font-bold text-[#7C3AED] tabular-nums">#{i + 1}</span>
                      <div className="col-span-6 min-w-0">
                        <p className="font-medium truncate">{row.model}</p>
                        <p className="text-[10px] text-[#64748B]">{row.provider}</p>
                      </div>
                      <div className="col-span-3">
                        <div className="h-1.5 rounded-full bg-[rgba(255,255,255,0.06)] overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${row.overall}%`, background: `linear-gradient(90deg, #7C3AED, ${v.color})` }}
                          />
                        </div>
                      </div>
                      <div className="col-span-2 text-right">
                        <span className="font-bold tabular-nums" style={{ color: scoreColor(row.overall) }}>
                          {row.overall.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <p className="text-[11px] text-[#475569]">
                Slot #{pos.position} · #{pos.verticalPosition} in {v.name} · among {pos.total} verified professionals
              </p>
            </div>
          </div>

          {/* Below-the-fold: post / share / try-it-yourself CTAs */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`https://prova.ai/scorecard/${id}`)}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-white bg-[#0A66C2] hover:bg-[#0959A8] transition-colors"
            >
              <Linkedin className="w-4 h-4" /> Post to LinkedIn
            </a>
            <Link
              href={`/benchmark?vertical=${v.id}`}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-white bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.10)] hover:bg-[rgba(255,255,255,0.10)] transition-colors"
            >
              See full leaderboard <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link href="/profile?signin=linkedin">
              <GlowButton size="lg" className="w-full">
                Get my own scorecard <Share2 className="w-4 h-4" />
              </GlowButton>
            </Link>
          </div>

          {/* Recommended agents */}
          {matchedAgents.length > 0 && (
            <div className="mt-10 rounded-2xl border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.02)] p-5">
              <p className="text-xs uppercase tracking-widest text-[#06B6D4] mb-3">{v.name} agent picks</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {matchedAgents.map(a => (
                  <div key={a.id} className="p-3 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)]">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-semibold">{a.name}</p>
                      <span className="font-bold text-xs" style={{ color: scoreColor(a.score) }}>{a.score.toFixed(1)}</span>
                    </div>
                    <p className="text-xs text-[#94A3B8] mb-2">{a.tagline}</p>
                    <p className="text-[10px] text-[#64748B] flex items-center gap-1">
                      Built on {a.builtOn} <ExternalLink className="w-3 h-3" />
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
}
