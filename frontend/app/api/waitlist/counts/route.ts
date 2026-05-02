import { NextResponse } from "next/server";
import { getCounts } from "@/lib/waitlist";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const counts = await getCounts();
  return NextResponse.json(counts, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
