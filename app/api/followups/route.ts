import { NextResponse } from "next/server";
import { dueFollowUps, pipelineValue } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const [due, value] = await Promise.all([dueFollowUps(), pipelineValue()]);
  return NextResponse.json({ due, value });
}
