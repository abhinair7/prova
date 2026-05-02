"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { verticals } from "@/lib/data";
import { formatNumber } from "@/lib/utils";

export function Verticals() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="orb w-[500px] h-[500px] bg-[#06B6D4] opacity-[0.04] top-0 right-[-200px]" />

      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-sm font-medium text-[#7C3AED] uppercase tracking-widest mb-4">
            Domain Coverage
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">
            Every profession has its{" "}
            <span className="text-gradient-purple">own truth</span>
          </h2>
          <p className="mt-4 text-[#94A3B8] text-lg max-w-2xl mx-auto">
            Generic benchmarks mean nothing. We test AI on the tasks that define
            each profession — voted on by verified practitioners.
          </p>
        </motion.div>

        {/* Grid — preview first 12 on landing, full list on /verticals */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {verticals.slice(0, 12).map((v, i) => (
            <motion.div
              key={v.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: i * 0.07 }}
            >
              <Link href={`/benchmark?vertical=${v.id}`}>
                <div
                  className="group relative p-5 rounded-2xl border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.04)] transition-all duration-300 cursor-pointer overflow-hidden"
                  style={{
                    ["--glow-color" as string]: v.color,
                  }}
                >
                  {/* Hover glow */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{
                      background: `radial-gradient(circle at 50% 0%, ${v.color}18, transparent 70%)`,
                    }}
                  />
                  {/* Border glow on hover */}
                  <div
                    className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                      boxShadow: `inset 0 0 0 1px ${v.color}40`,
                    }}
                  />

                  <div className="relative">
                    {/* Icon + arrow */}
                    <div className="flex items-start justify-between mb-4">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                        style={{ background: `${v.color}18` }}
                      >
                        {v.icon}
                      </div>
                      <ArrowUpRight
                        className="w-4 h-4 text-[#475569] group-hover:text-white transition-colors"
                      />
                    </div>

                    {/* Name */}
                    <h3 className="text-sm font-semibold text-white mb-1">{v.name}</h3>
                    <p className="text-xs text-[#64748B] leading-relaxed mb-4">
                      {v.description}
                    </p>

                    {/* Footer */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#475569]">
                        {formatNumber(v.evaluators)} evaluators
                      </span>
                      <span
                        className="text-xs font-medium px-2 py-0.5 rounded-full"
                        style={{
                          color: v.color,
                          background: `${v.color}15`,
                        }}
                      >
                        #{1} {v.topModel.split(" ")[0]}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* View all */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-10"
        >
          <Link
            href="/verticals"
            className="text-sm text-[#7C3AED] hover:text-[#A78BFA] transition-colors inline-flex items-center gap-1"
          >
            View all {verticals.length} verticals
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
