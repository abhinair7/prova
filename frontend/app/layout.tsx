import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Prova — Prove Your AI",
  description:
    "The trust and discovery layer for professional AI. Verified domain experts test models on real work. Get personalized AI rankings for your profession.",
  keywords: ["AI benchmarks", "AI evaluation", "professional AI", "LLM ranking", "AI trust"],
  openGraph: {
    title: "Prova — Prove Your AI",
    description: "Verified professionals test AI models on real work. Get rankings you can actually trust.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
