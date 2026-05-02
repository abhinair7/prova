"use client";
import { motion } from "framer-motion";
import { Upload, GitCompare, Share2 } from "lucide-react";

const steps = [
  {
    step: "01",
    icon: Upload,
    title: "Upload your real work",
    description:
      "Drop in cases, contracts, reports, or code from your actual workflow. All content is PII-masked before processing — your data never leaves secure infrastructure.",
    color: "#7C3AED",
    detail: "PDFs, CSVs, DOCX, code files — our pipeline handles them all.",
  },
  {
    step: "02",
    icon: GitCompare,
    title: "Models run in parallel",
    description:
      "We route your task through GPT-5, Claude 4, Gemini 2.5, Mistral, and more simultaneously. Side-by-side outputs with hallucination scores, latency, and confidence intervals.",
    color: "#06B6D4",
    detail: "127 models benchmarked. Cross-encoder reranking on every retrieval.",
  },
  {
    step: "03",
    icon: Share2,
    title: "Get your personalized scorecard",
    description:
      "Vote on which output was best for your task. Receive a ranked scorecard calibrated to your sub-specialty. Share it — your professional identity is on it.",
    color: "#F59E0B",
    detail: "LinkedIn-ready. Employer-grade signal of AI fluency.",
  },
];

export function HowItWorks() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[rgba(124,58,237,0.03)] to-transparent" />

      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <p className="text-sm font-medium text-[#06B6D4] uppercase tracking-widest mb-4">
            The Process
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-white">
            How Prova works
          </h2>
          <p className="mt-4 text-[#94A3B8] max-w-xl mx-auto">
            Three steps. Five minutes. A ranking you can trust and share.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative">
          {/* Connector line */}
          <div className="hidden lg:block absolute top-16 left-[33%] right-[33%] h-px bg-gradient-to-r from-[#7C3AED] via-[#06B6D4] to-[#F59E0B] opacity-30" />

          {steps.map((s, i) => (
            <motion.div
              key={s.step}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="relative p-7 rounded-2xl border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.02)] group hover:border-[rgba(255,255,255,0.12)] transition-all duration-300"
            >
              {/* Step number */}
              <div
                className="text-xs font-bold tracking-widest mb-5 opacity-40"
                style={{ color: s.color }}
              >
                STEP {s.step}
              </div>

              {/* Icon */}
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
                style={{ background: `${s.color}18`, border: `1px solid ${s.color}30` }}
              >
                <s.icon className="w-5 h-5" style={{ color: s.color }} />
              </div>

              {/* Title */}
              <h3 className="text-lg font-semibold text-white mb-3">{s.title}</h3>

              {/* Description */}
              <p className="text-sm text-[#94A3B8] leading-relaxed mb-4">
                {s.description}
              </p>

              {/* Detail chip */}
              <div
                className="inline-flex items-center text-xs px-3 py-1.5 rounded-full"
                style={{ background: `${s.color}10`, color: s.color, border: `1px solid ${s.color}25` }}
              >
                {s.detail}
              </div>

              {/* Hover glow */}
              <div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{
                  background: `radial-gradient(circle at 30% 30%, ${s.color}08, transparent 70%)`,
                }}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
