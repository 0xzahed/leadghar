"use client";

import { useCallback, useEffect, useState } from "react";

interface Lead {
  id: string;
  name: string;
  phone: string;
  source: string;
  interest: string;
  value: number;
  stage: string;
  followUp: string;
  notes: { text: string; at: string }[];
}

const STAGES = [
  { id: "new", label: "New", color: "border-sky-500/40" },
  { id: "contacted", label: "Contacted", color: "border-amber-500/40" },
  { id: "quoted", label: "Quoted", color: "border-violet-500/40" },
  { id: "won", label: "Won", color: "border-emerald-500/40" },
  { id: "lost", label: "Lost", color: "border-slate-700" },
];

const input =
  "h-10 rounded-xl border border-slate-700 bg-slate-900 px-3 text-sm outline-none placeholder:text-slate-600 focus:border-indigo-500";
const btn =
  "h-10 cursor-pointer rounded-xl bg-indigo-500 px-4 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-40";
const ghost =
  "h-9 cursor-pointer rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 transition hover:border-indigo-500 hover:text-white";

export default function Home() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [due, setDue] = useState<Lead[]>([]);
  const [value, setValue] = useState({ open: 0, won: 0 });
  const [error, setError] = useState("");
  const [openId, setOpenId] = useState("");
  const [form, setForm] = useState({ name: "", phone: "", source: "facebook", interest: "", value: "", followUp: "" });
  const [note, setNote] = useState("");

  const load = useCallback(async () => {
    try {
      const [l, f] = await Promise.all([
        fetch("/api/leads").then((x) => x.json()),
        fetch("/api/followups").then((x) => x.json()),
      ]);
      setLeads(l.leads ?? []);
      setDue(f.due ?? []);
      setValue(f.value ?? { open: 0, won: 0 });
    } catch {
      /* offline */
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const fail = (e: unknown) => setError(e instanceof Error ? e.message : "Failed.");

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const r = await fetch("/api/leads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...form, value: Number(form.value) || 0 }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      setForm({ name: "", phone: "", source: "facebook", interest: "", value: "", followUp: "" });
      load();
    } catch (e) {
      fail(e);
    }
  };

  const move = async (id: string, stage: string) => {
    setError("");
    try {
      const r = await fetch("/api/leads", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, stage }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      load();
    } catch (e) {
      fail(e);
    }
  };

  const saveNote = async (id: string) => {
    if (!note.trim()) return;
    setError("");
    try {
      const r = await fetch("/api/leads/touch", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, text: note }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      setNote("");
      load();
    } catch (e) {
      fail(e);
    }
  };

  const setFu = async (id: string, followUp: string) => {
    setError("");
    try {
      const r = await fetch("/api/leads/touch", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, followUp }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      load();
    } catch (e) {
      fail(e);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this lead?")) return;
    await fetch(`/api/leads?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (openId === id) setOpenId("");
    load();
  };

  const seed = async () => {
    await fetch("/api/seed", { method: "POST" });
    load();
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-5 py-10 sm:px-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-indigo-400">LeadGhar</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight">Never lose a lead.</h1>
          <p className="mt-2 text-slate-400">Pipeline · follow-ups · notes — one dashboard.</p>
        </div>
        <button onClick={seed} className={ghost}>Load demo data</button>
      </header>

      {error && (
        <p className="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>
      )}

      <div className="mt-6 grid grid-cols-3 gap-3">
        {[
          { l: "Open pipeline (৳)", v: value.open },
          { l: "Won (৳)", v: value.won },
          { l: "Follow-ups due", v: due.length },
        ].map((c) => (
          <div key={c.l} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-sm text-slate-400">{c.l}</p>
            <p className="mt-1 text-3xl font-black tabular-nums">{c.v}</p>
          </div>
        ))}
      </div>

      {due.length > 0 && (
        <div className="mt-6 rounded-2xl border border-amber-500/40 bg-amber-500/5 p-4">
          <p className="text-sm font-bold text-amber-300">📞 Follow up today ({due.length})</p>
          <ul className="mt-1.5 space-y-1 text-sm text-slate-300">
            {due.map((l) => (
              <li key={l.id}>• <b>{l.name}</b> {l.phone && <span className="font-mono text-xs text-slate-500">{l.phone}</span>} — {l.interest}</li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={add} className="mt-6 grid grid-cols-2 gap-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:grid-cols-3">
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Lead name *" className={input} />
        <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone" className={input} />
        <select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} className={`${input} cursor-pointer`}>
          {["facebook", "referral", "walk-in", "website", "other"].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <input value={form.interest} onChange={(e) => setForm({ ...form, interest: e.target.value })} placeholder="Interested in…" className={input} />
        <input value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} placeholder="Value ৳" inputMode="numeric" className={input} />
        <input value={form.followUp} onChange={(e) => setForm({ ...form, followUp: e.target.value })} type="date" className={`${input} text-slate-300`} />
        <button type="submit" className={`${btn} col-span-2 sm:col-span-3`}>Add lead</button>
      </form>

      <div className="mt-8 grid gap-3 md:grid-cols-5">
        {STAGES.map((s) => (
          <div key={s.id} className={`rounded-2xl border bg-slate-900/40 p-3 ${s.color}`}>
            <p className="px-1 text-sm font-bold">{s.label} ({leads.filter((l) => l.stage === s.id).length})</p>
            <div className="mt-2 space-y-2">
              {leads.filter((l) => l.stage === s.id).map((l) => (
                <div key={l.id} className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-sm">
                  <button onClick={() => setOpenId(openId === l.id ? "" : l.id)} className="w-full cursor-pointer text-left">
                    <p className="font-bold">{l.name}</p>
                    <p className="font-mono text-xs text-slate-500">৳{l.value}{l.followUp ? ` · ↩ ${l.followUp}` : ""}</p>
                  </button>
                  {openId === l.id && (
                    <div className="mt-2 space-y-2 border-t border-slate-800 pt-2">
                      <p className="text-xs text-slate-400">{l.phone} · {l.source} · {l.interest}</p>
                      <div className="flex flex-wrap gap-1">
                        {STAGES.filter((x) => x.id !== l.stage).map((x) => (
                          <button key={x.id} onClick={() => move(l.id, x.id)} className="cursor-pointer rounded-md border border-slate-700 px-2 py-0.5 text-[11px] hover:border-indigo-400">→ {x.label}</button>
                        ))}
                      </div>
                      <div className="flex gap-1">
                        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note…" className="h-8 min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-900 px-2 text-xs outline-none focus:border-indigo-500" />
                        <button onClick={() => saveNote(l.id)} className="h-8 cursor-pointer rounded-lg bg-indigo-500 px-2.5 text-xs font-bold text-white">+</button>
                      </div>
                      {l.notes.map((n, i) => (
                        <p key={i} className="text-xs text-slate-500">• {n.text} <span className="font-mono text-[10px]">({new Date(n.at).toLocaleDateString()})</span></p>
                      ))}
                      <div className="flex items-center gap-1">
                        <input type="date" value={l.followUp} onChange={(e) => setFu(l.id, e.target.value)} className="h-8 rounded-lg border border-slate-700 bg-slate-900 px-2 text-xs text-slate-300 outline-none" />
                        <button onClick={() => remove(l.id)} className="ml-auto cursor-pointer text-[11px] text-slate-600 hover:text-red-400">del</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
