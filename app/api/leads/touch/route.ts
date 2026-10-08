import { NextResponse } from "next/server";
import { addNote, setFollowUp } from "@/lib/store";

export async function POST(req: Request) {
  let b: { id?: string; text?: string };
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ error: "Send { id, text }." }, { status: 400 });
  }
  try {
    const doc = await addNote(String(b.id ?? ""), String(b.text ?? ""));
    if (!doc) return NextResponse.json({ error: "Lead not found." }, { status: 404 });
    return NextResponse.json(doc);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed." }, { status: 422 });
  }
}

export async function PATCH(req: Request) {
  let b: { id?: string; followUp?: string };
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ error: "Send { id, followUp }." }, { status: 400 });
  }
  try {
    const doc = await setFollowUp(String(b.id ?? ""), String(b.followUp ?? ""));
    if (!doc) return NextResponse.json({ error: "Lead not found." }, { status: 404 });
    return NextResponse.json(doc);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed." }, { status: 422 });
  }
}
