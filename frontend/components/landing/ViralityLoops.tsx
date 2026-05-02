"use client";
import { motion } from "framer-motion";
import { Share, Trophy, Zap, Megaphone } from "lucide-react";

const loops = [
  {
    number: "Loop 1",
    icon: Share,
    title: "Personal scorecard sharing",
    description:
      "Every user gets a shareable result: their personalized AI ranking for their profession. Screenshot-bait, LinkedIn-bait — professionals love sharing things that signal expertise.",
    highlight: "The most important loop.",
    color: "#7C3AED",
    metric: "38% of scorecards shared",
  },
  {
    number: "Loop 2",
    icon: Trophy,
    title: "Profession vs. profession",
    description:
      "Doctors submitted 12,400 evaluations this month. Lawyers: 8,900. Engineers: 31,000. Accountants — only 1,200, you're embarrassing yourselves. Tribal competition drives participation.",
    highlight: "Reddit-level tribal energy.",
    color: "#F59E0B",
    metric: "2.4x more evals with leaderboards visible",
  },
  {
    number: "Loop 3",
    icon: Zap,
    title: "Model release moments",
    description:
      "Every time GPT-6 or Claude 5 launches, every professional wants to know: is the new one better for my work? Prova becomes the destination for that question — per profession.",
    highlight: "10+ free traffic events per year.",
    color: "#06B6D4",
    metric: "8x spike on launch days",
  },
  {
    number: "Loop 4",
    icon: Megaphone,
    title: "AI labs drive our traffic",
    description:
      "When Anthropic announces 'Claude is now #1 for legal work on Prova', they link to us. Free top-of-funnel from the most marketing-active companies in tech.",
    highlight: "Exact same dynamic as LMArena.",
    color: "#10B981",
    metric: "Labs cite us in launch posts",
  },
];

export function ViralityLoops() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-30" />

      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-sm font-medium text-[#F59E0B] uppercase tracking-widest mb-4">
            Growth Mechanics
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-white">
            Four loops that make{" "}
            <span className="text-gradient-gold">Prova compound</span>
          </h2>
          <p className="mt-4 text-[#94A3B8] max-w-xl mx-auto">
            Each mechanism feeds the next. The flywheel is structural, not
            dependent on paid acquisition.
          </p>
        </motion.div>

        {/* Loops */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {loops.map((loop, i) => (
            <motion.div
              key={loop.number}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="p-6 rounded-2xl border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.02)] group hover:border-[rgba(255,255,255,0.12)] hover:bg-[rgba(255,255,255,0.04)] transition-all duration-300"
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: `${loop.color}18`, border: `1px solid ${loop.color}30` }}
                >
                  <loop.icon className="w-5 h-5" style={{ color: loop.color }} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="text-xs font-bold tracking-wider"
                      style={{ color: loop.color }}
                    >
                      {loop.number}
                    </span>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: `${loop.color}12`, color: loop.color }}
                    >
                      {loop.metric}
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-white mb-2">{loop.title}</h3>
                  <p className="text-sm text-[#94A3B8] leading-relaxed mb-3">
                    {loop.description}
                  </p>
                  <p className="text-xs font-medium italic" style={{ color: loop.color }}>
                    "{loop.highlight}"
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
