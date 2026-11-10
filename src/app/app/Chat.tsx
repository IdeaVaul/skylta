"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { RunResult } from "../api/run/route";

type Agent = "nils" | "saga";
type Turn = { role: "user"; text: string } | ({ role: "assistant" } & RunResult);

const agents: Record<Agent, { name: string; role: string; hint: string; badge: string }> = {
  nils: { name: "Nils", role: "Bygger nytt åt företag utan hemsida", hint: "Hitta 5 frisörer i Linköping utan hemsida", badge: "bg-forest text-white" },
  saga: { name: "Saga", role: "Gör om företag med gammal hemsida", hint: "Hitta 5 bilverkstäder i Norrköping med gammal hemsida", badge: "bg-sign text-ink" },
};

export function Chat() {
  const router = useRouter();
  const [agent, setAgent] = useState<Agent>("nils");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const message = text.trim();
    if (!message || busy) return;
    setText("");
    setBusy(true);
    setTurns((t) => [...t, { role: "user", text: message }]);
    try {
      const res = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent, message }),
      });
      const result = (await res.json()) as RunResult;
      setTurns((t) => [...t, { role: "assistant", ...result }]);
      router.refresh(); // uppdaterar "Dina sajter" och planstatus
    } catch {
      setTurns((t) => [...t, { role: "assistant", reply: "Jag fick ingen kontakt med servern. Försök igen.", built: [], skipped: [] }]);
    } finally {
      setBusy(false);
    }
  }

  const a = agents[agent];

  return (
    <section className="flex flex-col gap-5">
      <h1 className="font-display text-4xl font-extrabold tracking-tight">Vem vill du jobba med?</h1>

      <div role="radiogroup" aria-label="Välj assistent" className="flex flex-wrap gap-3">
        {(Object.keys(agents) as Agent[]).map((id) => (
          <button
            key={id}
            role="radio"
            aria-checked={agent === id}
            onClick={() => setAgent(id)}
            className={`flex flex-[1_1_260px] items-center gap-3 rounded-2xl border-2 bg-white p-4 text-left ${agent === id ? "border-forest" : "border-line"}`}
          >
            <span aria-hidden="true" className={`flex h-12 w-12 flex-none items-center justify-center rounded-full font-display text-xl font-extrabold ${agents[id].badge}`}>{agents[id].name[0]}</span>
            <span>
              <span className="block font-bold">{agents[id].name}</span>
              <span className="block text-sm text-muted">{agents[id].role}</span>
            </span>
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3.5 rounded-3xl border border-line bg-white p-5">
        <div aria-live="polite" className="flex min-h-[160px] flex-col gap-3.5">
          {turns.length === 0 && (
            <p className="m-auto max-w-[420px] text-center text-body">Skriv en bransch och en ort så sätter {a.name} igång. Till exempel: ”{a.hint}”.</p>
          )}
          {turns.map((turn, i) =>
            turn.role === "user" ? (
              <div key={i} className="max-w-[88%] self-end rounded-[18px_18px_4px_18px] bg-forest px-4 py-3 text-[15px] text-white">{turn.text}</div>
            ) : (
              <div key={i} className="flex max-w-[94%] flex-col gap-3 self-start">
                <div className="rounded-[18px_18px_18px_4px] bg-[#EEF2EF] px-4 py-3 text-[15px] font-medium">{turn.reply}</div>
                {turn.built.map((b) => (
                  <div key={b.url} className="flex flex-col gap-2.5 rounded-2xl border border-line p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-semibold">{b.name}</span>
                      <a href={b.url} target="_blank" className="text-[15px] font-semibold text-forest underline">Öppna sajten</a>
                    </div>
                    <p className="rounded-xl bg-[#EEF2EF] px-3.5 py-2.5 text-[15px]">{b.message}</p>
                    <div className="flex flex-wrap gap-2">
                      {b.phone && (
                        <a href={`sms:${b.phone.replace(/[^\d+]/g, "")}?&body=${encodeURIComponent(b.message)}`} className="rounded-full bg-forest px-4 py-2.5 text-sm font-semibold text-white">Öppna som sms</a>
                      )}
                      <button onClick={() => navigator.clipboard.writeText(b.message)} className="rounded-full border border-[#C9D1CC] px-4 py-2.5 text-sm font-semibold">Kopiera text</button>
                    </div>
                  </div>
                ))}
                {turn.skipped.length > 0 && (
                  <ul className="flex flex-col gap-1 rounded-2xl border border-line p-4 text-sm">
                    {turn.skipped.map((s) => (
                      <li key={s.name} className="flex flex-wrap justify-between gap-2">
                        <span>{s.name}</span>
                        <span className="text-muted">{s.reason}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ),
          )}
          {busy && <div className="self-start rounded-[18px_18px_18px_4px] bg-[#EEF2EF] px-4 py-3 text-[15px] text-body">{a.name} letar och bygger. Det tar någon minut…</div>}
        </div>

        <form onSubmit={send} className="flex flex-wrap gap-2">
          <label className="sr-only" htmlFor="chat-input">Meddelande till {a.name}</label>
          <input
            id="chat-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={500}
            placeholder={a.hint}
            className="min-w-0 flex-[1_1_240px] rounded-full border border-[#C9D1CC] px-5 py-3"
          />
          <button disabled={busy || !text.trim()} className="rounded-full bg-forest px-6 py-3 font-semibold text-white hover:bg-forest-dark disabled:opacity-60">Skicka</button>
        </form>
      </div>
    </section>
  );
}
