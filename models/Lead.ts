import mongoose, { Schema } from "mongoose";

export const STAGES = ["new", "contacted", "quoted", "won", "lost"] as const;
export type Stage = (typeof STAGES)[number];

const NoteSchema = new Schema(
  { text: String, at: { type: Date, default: Date.now } },
  { _id: false },
);

const LeadSchema = new Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, default: "" },
    source: { type: String, default: "" }, // facebook, referral, walk-in…
    interest: { type: String, default: "" }, // what they want
    value: { type: Number, default: 0 }, // expected ৳
    stage: { type: String, default: "new" },
    followUp: { type: String, default: "" }, // YYYY-MM-DD
    notes: { type: [NoteSchema], default: [] },
  },
  { timestamps: { createdAt: true, updatedAt: true } },
);

LeadSchema.index({ stage: 1 });

export const Lead = mongoose.models.Lead ?? mongoose.model("Lead", LeadSchema);
