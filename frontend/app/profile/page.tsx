"use client";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Linkedin, ShieldCheck, BadgeCheck, Star, Share2, Copy, ArrowRight,
  Trophy, Vote, Sparkles, Users, ExternalLink, Lock, Loader2, AlertCircle,
} from "lucide-react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { GlowButton } from "@/components/ui/GlowButton";
import { agents, leaderboardFor, verticals } from "@/lib/data";
import { scoreColor } from "@/lib/utils";

interface SignedInProfile {
  id: string;
  name: string;
  headline: string;
  linkedinUrl?: string;
  primaryVertical: string;
  secondaryVerticals: string[];
  credential: string;
  evaluations: number;
  reputation: number;
  joinedAt: string;
  position?: number;
  verticalPosition?: number;
  total?: number;
}

interface WaitlistResponse {
  id: string;
  name: string;
  verticalId: string;
  position: number;
  verticalPosition: number;
  total: number;
  shareUrl: string;
}

// Each vertical asks for a different credential — this is the "second check" beyond LinkedIn OAuth.
const CREDENTIAL_LABEL: Record<string, string> = {
  healthcare: "NPI number (10 digits)",
  legal: "Bar number + state",
  finance: "FINRA CRD or CFA number",
  accounting: "CPA license + state",
  insurance: "NPN (National Producer Number)",
  "real-estate": "Real estate license + state",
};

function SignInGate({ onSignedIn }: { onSignedIn: (p: SignedInProfile) => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [verticalId, setVerticalId] = useState<string>(() => {
    if (typeof window === "undefined") return "healthcare";
    const u = new URLSearchParams(window.location.search);
    const v = u.get("vertical");
    return v && verticals.some(x => x.id === v) ? v : "healthcare";
  });
  const [credential, setCredential] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const v = verticals.find(x => x.id === verticalId);
  const credLabel = CREDENTIAL_LABEL[verticalId] ?? "Credential ID (optional)";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, linkedinUrl, verticalId, credential }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? `Sign-in failed (${res.status})`);
      }
      const data = (await res.json()) as WaitlistResponse;

      // Persist for refreshes — production swap = secure session cookie set by the API.
      try {
        localStorage.setItem("prova.profile.id", data.id);
      } catch {}

      onSignedIn({
        id: data.id,
        name,
        headline: `${v?.name ?? "Professional"} · ${credential ? "credential pending review" : "self-attested"}`,
        linkedinUrl: linkedinUrl || undefined,
        primaryVertical: verticalId,
        secondaryVerticals: [],
        credential: credential ? `${credLabel.split(" ")[0]} provided · pending verification` : "Self-attested",
        evaluations: 0,
        reputation: 50,
        joinedAt: new Date().toLocaleString("en-US", { month: "long", year: "numeric" }),
        position: data.position,
        verticalPosition: data.verticalPosition,
        total: data.total,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-xl mx-auto rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] p-7"
    >
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-[#0A66C2] flex items-center justify-center">
          <Linkedin className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">Claim your verified slot</h2>
          <p className="text-xs text-[#64748B]">Sign in flow uses LinkedIn OAuth in production. For now, fill the same fields the OAuth would return.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-5">
        {[
          { icon: ShieldCheck, label: "Domain credential", note: "NPI / Bar / CRD per vertical" },
          { icon: BadgeCheck,  label: "Vote weight",       note: "Higher than anonymous voters" },
          { icon: Lock,        label: "Read-only",         note: "We never post on your behalf" },
        ].map(({ icon: Icon, label, note }) => (
          <div key={label} className="p-2.5 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)]">
            <Icon className="w-3.5 h-3.5 text-[#A78BFA] mb-1.5" />
            <p className="text-[11px] font-medium text-white">{label}</p>
            <p className="text-[9px] text-[#64748B] mt-0.5">{note}</p>
          </div>
        ))}
      </div>

      <form onSubmit={submit} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-[#475569] mb-1">Name</label>
            <input
              required minLength={2} maxLength={80}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Dr. Maya Chen"
              className="w-full bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-lg px-3 py-2 text-sm text-white placeholder:text-[#475569] focus:outline-none focus:border-[rgba(124,58,237,0.5)] transition-colors"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-[#475569] mb-1">Work email</label>
            <input
              required type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="maya@stanfordhealth.org"
              className="w-full bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-lg px-3 py-2 text-sm text-white placeholder:text-[#475569] focus:outline-none focus:border-[rgba(124,58,237,0.5)] transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] uppercase tracking-widest text-[#475569] mb-1">LinkedIn URL <span className="text-[#475569] normal-case">(optional but recommended)</span></label>
          <input
            type="url"
            value={linkedinUrl}
            onChange={(e) => setLinkedinUrl(e.target.value)}
            placeholder="https://www.linkedin.com/in/maya-chen"
            className="w-full bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-lg px-3 py-2 text-sm text-white placeholder:text-[#475569] focus:outline-none focus:border-[rgba(124,58,237,0.5)] transition-colors"
          />
        </div>

        <div>
          <label className="block text-[10px] uppercase tracking-widest text-[#475569] mb-2">Your vertical</label>
          <div className="flex flex-wrap gap-1.5">
            {verticals.map((vt) => (
              <button
                type="button" key={vt.id}
                onClick={() => setVerticalId(vt.id)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                  verticalId === vt.id
                    ? "bg-[rgba(124,58,237,0.20)] text-white border border-[rgba(124,58,237,0.45)]"
                    : "bg-[rgba(255,255,255,0.03)] text-[#94A3B8] border border-[rgba(255,255,255,0.06)] hover:text-white"
                }`}
              >
                <span className="mr-1">{vt.icon}</span>{vt.name}
              </button>
            ))}
          </div>
        </div>

        {CREDENTIAL_LABEL[verticalId] && (
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-[#475569] mb-1">
              {credLabel} <span className="text-[#475569] normal-case">(optional — speeds up review)</span>
            </label>
            <input
              value={credential}
              onChange={(e) => setCredential(e.target.value)}
              placeholder={`Enter your ${credLabel.toLowerCase()}`}
              className="w-full bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-lg px-3 py-2 text-sm text-white placeholder:text-[#475569] focus:outline-none focus:border-[rgba(124,58,237,0.5)] transition-colors"
            />
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-xs text-[#F87171] bg-[rgba(248,113,113,0.06)] border border-[rgba(248,113,113,0.20)] rounded-lg px-3 py-2">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-white bg-[#0A66C2] hover:bg-[#0959A8] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Linkedin className="w-4 h-4" />}
          {submitting ? "Reserving your slot…" : "Continue with LinkedIn"}
        </button>

        <p className="text-[10px] text-[#475569] text-center">
          By signing in you agree to the Prova methodology disclosure and rotating-data terms.
          Production sign-in uses LinkedIn OAuth — your email is captured either way.
        </p>
      </form>
    </motion.div>
  );
}

function VerifiedHeader({ profile }: { profile: SignedInProfile }) {
  const v = verticals.find(x => x.id === profile.primaryVertical);
  return (
    <div className="rounded-2xl border border-[rgba(124,58,237,0.25)] bg-gradient-to-r from-[rgba(124,58,237,0.08)] to-[rgba(6,182,212,0.04)] p-6">
      <div className="flex flex-col md:flex-row md:items-center gap-5">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#06B6D4] flex items-center justify-center text-2xl font-bold text-white">
          {profile.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h1 className="text-xl font-semibold text-white">{profile.name}</h1>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[rgba(16,185,129,0.10)] border border-[rgba(16,185,129,0.30)] text-[10px] font-medium text-[#4ADE80]">
              <BadgeCheck className="w-3 h-3" /> Verified
            </span>
            <span className="text-[10px] text-[#475569]">· {profile.credential}</span>
          </div>
          <p className="text-sm text-[#94A3B8]">{profile.headline}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {v && (
              <span
                className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full"
                style={{ background: `${v.color}18`, color: v.color }}
              >
                {v.icon} {v.name}
              </span>
            )}
            {profile.secondaryVerticals.map(id => {
              const sv = verticals.find(x => x.id === id);
              if (!sv) return null;
              return (
                <span key={id} className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-[rgba(255,255,255,0.04)] text-[#94A3B8] border border-[rgba(255,255,255,0.06)]">
                  {sv.name}
                </span>
              );
            })}
          </div>
        </div>
        <div className="grid grid-cols-3 md:flex md:flex-row gap-4 md:gap-6 md:items-center">
          {[
            { label: "Evaluations", value: profile.evaluations, icon: Vote, color: "#A78BFA" },
            { label: "Reputation",  value: profile.reputation,  icon: Star, color: "#F59E0B" },
            { label: "Member since", value: profile.joinedAt,   icon: null,  color: "#94A3B8" },
          ].map((s) => (
            <div key={s.label} className="text-center md:text-left">
              <p className="text-[10px] uppercase tracking-widest text-[#475569]">{s.label}</p>
              <p className="text-lg font-bold tabular-nums text-white">{s.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PersonalScorecard({ verticalId, shareId }: { verticalId: string; shareId: string }) {
  const board = useMemo(() => leaderboardFor(verticalId).slice(0, 5), [verticalId]);
  const v = verticals.find(x => x.id === verticalId);
  const [copied, setCopied] = useState(false);

  async function copyShare() {
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}/scorecard/${shareId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      window.prompt("Copy this link", url);
    }
  }

  function shareToLinkedIn() {
    if (typeof window === "undefined") return;
    const url = encodeURIComponent(`${window.location.origin}/scorecard/${shareId}`);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, "_blank", "noopener,noreferrer");
  }

  if (!v) return null;
  return (
    <div className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] overflow-hidden">
      <div className="px-5 py-4 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-[#FBBF24]" />
            <h2 className="text-sm font-semibold text-white">Your personal AI scorecard</h2>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            Top 5 models for {v.name}, weighted by your votes and {v.evaluators.toLocaleString()} peers.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={copyShare}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-white bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.10)] transition-colors"
          >
            <Copy className="w-3.5 h-3.5" /> {copied ? "Copied" : "Copy link"}
          </button>
          <button
            onClick={shareToLinkedIn}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-white bg-[#0A66C2] hover:bg-[#0959A8] transition-colors"
          >
            <Linkedin className="w-3.5 h-3.5" /> Post to LinkedIn
          </button>
        </div>
      </div>
      <div className="divide-y divide-[rgba(255,255,255,0.05)]">
        {board.map((row, i) => (
          <div key={row.model} className="px-5 py-3 grid grid-cols-12 gap-3 items-center text-sm">
            <span className="col-span-1 text-xs font-bold text-[#7C3AED] tabular-nums">#{i + 1}</span>
            <div className="col-span-5 min-w-0">
              <p className="font-medium text-white truncate">{row.model}</p>
              <p className="text-xs text-[#64748B]">{row.provider} · {row.evaluations.toLocaleString()} evals</p>
            </div>
            <div className="col-span-4">
              <div className="h-1.5 rounded-full bg-[rgba(255,255,255,0.06)] overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#7C3AED] to-[#06B6D4]"
                  style={{ width: `${row.overall}%` }}
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
      <div className="px-5 py-3 border-t border-[rgba(255,255,255,0.05)] text-xs text-[#475569] flex items-center justify-between">
        <span>This card updates as you vote. The full leaderboard reflects all verified peers.</span>
        <Link href={`/benchmark?vertical=${verticalId}`} className="text-[#7C3AED] hover:text-[#A78BFA] inline-flex items-center gap-1">
          Full leaderboard <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}

function AgentFeed({ verticalId }: { verticalId: string }) {
  const v = verticals.find(x => x.id === verticalId);
  const matched = agents.filter(a => v && a.vertical === v.name);
  const others = agents.filter(a => !matched.includes(a)).slice(0, 4);
  return (
    <div className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] overflow-hidden">
      <div className="px-5 py-4 border-b border-[rgba(255,255,255,0.06)]">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#06B6D4]" />
          <h2 className="text-sm font-semibold text-white">Agents you should know</h2>
        </div>
        <p className="text-xs text-[#64748B] mt-0.5">
          Vertical-specialist agents matched to your profession. Verified peers ranked them.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-[rgba(255,255,255,0.05)]">
        {[...matched, ...others].slice(0, 6).map((a) => (
          <div key={a.id} className="bg-[#0A0612] p-4 hover:bg-[rgba(255,255,255,0.02)] transition-colors">
            <div className="flex items-start justify-between mb-1.5">
              <p className="text-sm font-semibold text-white">{a.name}</p>
              {a.badge && (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#A78BFA] px-1.5 py-0.5 rounded-full bg-[rgba(124,58,237,0.10)] border border-[rgba(124,58,237,0.20)]">
                  <ShieldCheck className="w-3 h-3" /> {a.badge}
                </span>
              )}
            </div>
            <p className="text-xs text-[#94A3B8] mb-2">{a.tagline}</p>
            <div className="flex items-center justify-between text-[11px] text-[#64748B]">
              <span>{a.vertical} · built on {a.builtOn}</span>
              <span className="inline-flex items-center gap-1">
                <Users className="w-3 h-3" /> {a.reviews.toLocaleString()}
                <span className="ml-2 font-bold" style={{ color: scoreColor(a.score) }}>
                  {a.score.toFixed(1)}
                </span>
              </span>
            </div>
            <button className="mt-3 inline-flex items-center gap-1 text-[11px] text-[#06B6D4] hover:text-white transition-colors">
              Try it <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
      <div className="px-5 py-3 border-t border-[rgba(255,255,255,0.05)] text-xs text-[#475569] flex items-center justify-between">
        <span>This is the agent marketplace surfacing into your verified-professional feed.</span>
        <Link href="/agents" className="text-[#06B6D4] hover:text-white inline-flex items-center gap-1">
          Browse all agents <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<SignedInProfile | null>(null);

  return (
    <div className="min-h-screen bg-[#0A0612] text-white">
      <Navbar />

      <main className="pt-28 pb-24">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <p className="text-xs uppercase tracking-widest text-[#0A66C2] mb-3">
              Verified-professional layer · LinkedIn for AI Agents
            </p>
            <h1 className="text-3xl md:text-4xl font-bold leading-tight">
              {profile ? "Your Prova profile" : "Claim your verified slot"}
            </h1>
            <p className="mt-3 text-[#94A3B8] max-w-2xl">
              {profile
                ? "Your verified-professional identity, your personal scorecard, and the agent marketplace — one surface."
                : "We're seeding the first 5,000 verified evaluators per vertical. Sign in with LinkedIn to claim a slot, get your personalized AI scorecard, and have your votes count toward the public leaderboards."}
            </p>
          </motion.div>

          <AnimatePresence mode="wait">
            {!profile ? (
              <SignInGate key="gate" onSignedIn={setProfile} />
            ) : (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {profile.position !== undefined && (
                  <div className="rounded-2xl border border-[rgba(16,185,129,0.25)] bg-[rgba(16,185,129,0.06)] p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <BadgeCheck className="w-5 h-5 text-[#4ADE80] flex-shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-white">You're in.</p>
                        <p className="text-xs text-[#94A3B8]">
                          Slot <span className="text-white font-bold">#{profile.position}</span> overall ·{" "}
                          <span className="text-white font-bold">#{profile.verticalPosition}</span> in {verticals.find(v=>v.id===profile.primaryVertical)?.name} ·{" "}
                          {profile.total} verified professionals so far
                        </p>
                      </div>
                    </div>
                    <Link
                      href={`/scorecard/${profile.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-[#0A66C2] hover:bg-[#0959A8] transition-colors"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      Share my scorecard
                    </Link>
                  </div>
                )}
                <VerifiedHeader profile={profile} />
                <PersonalScorecard verticalId={profile.primaryVertical} shareId={profile.id} />
                <AgentFeed verticalId={profile.primaryVertical} />

                <div className="rounded-2xl border border-[rgba(124,58,237,0.18)] bg-[rgba(124,58,237,0.04)] p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white mb-0.5">Run your next evaluation</p>
                    <p className="text-xs text-[#94A3B8]">
                      Pick how you want to participate — vote on a curated case, synthesize a private equivalent, or run locally with your own keys.
                    </p>
                  </div>
                  <Link href="/evaluate">
                    <GlowButton size="sm">
                      Open evaluator <ArrowRight className="w-3.5 h-3.5" />
                    </GlowButton>
                  </Link>
                </div>

                <div className="text-center pt-2">
                  <button
                    onClick={() => {
                      try { localStorage.removeItem("prova.profile.id"); } catch {}
                      setProfile(null);
                    }}
                    className="text-xs text-[#475569] hover:text-white transition-colors"
                  >
                    Sign out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <Footer />
    </div>
  );
}

// Allow ?signin=linkedin deep-linking via Suspense default — App Router handles this client-side.
