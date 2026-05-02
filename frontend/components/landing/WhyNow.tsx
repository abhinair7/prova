"use client";
import { motion } from "framer-motion";
import { AlertTriangle, TrendingDown, Database } from "lucide-react";

const events = [
  {
    icon: AlertTriangle,
    tag: "April 2025",
    title: "The Llama 4 scandal",
    body: "Meta tested 27 private variants on Chatbot Arena and only published the best score. The 'preference-optimized' Llama 4 ranked #2; the actually-released model dropped to #32. Yann LeCun later admitted scores were 'fudged a little bit.'",
    pull: "Rank #2 published vs. #32 released.",
    color: "#F87171",
  },
  {
    icon: TrendingDown,
    tag: "December 2024",
    title: "The o3 / FrontierMath gap",
    body: "OpenAI claimed 26% on FrontierMath. Independent testing by Epoch AI found ~10%. A 2.6× discrepancy on a flagship reasoning benchmark — and OpenAI had funded and had access to the test data.",
    pull: "2.6× gap between claim and reality.",
    color: "#FBBF24",
  },
  {
    icon: Database,
    tag: "Endemic",
    title: "Data contamination is everywhere",
    body: "Models score 4–10 percentage points higher on benchmarks whose test sets leaked into their training data. Up to 50% of test samples in major benchmarks were found in Llama 1's training corpus. Public benchmarks are studied for, not solved.",
    pull: "Up to 50% of test samples already seen.",
    color: "#A78BFA",
  },
];

export function WhyNow() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="orb w-[500px] h-[500px] bg-[#F87171] opacity-[0.04] top-[-100px] right-[-150px]" />

      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-sm font-medium text-[#F87171] uppercase tracking-widest mb-4">
            Why now
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">
            Public benchmarks are in a{" "}
            <span className="text-gradient-purple">credibility collapse</span>
          </h2>
          <p className="mt-4 text-[#94A3B8] max-w-2xl mx-auto text-lg">
            Three things broke public benchmarks in 2025. The industry has not figured
            out what replaces them. That's the opening.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {events.map((e, i) => (
            <motion.div
              key={e.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="p-6 rounded-2xl border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.04)] transition-all duration-300 flex flex-col"
            >
              <div className="flex items-center justify-between mb-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: `${e.color}18`, border: `1px solid ${e.color}30` }}
                >
                  <e.icon className="w-5 h-5" style={{ color: e.color }} />
                </div>
                <span
                  className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full"
                  style={{ background: `${e.color}10`, color: e.color }}
                >
                  {e.tag}
                </span>
              </div>
              <h3 className="text-base font-semibold text-white mb-2">{e.title}</h3>
              <p className="text-sm text-[#94A3B8] leading-relaxed mb-4 flex-1">{e.body}</p>
              <p
                className="text-xs font-semibold pt-3 border-t border-[rgba(255,255,255,0.06)]"
                style={{ color: e.color }}
              >
                {e.pull}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 max-w-3xl mx-auto p-6 rounded-2xl border border-[rgba(124,58,237,0.18)] bg-[rgba(124,58,237,0.04)]"
        >
          <p className="text-sm text-[#94A3B8] leading-relaxed">
            <span className="text-white font-medium">The market consensus is brutal:</span>{" "}
            public benchmarks measure response style and gaming skill, not capability.
            Enterprise eval tools tell teams to build their own — which solves nothing
            for the 99% of professionals who just need to pick a model.{" "}
            <span className="text-[#A78BFA]">There is no consumer trust layer for vertical AI.</span>{" "}
            We are building it.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
