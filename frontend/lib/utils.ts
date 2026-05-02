import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toString();
}

export function scoreColor(score: number): string {
  if (score >= 90) return "#10B981"; // green
  if (score >= 80) return "#F59E0B"; // gold
  if (score >= 70) return "#F97316"; // orange
  return "#EF4444"; // red
}

export function scoreLabel(score: number): string {
  if (score >= 92) return "Excellent";
  if (score >= 85) return "Strong";
  if (score >= 75) return "Good";
  if (score >= 65) return "Fair";
  return "Weak";
}

export function latencyLabel(ms: number): string {
  if (ms < 800) return "Fast";
  if (ms < 1500) return "Moderate";
  return "Slow";
}
