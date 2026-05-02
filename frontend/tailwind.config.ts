import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          purple: "#7C3AED",
          "purple-light": "#A78BFA",
          cyan: "#06B6D4",
          "cyan-light": "#67E8F9",
          gold: "#F59E0B",
          "gold-light": "#FCD34D",
        },
        surface: {
          0: "#000000",
          1: "#080810",
          2: "#0D0D1A",
          3: "#12121F",
          4: "#1A1A2E",
          5: "#1E1E35",
        },
        border: {
          subtle: "rgba(255,255,255,0.06)",
          muted: "rgba(255,255,255,0.10)",
          default: "rgba(255,255,255,0.15)",
          glow: "rgba(124,58,237,0.4)",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-mesh":
          "radial-gradient(at 40% 20%, hsla(265,91%,56%,0.15) 0px, transparent 50%), radial-gradient(at 80% 0%, hsla(189,100%,56%,0.10) 0px, transparent 50%), radial-gradient(at 0% 50%, hsla(265,91%,56%,0.08) 0px, transparent 50%)",
        "hero-glow":
          "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(124,58,237,0.25), transparent)",
      },
      animation: {
        "gradient-shift": "gradientShift 8s ease infinite",
        float: "float 6s ease-in-out infinite",
        "pulse-glow": "pulseGlow 3s ease-in-out infinite",
        "spin-slow": "spin 20s linear infinite",
        "scan-line": "scanLine 4s linear infinite",
        "fade-up": "fadeUp 0.6s ease forwards",
      },
      keyframes: {
        gradientShift: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: "0.6", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.05)" },
        },
        scanLine: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      boxShadow: {
        "glow-purple": "0 0 40px rgba(124,58,237,0.3)",
        "glow-cyan": "0 0 40px rgba(6,182,212,0.3)",
        "glow-gold": "0 0 40px rgba(245,158,11,0.3)",
        glass: "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)",
        "card-hover": "0 20px 60px rgba(124,58,237,0.2), 0 0 0 1px rgba(124,58,237,0.2)",
      },
    },
  },
  plugins: [],
};

export default config;
