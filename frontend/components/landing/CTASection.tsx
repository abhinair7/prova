"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, FlaskConical } from "lucide-react";
import { GlowButton } from "@/components/ui/GlowButton";

export function CTASection() {
  return (
    <section className="py-32 relative overflow-hidden">
      {/* Radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,rgba(124,58,237,0.12),transparent)]" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[rgba(124,58,237,0.4)] to-transparent" />

      <div className="max-w-3xl mx-auto px-6 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Logo mark */}
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#7C3AED] mb-8 shadow-[0_0_40px_rgba(124,58,237,0.5)]">
            <FlaskConical className="w-8 h-8 text-white" />
          </div>

          <h2 className="text-5xl md:text-6xl font-bold text-white leading-tight mb-6">
            Prova it.{" "}
            <span className="text-gradient-purple">Prove it.</span>
          </h2>

          <p className="text-lg text-[#94A3B8] mb-10 max-w-xl mx-auto leading-relaxed">
            Stop guessing which AI model works for your profession. Upload your
            work, test all models in parallel, and get a personalized scorecard
            in under five minutes.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/evaluate">
              <GlowButton size="lg">
                Start free — no signup needed
                <ArrowRight className="w-4 h-4" />
              </GlowButton>
            </Link>
            <Link href="/benchmark">
              <GlowButton variant="secondary" size="lg">
                Browse leaderboards
              </GlowButton>
            </Link>
          </div>

          <p className="mt-8 text-xs text-[#475569]">
            PII-masked · No training on your data · Results in &lt; 60 seconds
          </p>
        </motion.div>
      </div>
    </section>
  );
}
