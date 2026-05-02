import { NextResponse } from "next/server";
import { addEntry, getPositionFor } from "@/lib/waitlist";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface Body {
  email?: string;
  name?: string;
  linkedinUrl?: string;
  verticalId?: string;
  credential?: string;
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const email = (body.email ?? "").trim();
  const name = (body.name ?? "").trim();
  const verticalId = (body.verticalId ?? "").trim();

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }
  if (name.length < 2 || name.length > 80) {
    return NextResponse.json({ error: "Name must be 2–80 characters" }, { status: 400 });
  }
  if (!verticalId) {
    return NextResponse.json({ error: "Pick a vertical" }, { status: 400 });
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    undefined;

  const entry = await addEntry({
    email,
    name,
    linkedinUrl: body.linkedinUrl?.trim() || undefined,
    verticalId,
    credential: body.credential?.trim() || undefined,
    ip,
  });

  const pos = await getPositionFor(entry.id);

  return NextResponse.json({
    id: entry.id,
    name: entry.name,
    verticalId: entry.verticalId,
    position: pos.position,
    verticalPosition: pos.verticalPosition,
    total: pos.total,
    shareUrl: `/scorecard/${entry.id}`,
  });
}
