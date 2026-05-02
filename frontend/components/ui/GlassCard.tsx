"use client";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glow?: "purple" | "cyan" | "gold" | "none";
  onClick?: () => void;
  delay?: number;
  animate?: boolean;
}

export function GlassCard({
  children,
  className,
  hover = true,
  glow = "none",
  onClick,
  delay = 0,
  animate = true,
}: GlassCardProps) {
  const glowStyles = {
    none: "",
    purple: "hover:shadow-[0_20px_60px_rgba(124,58,237,0.2),0_0_0_1px_rgba(124,58,237,0.2)]",
    cyan: "hover:shadow-[0_20px_60px_rgba(6,182,212,0.2),0_0_0_1px_rgba(6,182,212,0.2)]",
    gold: "hover:shadow-[0_20px_60px_rgba(245,158,11,0.2),0_0_0_1px_rgba(245,158,11,0.2)]",
  };

  return (
    <motion.div
      initial={animate ? { opacity: 0, y: 20 } : undefined}
      whileInView={animate ? { opacity: 1, y: 0 } : undefined}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
      onClick={onClick}
      className={cn(
        "relative rounded-2xl",
        "bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)]",
        "backdrop-blur-xl",
        hover && "transition-all duration-300",
        hover && "hover:bg-[rgba(255,255,255,0.05)] hover:border-[rgba(255,255,255,0.12)]",
        hover && glow !== "none" && glowStyles[glow],
        onClick && "cursor-pointer",
        className
      )}
    >
      {children}
    </motion.div>
  );
}
