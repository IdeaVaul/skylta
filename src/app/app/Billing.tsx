"use client";

import { useState } from "react";
import { PLANS, type PlanId } from "@/lib/plans";

async function go(path: string, body?: unknown) {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (json.url) window.location.href = json.url;
  else throw new Error(json.error ?? "Något gick fel");
}

export function PortalButton() {
  const [error, setError] = useState(false);
  return (
    <button
      onClick={() => go("/api/stripe/portal").catch(() => setError(true))}
      className="rounded-full border border-[#C9D1CC] bg-white px-4 py-2.5 font-medium"
    >
      {error ? "Försök igen" : "Betalning"}
    </button>
  );
}

export function PlanPicker() {
  const [busy, setBusy] = useState<PlanId | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-4xl font-extrabold tracking-tight">Välj en plan för att börja</h1>
        <p className="text-[17px] text-body">7 dagar gratis. Du betalar inget i dag och kan avsluta när du vill. Priser exkl. moms.</p>
      </div>
      {error && <p role="alert" className="rounded-xl bg-[#FDECEC] px-4 py-3 text-[15px] text-[#8A1C1C]">{error}</p>}
      <div className="flex flex-wrap gap-5">
        {(Object.keys(PLANS) as PlanId[]).map((id) => {
          const p = PLANS[id];
          return (
            <div key={id} className="flex flex-[1_1_240px] flex-col gap-4 rounded-3xl border border-line bg-white p-6">
              <h2 className="text-xl font-bold">{p.name}</h2>
              <div><span className="font-display text-4xl font-extrabold">{p.price}</span><span className="text-muted"> /mån</span></div>
              <ul className="flex flex-col gap-2 text-[15px] text-body">{p.features.map((f) => <li key={f}>{f}</li>)}</ul>
              <button
                disabled={busy !== null}
                onClick={() => {
                  setBusy(id);
                  setError(null);
                  go("/api/stripe/checkout", { plan: id }).catch((e: Error) => {
                    setError(e.message);
                    setBusy(null);
                  });
                }}
                className="mt-auto rounded-full bg-forest px-5 py-3.5 font-semibold text-white hover:bg-forest-dark disabled:opacity-60"
              >
                {busy === id ? "Öppnar kassan…" : "Testa gratis"}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
