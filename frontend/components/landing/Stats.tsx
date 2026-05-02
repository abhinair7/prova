"use client";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { stats } from "@/lib/data";

function useCountUp(end: number, duration = 2500, active = false) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number>(0);
  useEffect(() => {
    if (!active) return;
    const start = performance.now();
    const step = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.floor(eased * end));
      if (progress < 1) rafRef.current = requestAnimationFrame(step);
      else setValue(end);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [end, duration, active]);
  return value;
}

const items = [
  {
    value: stats.evaluations,
    suffix: "",
    label: "Evaluations run",
    description: "Real tasks from real professionals",
    color: "#7C3AED",
  },
  {
    value: stats.professionals,
    suffix: "",
    label: "Verified professionals",
    description: "Across 24 domains and 50+ countries",
    color: "#06B6D4",
  },
  {
    value: stats.models,
    suffix: "+",
    label: "Models benchmarked",
    description: "Open & closed source, updated weekly",
    color: "#F59E0B",
  },
  {
    value: stats.verticals,
    suffix: "",
    label: "Verticals live",
    description: "Healthcare to supply chain",
    color: "#10B981",
  },
];

function StatCard({ item, index }: { item: (typeof items)[0]; index: number }) {
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const count = useCountUp(item.value, 2500, inView);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="flex flex-col items-center text-center p-6 relative"
    >
      <div className="text-4xl md:text-5xl font-bold tabular-nums" style={{ color: item.color }}>
        {count.toLocaleString()}{item.suffix}
      </div>
      <div className="mt-2 text-sm font-semibold text-white">{item.label}</div>
      <div className="mt-1 text-xs text-[#64748B]">{item.description}</div>
    </motion.div>
  );
}

export function Stats() {
  return (
    <section className="relative py-12 overflow-hidden">
      {/* divider line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[rgba(124,58,237,0.4)] to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.06)] to-transparent" />

      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-[rgba(255,255,255,0.06)]">
          {items.map((item, i) => (
            <StatCard key={item.label} item={item} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
