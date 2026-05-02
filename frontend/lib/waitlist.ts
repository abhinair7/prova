// Tiny JSON-backed waitlist store. Designed to be swapped for Postgres/Supabase later
// without touching the API route or the UI — just replace the read/write helpers.
import { promises as fs } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

export interface WaitlistEntry {
  id: string;            // share id, also the URL slug for /scorecard/[id]
  email: string;
  name: string;
  linkedinUrl?: string;
  verticalId: string;
  credential?: string;   // e.g. "NPI: 1234567890" or "Bar #: 234567"
  createdAt: string;
  ip?: string;
}

const FILE = path.join(process.cwd(), "data", "waitlist.json");

async function readAll(): Promise<WaitlistEntry[]> {
  try {
    const raw = await fs.readFile(FILE, "utf8");
    return JSON.parse(raw) as WaitlistEntry[];
  } catch (err) {
    const e = err as NodeJS.ErrnoException;
    if (e.code === "ENOENT") return [];
    throw err;
  }
}

async function writeAll(rows: WaitlistEntry[]): Promise<void> {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(rows, null, 2), "utf8");
}

export async function addEntry(input: Omit<WaitlistEntry, "id" | "createdAt">): Promise<WaitlistEntry> {
  const rows = await readAll();
  // Idempotent on email — return existing if already on list (so refreshing the form doesn't dupe)
  const existing = rows.find(r => r.email.toLowerCase() === input.email.toLowerCase());
  if (existing) return existing;
  const entry: WaitlistEntry = {
    ...input,
    id: crypto.randomBytes(6).toString("hex"),
    createdAt: new Date().toISOString(),
  };
  rows.push(entry);
  await writeAll(rows);
  return entry;
}

export async function getEntry(id: string): Promise<WaitlistEntry | null> {
  const rows = await readAll();
  return rows.find(r => r.id === id) ?? null;
}

export async function getCounts(): Promise<{ total: number; byVertical: Record<string, number> }> {
  const rows = await readAll();
  const byVertical: Record<string, number> = {};
  for (const r of rows) {
    byVertical[r.verticalId] = (byVertical[r.verticalId] ?? 0) + 1;
  }
  return { total: rows.length, byVertical };
}

export async function getPositionFor(id: string): Promise<{ position: number; verticalPosition: number; total: number }> {
  const rows = await readAll();
  const idx = rows.findIndex(r => r.id === id);
  if (idx < 0) return { position: 0, verticalPosition: 0, total: rows.length };
  const target = rows[idx];
  const verticalPosition = rows.slice(0, idx + 1).filter(r => r.verticalId === target.verticalId).length;
  return { position: idx + 1, verticalPosition, total: rows.length };
}
