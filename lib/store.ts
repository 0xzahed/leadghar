import fs from "node:fs";
import path from "node:path";
import { db } from "@/lib/db";
import { Lead, STAGES, type Stage } from "@/models/Lead";

export interface Note {
  text: string;
  at: string;
}

export interface LeadDoc {
  id: string;
  name: string;
  phone: string;
  source: string;
  interest: string;
  value: number;
  stage: Stage;
  followUp: string;
  notes: Note[];
  createdAt: string;
}

export type NewLead = Omit<LeadDoc, "id" | "notes" | "createdAt">;

type Raw = Record<string, unknown> & { _id?: unknown; createdAt?: Date | string };

// ---------- Shared file store ----------
const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "leads.json");

interface FileDB {
  leads: (LeadDoc & { notes: { text: string; at: string }[] })[];
}

function readFile(): FileDB {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8")) as FileDB;
  } catch {
    return { leads: [] };
  }
}

function writeFile(d: FileDB): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(d));
}

const rid = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const isStage = (s: string): s is Stage => (STAGES as readonly string[]).includes(s);

const toDoc = (r: Raw): LeadDoc => ({
  id: String(r._id ?? r.id ?? ""),
  name: String(r.name ?? ""),
  phone: String(r.phone ?? ""),
  source: String(r.source ?? ""),
  interest: String(r.interest ?? ""),
  value: Number(r.value ?? 0),
  stage: isStage(String(r.stage)) ? String(r.stage) as Stage : "new",
  followUp: String(r.followUp ?? ""),
  notes: Array.isArray(r.notes)
    ? (r.notes as { text?: string; at?: Date | string }[]).map((n) => ({ text: String(n.text ?? ""), at: String(n.at ?? "") }))
    : [],
  createdAt: String(r.createdAt ?? new Date().toISOString()),
});

export async function listLeads(): Promise<LeadDoc[]> {
  if (await db()) {
    const rows = (await Lead.find({}).sort({ createdAt: -1 }).lean().catch(() => [])) as unknown as Raw[];
    return rows.map(toDoc);
  }
  return [...readFile().leads].reverse().map((l) => ({ ...l, stage: isStage(l.stage) ? l.stage : ("new" as Stage) }));
}

export async function addLead(input: NewLead): Promise<LeadDoc> {
  if (!input.name.trim()) throw new Error("Lead name is required.");
  if (!Number.isFinite(input.value) || input.value < 0) throw new Error("Value must be 0 or more.");
  if (input.followUp && !/^\d{4}-\d{2}-\d{2}$/.test(input.followUp)) throw new Error("Follow-up must be YYYY-MM-DD.");
  const base = {
    name: input.name.trim(),
    phone: input.phone.trim(),
    source: input.source.trim(),
    interest: input.interest.trim(),
    value: input.value,
    stage: isStage(input.stage) ? input.stage : ("new" as Stage),
    followUp: input.followUp,
  };
  if (await db()) {
    const c = await Lead.create({ ...base, notes: [] });
    return toDoc(c.toObject() as unknown as Raw);
  }
  const d = readFile();
  const doc: LeadDoc = { ...base, id: rid(), notes: [], createdAt: new Date().toISOString() };
  d.leads.push(doc);
  writeFile(d);
  return doc;
}

export async function moveLead(id: string, stage: string): Promise<LeadDoc | null> {
  if (!isStage(stage)) throw new Error("Invalid stage.");
  if (await db()) {
    const r = (await Lead.findByIdAndUpdate(id, { stage }, { new: true }).lean().catch(() => null)) as unknown as Raw | null;
    return r ? toDoc(r) : null;
  }
  const d = readFile();
  const l = d.leads.find((x) => x.id === id);
  if (!l) return null;
  l.stage = stage;
  writeFile(d);
  return { ...l, stage };
}

export async function addNote(id: string, text: string): Promise<LeadDoc | null> {
  if (!text.trim()) throw new Error("Note cannot be empty.");
  if (await db()) {
    const r = (await Lead.findByIdAndUpdate(id, { $push: { notes: { text: text.trim(), at: new Date() } } }, { new: true }).lean().catch(() => null)) as unknown as Raw | null;
    return r ? toDoc(r) : null;
  }
  const d = readFile();
  const l = d.leads.find((x) => x.id === id);
  if (!l) return null;
  l.notes.push({ text: text.trim(), at: new Date().toISOString() });
  writeFile(d);
  return { ...l };
}

export async function setFollowUp(id: string, followUp: string): Promise<LeadDoc | null> {
  if (followUp && !/^\d{4}-\d{2}-\d{2}$/.test(followUp)) throw new Error("Follow-up must be YYYY-MM-DD.");
  if (await db()) {
    const r = (await Lead.findByIdAndUpdate(id, { followUp }, { new: true }).lean().catch(() => null)) as unknown as Raw | null;
    return r ? toDoc(r) : null;
  }
  const d = readFile();
  const l = d.leads.find((x) => x.id === id);
  if (!l) return null;
  l.followUp = followUp;
  writeFile(d);
  return { ...l };
}

export async function deleteLead(id: string): Promise<boolean> {
  if (await db()) {
    const r = await Lead.findByIdAndDelete(id).catch(() => null);
    return !!r;
  }
  const d = readFile();
  const n = d.leads.length;
  d.leads = d.leads.filter((l) => l.id !== id);
  if (d.leads.length !== n) writeFile(d);
  return d.leads.length !== n;
}

/** Follow-ups due today or overdue, excluding closed (won/lost) leads. */
export async function dueFollowUps(): Promise<LeadDoc[]> {
  const today = new Date().toISOString().slice(0, 10);
  const all = await listLeads();
  return all.filter(
    (l) => (l.stage === "new" || l.stage === "contacted" || l.stage === "quoted") && l.followUp && l.followUp <= today,
  );
}

export async function pipelineValue(): Promise<{ open: number; won: number }> {
  const all = await listLeads();
  return {
    open: all.filter((l) => l.stage === "new" || l.stage === "contacted" || l.stage === "quoted").reduce((a, l) => a + l.value, 0),
    won: all.filter((l) => l.stage === "won").reduce((a, l) => a + l.value, 0),
  };
}
