import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "purple" | "cyan" | "gold" | "green" | "red" | "ghost";
  size?: "sm" | "md";
  className?: string;
}

const variants = {
  purple: "bg-[rgba(124,58,237,0.15)] text-[#A78BFA] border border-[rgba(124,58,237,0.3)]",
  cyan: "bg-[rgba(6,182,212,0.15)] text-[#67E8F9] border border-[rgba(6,182,212,0.3)]",
  gold: "bg-[rgba(245,158,11,0.15)] text-[#FCD34D] border border-[rgba(245,158,11,0.3)]",
  green: "bg-[rgba(16,185,129,0.15)] text-[#6EE7B7] border border-[rgba(16,185,129,0.3)]",
  red: "bg-[rgba(239,68,68,0.15)] text-[#FCA5A5] border border-[rgba(239,68,68,0.3)]",
  ghost: "bg-[rgba(255,255,255,0.06)] text-[#94A3B8] border border-[rgba(255,255,255,0.1)]",
};

const sizes = {
  sm: "text-xs px-2 py-0.5",
  md: "text-xs px-2.5 py-1",
};

export function Badge({ children, variant = "ghost", size = "md", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-medium",
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </span>
  );
}
