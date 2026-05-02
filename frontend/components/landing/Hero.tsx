"use client";
import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Shield, Zap, BarChart3 } from "lucide-react";
import { GlowButton } from "@/components/ui/GlowButton";

// Canvas-based neural network animation
function NeuralCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let W = (canvas.width = canvas.offsetWidth);
    let H = (canvas.height = canvas.offsetHeight);

    const ro = new ResizeObserver(() => {
      W = canvas.width = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
    });
    ro.observe(canvas);

    const NODE_COUNT = 55;
    const CONNECT_DIST = 160;

    interface Node {
      x: number; y: number;
      vx: number; vy: number;
      r: number; opacity: number;
    }

    const nodes: Node[] = Array.from({ length: NODE_COUNT }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r: Math.random() * 2 + 1,
      opacity: Math.random() * 0.6 + 0.2,
    }));

    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, W, H);

      // connections
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONNECT_DIST) {
            const alpha = (1 - dist / CONNECT_DIST) * 0.15;
            ctx.beginPath();
            ctx.strokeStyle = `rgba(124,58,237,${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }

      // nodes
      for (const n of nodes) {
        ctx.beginPath();
        const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 3);
        grad.addColorStop(0, `rgba(167,139,250,${n.opacity})`);
        grad.addColorStop(1, "rgba(124,58,237,0)");
        ctx.fillStyle = grad;
        ctx.arc(n.x, n.y, n.r * 3, 0, Math.PI * 2);
        ctx.fill();

        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > W) n.vx *= -1;
        if (n.y < 0 || n.y > H) n.vy *= -1;
      }

      animId = requestAnimationFrame(draw);
    }

    draw();
    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full opacity-60 pointer-events-none"
    />
  );
}

// Floating mini-leaderboard card
function LeaderboardPreview() {
  const rows = [
    { rank: 1, model: "Claude 4 Opus", score: 94.2, delta: "+2.1" },
    { rank: 2, model: "GPT-5", score: 92.8, delta: "+1.4" },
    { rank: 3, model: "Gemini 2.5 Pro", score: 88.6, delta: "—" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="hidden lg:block absolute right-0 top-1/2 -translate-y-1/2 w-80"
    >
      <div className="glass rounded-2xl overflow-hidden border border-[rgba(124,58,237,0.2)]">
        {/* Header */}
        <div className="px-4 py-3 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-white">Healthcare AI Index</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#4ADE80] live-dot" />
          </div>
          <span className="text-xs text-[#94A3B8]">12,341 evals</span>
        </div>

        {/* Rows */}
        <div className="p-3 flex flex-col gap-2">
          {rows.map((row) => (
            <div key={row.rank} className="flex items-center gap-3">
              <span className="w-5 text-center text-xs font-bold text-[#7C3AED]">
                {row.rank}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white truncate">{row.model}</p>
                <div className="mt-1 h-1.5 rounded-full bg-[rgba(255,255,255,0.06)] overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-[#7C3AED] to-[#06B6D4]"
                    initial={{ width: 0 }}
                    animate={{ width: `${row.score}%` }}
                    transition={{ duration: 1.2, delay: 1 + row.rank * 0.15, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
              </div>
              <span className="text-xs font-bold text-[#A78BFA] tabular-nums">{row.score}</span>
              <span className="text-xs text-[#4ADE80] w-10 text-right">{row.delta}</span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-[rgba(255,255,255,0.05)] text-xs text-[#64748B] flex items-center justify-between">
          <span>Verified by 12,341 radiologists & clinicians</span>
        </div>
      </div>

      {/* Floating sub-card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.5 }}
        className="mt-3 glass rounded-xl px-4 py-3 border border-[rgba(6,182,212,0.2)] flex items-start gap-3"
      >
        <div className="w-7 h-7 rounded-lg bg-[rgba(6,182,212,0.15)] flex items-center justify-center flex-shrink-0">
          <Shield className="w-3.5 h-3.5 text-[#06B6D4]" />
        </div>
        <div>
          <p className="text-xs font-medium text-white">PII-safe evaluation</p>
          <p className="text-xs text-[#64748B] mt-0.5">All uploads masked before processing</p>
        </div>
      </motion.div>
    </motion.div>
  );
}

const pillars = [
  { icon: Shield, label: "Verified professionals only" },
  { icon: Zap, label: "Real work, not toy tasks" },
  { icon: BarChart3, label: "Confidence intervals on every score" },
];

export function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col justify-center overflow-hidden pt-16">
      {/* Background layers */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#080810] via-[#0D0D1A] to-[#000000]" />
      <div className="absolute inset-0 grid-bg opacity-50" />
      <div className="orb w-[600px] h-[600px] bg-[#7C3AED] opacity-[0.08] top-[-200px] left-[-200px]" />
      <div className="orb w-[400px] h-[400px] bg-[#06B6D4] opacity-[0.06] bottom-[-100px] right-[-100px]" />
      <NeuralCanvas />

      {/* Hero glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(124,58,237,0.2),transparent)] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 lg:py-32 flex flex-col lg:flex-row items-center gap-16 lg:gap-8">
        {/* Left — copy */}
        <div className="flex-1 max-w-2xl">
          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 glass-purple rounded-full px-4 py-1.5 mb-8"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#7C3AED] live-dot" />
            <span className="text-xs font-medium text-[#A78BFA]">
              Public benchmarks are broken. We fixed them.
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight text-white"
          >
            Prova it.{" "}
            <br />
            <span className="text-gradient-purple">Prove it.</span>
          </motion.h1>

          {/* Sub-headline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="mt-6 text-lg md:text-xl text-[#94A3B8] leading-relaxed max-w-xl"
          >
            The trust and discovery layer for professional AI. Verified domain
            experts test models on{" "}
            <span className="text-white font-medium">their own real work</span> —
            producing rankings that actually mean something.
          </motion.p>

          {/* Pillars */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-8 flex flex-col sm:flex-row gap-3"
          >
            {pillars.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-2 text-sm text-[#94A3B8]"
              >
                <Icon className="w-4 h-4 text-[#7C3AED] flex-shrink-0" />
                {label}
              </div>
            ))}
          </motion.div>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-10 flex flex-wrap items-center gap-4"
          >
            <Link href="/evaluate">
              <GlowButton size="lg">
                Test your models
                <ArrowRight className="w-4 h-4" />
              </GlowButton>
            </Link>
            <Link href="/benchmark">
              <GlowButton variant="secondary" size="lg">
                View leaderboards
              </GlowButton>
            </Link>
          </motion.div>

          {/* Social proof */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-6 text-xs text-[#475569]"
          >
            Trusted by 142,891 verified professionals across 24 domains
          </motion.p>
        </div>

        {/* Right — floating leaderboard */}
        <div className="relative flex-1 w-full max-w-md">
          <LeaderboardPreview />
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <span className="text-xs text-[#475569]">Scroll to explore</span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="w-5 h-8 rounded-full border border-[rgba(255,255,255,0.1)] flex items-start justify-center pt-1.5"
        >
          <div className="w-1 h-2 rounded-full bg-[#7C3AED] opacity-70" />
        </motion.div>
      </motion.div>
    </section>
  );
}
