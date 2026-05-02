"use client";
import { motion } from "framer-motion";
import { ShieldCheck, RotateCcw, BarChart2, Eye, AlertCircle, Users } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";

const pillars = [
  {
    icon: Users,
    title: "Verified domain professionals",
    description:
      "LinkedIn OAuth + NPI/credential verification per vertical. A radiologist judging radiology output can't be fooled by verbose style the way anonymous voters can.",
    color: "#7C3AED",
  },
  {
    icon: RotateCcw,
    title: "Rotating test data",
    description:
      "Benchmark datasets are private and rotate quarterly. The methodology is public; the data is not. Labs cannot train toward our tests.",
    color: "#06B6D4",
  },
  {
    icon: BarChart2,
    title: "Confidence intervals on every score",
    description:
      "Every leaderboard score comes with a confidence band and sample-size disclosure. No 3-user 'ranking' — minimum 50 evaluations to publish.",
    color: "#F59E0B",
  },
  {
    icon: Eye,
    title: "No cherry-picking policy",
    description:
      "All tested model variants are published, not just the best. The Llama 4 scandal (rank #2 published vs. #32 released) is exactly what Prova prevents.",
    color: "#10B981",
  },
  {
    icon: AlertCircle,
    title: "Hallucination detection built-in",
    description:
      "Every model output is scanned by our cross-encoder hallucination detector before being shown to evaluators. Scores include hallucination rates by domain.",
    color: "#EC4899",
  },
  {
    icon: ShieldCheck,
    title: "PII-safe pipeline",
    description:
      "NER-based PII masking runs before any document leaves your device context. Names, MRNs, case numbers, and financial identifiers are stripped automatically.",
    color: "#8B5CF6",
  },
];

export function TrustEngine() {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background glow */}
      <div className="orb w-[600px] h-[600px] bg-[#7C3AED] opacity-[0.05] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[rgba(124,58,237,0.04)] to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-sm font-medium text-[#10B981] uppercase tracking-widest mb-4">
            The Trust Engine
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-white">
            Why you can actually{" "}
            <span className="text-gradient-purple">believe the score</span>
          </h2>
          <p className="mt-4 text-[#94A3B8] max-w-2xl mx-auto text-lg">
            We designed every part of the system to be unfakeable — by AI labs,
            by bad actors, and by us.
          </p>
        </motion.div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {pillars.map((p, i) => (
            <GlassCard key={p.title} delay={i * 0.08} glow="purple" className="p-6">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                style={{ background: `${p.color}18`, border: `1px solid ${p.color}30` }}
              >
                <p.icon className="w-5 h-5" style={{ color: p.color }} />
              </div>
              <h3 className="text-sm font-semibold text-white mb-2">{p.title}</h3>
              <p className="text-xs text-[#94A3B8] leading-relaxed">{p.description}</p>
            </GlassCard>
          ))}
        </div>

        {/* Methodology CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-10 text-center"
        >
          <p className="text-sm text-[#475569]">
            Full methodology is public.{" "}
            <a href="#" className="text-[#7C3AED] hover:text-[#A78BFA] transition-colors">
              Read the whitepaper →
            </a>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
