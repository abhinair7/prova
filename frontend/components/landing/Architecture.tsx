"use client";
import { motion } from "framer-motion";
import {
  BadgeCheck, Database, Cpu, Sparkles, Megaphone, ShieldCheck, Store, GitBranch,
} from "lucide-react";

// The full Prova architecture, not just the 3-layer pitch from the v0.1 doc.
// Each layer maps to something the user (or the labs) actually interacts with.
const layers = [
  {
    n: 0,
    icon: BadgeCheck,
    name: "Verified-professional identity",
    blurb:
      "LinkedIn OAuth + per-vertical credential checks (NPI for clinicians, bar number for legal, FINRA CRD for finance). Vote weight is structurally higher than anonymous voters.",
    color: "#0A66C2",
    accent: "Doximity beats Reddit for clinical truth",
  },
  {
    n: 1,
    icon: Database,
    name: "The benchmark (the moat)",
    blurb:
      "Expert-validated test sets per vertical, ~500 cases at seed. Methodology is public; data is private and rotates quarterly so labs can't train toward it.",
    color: "#7C3AED",
    accent: "11 public benchmarks + 3 Prova-exclusive layers = 14-dim PCI",
  },
  {
    n: 2,
    icon: Cpu,
    name: "The runner (commodity)",
    blurb:
      "OpenAI · Anthropic · Google · Mistral · Cohere · Hugging Face — all 127 models, all routable in parallel. This layer is plumbing; we don't compete here, we wrap it.",
    color: "#06B6D4",
    accent: "127 models continuously benchmarked offline",
  },
  {
    n: 3,
    icon: Sparkles,
    name: "The interpretation (the consultative output)",
    blurb:
      "Not a number — a recommendation. \"Model X scores 84% on clinical reasoning but 91% on the radiology subtest you actually care about.\" This is what makes the scorecard shareable.",
    color: "#A78BFA",
    accent: "The scorecard is the unit of virality",
  },
  {
    n: 4,
    icon: Megaphone,
    name: "Virality + community",
    blurb:
      "Personal scorecard sharing · profession-vs-profession leaderboards · model-release moments · AI labs citing our scores in their launch posts. Four loops, structural compounding.",
    color: "#F59E0B",
    accent: "Same dynamic that put LMArena on every launch slide",
  },
  {
    n: 5,
    icon: ShieldCheck,
    name: "Trust attestation",
    blurb:
      "Confidence intervals on every score · sample-size disclosure · no cherry-picking policy · independent advisory board · path to Big-4 methodology audit. Moody's-style positioning.",
    color: "#10B981",
    accent: "The Llama 4 scandal is our positioning advantage",
  },
  {
    n: 6,
    icon: Store,
    name: "Agent marketplace (the destination)",
    blurb:
      "The same audience pivots into discovery + procurement of vertical AI agents. Listings · certifications · lead-gen · data licensing · pro subscriptions. The benchmark is the wedge; this is the business.",
    color: "#EC4899",
    accent: "LinkedIn for AI Agents — already seeded on /agents",
  },
  {
    n: 7,
    icon: GitBranch,
    name: "Data flywheel",
    blurb:
      "Anonymized aggregate procurement signals fed back to AI labs, VCs, and enterprise buyers. Every vote, every certification, every adoption pattern compounds the moat.",
    color: "#8B5CF6",
    accent: "The defensibility no fast-follower can copy",
  },
];

export function Architecture() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="orb w-[500px] h-[500px] bg-[#7C3AED] opacity-[0.05] top-[-100px] left-[-200px]" />
      <div className="orb w-[400px] h-[400px] bg-[#06B6D4] opacity-[0.04] bottom-[-100px] right-[-200px]" />

      <div className="max-w-7xl mx-auto px-6 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-sm font-medium text-[#06B6D4] uppercase tracking-widest mb-4">
            Architecture
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">
            Prova isn't three layers.{" "}
            <span className="text-gradient-purple">It's eight.</span>
          </h2>
          <p className="mt-4 text-[#94A3B8] max-w-2xl mx-auto text-lg">
            The pitch deck has a benchmark, a runner, and an interpretation. The product has{" "}
            <span className="text-white">identity, virality, trust, marketplace, and a data flywheel</span>{" "}
            on top of those. Every layer is shipping.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {layers.map((layer, i) => (
            <motion.div
              key={layer.n}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: (i % 4) * 0.06 }}
              className="relative p-5 rounded-2xl border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.04)] transition-all duration-300 overflow-hidden"
            >
              <div
                className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{ background: `radial-gradient(circle at 50% 0%, ${layer.color}14, transparent 70%)` }}
              />
              <div className="relative">
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: `${layer.color}1A`, border: `1px solid ${layer.color}33` }}
                  >
                    <layer.icon className="w-5 h-5" style={{ color: layer.color }} />
                  </div>
                  <span
                    className="text-[10px] font-bold tracking-widest"
                    style={{ color: layer.color }}
                  >
                    L{layer.n}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-white mb-1.5">{layer.name}</h3>
                <p className="text-xs text-[#94A3B8] leading-relaxed mb-3">{layer.blurb}</p>
                <p
                  className="text-[10px] font-medium pt-2 border-t border-[rgba(255,255,255,0.06)] italic"
                  style={{ color: layer.color }}
                >
                  {layer.accent}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 max-w-3xl mx-auto text-center text-sm text-[#475569]"
        >
          The benchmark is the wedge.{" "}
          <span className="text-[#94A3B8]">The marketplace is the destination.</span>{" "}
          Both surfaces live on the platform from day one — only the monetization sequence shifts.
        </motion.div>
      </div>
    </section>
  );
}
