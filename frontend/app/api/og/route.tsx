import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { getEntry } from "@/lib/waitlist";
import { leaderboardFor, verticals } from "@/lib/data";

// next/og runs on satori under the hood — its CSS subset is limited.
// Avoid: shorthand `background:`, complex gradients, emojis (need explicit font), aspect-ratio.
// Use:    explicit display:flex, backgroundColor, simple backgroundImage with one gradient.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id") ?? "";
  let entry = null;
  try {
    entry = id ? await getEntry(id) : null;
  } catch {
    entry = null;
  }

  const fallbackVertical = verticals[0];
  const v = entry ? verticals.find(x => x.id === entry.verticalId) ?? fallbackVertical : fallbackVertical;
  const board = leaderboardFor(v.id).slice(0, 3);
  const name = entry?.name ?? "Prova.ai";

  try {
    return new ImageResponse(
      (
        <div
          style={{
            width: "1200px",
            height: "630px",
            display: "flex",
            flexDirection: "column",
            padding: "60px",
            backgroundColor: "#0A0612",
            backgroundImage: `radial-gradient(circle at 25% 20%, ${v.color}55, transparent 60%)`,
            color: "white",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          {/* Top strip */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 36 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12, backgroundColor: "#7C3AED",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 26, fontWeight: 700, color: "white",
              }}>P</div>
              <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-0.5px", display: "flex" }}>
                <span>prova</span>
                <span style={{ color: "#7C3AED" }}>.ai</span>
              </div>
            </div>
            <div style={{
              display: "flex", alignItems: "center",
              padding: "10px 18px", borderRadius: 999,
              backgroundColor: "rgba(16,185,129,0.18)", border: "2px solid rgba(16,185,129,0.45)",
              color: "#4ADE80", fontSize: 18, fontWeight: 600,
            }}>
              Verified evaluator
            </div>
          </div>

          {/* Eyebrow */}
          <div style={{
            display: "flex", color: "#A78BFA", fontSize: 20, letterSpacing: "4px",
            textTransform: "uppercase", fontWeight: 700, marginBottom: 16,
          }}>
            {v.name} AI Scorecard
          </div>

          {/* Headline + description in their own column block to keep stacking honest.
              Every div needs display:flex per next/og rules — text-only divs are fine without children, but parent must be flex. */}
          <div style={{ display: "flex", flexDirection: "column", marginBottom: 36 }}>
            <div style={{ display: "flex", fontSize: 60, fontWeight: 800, lineHeight: 1.1, letterSpacing: "-1.5px", paddingBottom: 18 }}>
              {name}
            </div>
            <div style={{ display: "flex", fontSize: 22, color: "#94A3B8", lineHeight: 1.4 }}>
              Top AI models for {v.name.toLowerCase()} — ranked by verified peers.
            </div>
          </div>

          {/* Top 3 — sized to fit the remaining canvas after eyebrow + headline */}
          <div style={{
            display: "flex", flexDirection: "column",
            padding: 22, borderRadius: 20,
            backgroundColor: "rgba(0,0,0,0.55)", border: "1px solid rgba(255,255,255,0.10)",
          }}>
            {board.map((row, i) => (
              <div key={row.model} style={{
                display: "flex", alignItems: "center",
                paddingTop: i === 0 ? 0 : 10, paddingBottom: i === board.length - 1 ? 0 : 10,
                borderBottom: i === board.length - 1 ? "none" : "1px solid rgba(255,255,255,0.05)",
              }}>
                <div style={{ display: "flex", width: 48, fontSize: 20, fontWeight: 800, color: "#7C3AED" }}>#{i + 1}</div>
                <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                  <div style={{ display: "flex", fontSize: 22, fontWeight: 700, lineHeight: 1.2 }}>{row.model}</div>
                  <div style={{ display: "flex", fontSize: 16, color: "#64748B", lineHeight: 1.3 }}>{row.provider}</div>
                </div>
                <div style={{
                  display: "flex", fontSize: 28, fontWeight: 800,
                  color: row.overall >= 90 ? "#4ADE80" : row.overall >= 80 ? "#A78BFA" : "#FBBF24",
                }}>
                  {row.overall.toFixed(1)}
                </div>
              </div>
            ))}
          </div>

          <div style={{
            marginTop: "auto", display: "flex", justifyContent: "space-between",
            color: "#475569", fontSize: 18,
          }}>
            <span>prova.ai/scorecard/{id || "demo"}</span>
            <span>The trust layer for professional AI</span>
          </div>
        </div>
      ),
      { width: 1200, height: 630 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "render error";
    return new Response(`OG render failed: ${message}`, {
      status: 500,
      headers: { "Content-Type": "text/plain" },
    });
  }
}
