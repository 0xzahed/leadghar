import { NextResponse } from "next/server";
import { addLead, listLeads } from "@/lib/store";

/** One-click demo data for client demos. */
export async function POST() {
  const existing = await listLeads();
  if (existing.length > 0) return NextResponse.json({ leads: existing.length, note: "already seeded" });
  const today = new Date().toISOString().slice(0, 10);
  const seed = [
    { name: "Rahman Traders", phone: "01XXXXXXXX1", source: "facebook", interest: "E-commerce website", value: 45000, stage: "new", followUp: today },
    { name: "City Dental", phone: "01XXXXXXXX2", source: "referral", interest: "Appointment system", value: 30000, stage: "contacted", followUp: today },
    { name: "Glow Parlour", phone: "01XXXXXXXX3", source: "walk-in", interest: "Booking system", value: 20000, stage: "quoted", followUp: "2099-01-01" },
  ] as const;
  for (const s of seed) {
    try {
      await addLead({ ...s, stage: s.stage as "new" | "contacted" | "quoted" });
    } catch {
      /* skip */
    }
  }
  return NextResponse.json({ leads: (await listLeads()).length });
}
