"use client";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface GlowButtonProps {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
}

export function GlowButton({
  children,
  variant = "primary",
  size = "md",
  className,
  onClick,
  disabled,
}: GlowButtonProps) {
  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-sm",
    lg: "px-8 py-4 text-base",
  };

  const variants = {
    primary:
      "bg-[#7C3AED] hover:bg-[#6D28D9] text-white shadow-[0_0_24px_rgba(124,58,237,0.4)] hover:shadow-[0_0_40px_rgba(124,58,237,0.6)] border border-[rgba(167,139,250,0.3)]",
    secondary:
      "bg-transparent text-white border border-[rgba(255,255,255,0.15)] hover:border-[rgba(124,58,237,0.5)] hover:bg-[rgba(124,58,237,0.08)]",
    ghost:
      "bg-transparent text-[#A78BFA] hover:text-white hover:bg-[rgba(124,58,237,0.1)] border border-transparent",
  };

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "relative inline-flex items-center justify-center gap-2 rounded-xl font-medium",
        "transition-all duration-200 cursor-pointer select-none",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        sizes[size],
        variants[variant],
        className
      )}
    >
      {children}
    </motion.button>
  );
}
