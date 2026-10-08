import { NextResponse } from "next/server";
import { addLead, deleteLead, listLeads, moveLead } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ leads: await listLeads() });
}

export async function POST(req: Request) {
  let b: Record<string, unknown>;
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ error: "Send lead JSON." }, { status: 400 });
  }
  try {
    const doc = await addLead({
      name: String(b.name ?? ""),
      phone: String(b.phone ?? ""),
      source: String(b.source ?? ""),
      interest: String(b.interest ?? ""),
      value: Number(b.value ?? 0),
      stage: String(b.stage ?? "new") as "new",
      followUp: String(b.followUp ?? ""),
    });
    return NextResponse.json(doc, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed." }, { status: 422 });
  }
}

export async function PATCH(req: Request) {
  let b: { id?: string; stage?: string };
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ error: "Send { id, stage }." }, { status: 400 });
  }
  try {
    const doc = await moveLead(String(b.id ?? ""), String(b.stage ?? ""));
    if (!doc) return NextResponse.json({ error: "Lead not found." }, { status: 404 });
    return NextResponse.json(doc);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed." }, { status: 422 });
  }
}

export async function DELETE(req: Request) {
  const id = new URL(req.url).searchParams.get("id") ?? "";
  return NextResponse.json({ deleted: await deleteLead(id) });
}
