export type PlanId = "start" | "proffs" | "byra";

export const PLANS: Record<
  PlanId,
  { name: string; price: string; tagline: string; leadsPerMonth: number; sites: number; features: string[] }
> = {
  start: {
    name: "Start",
    price: "299 kr",
    tagline: "För dig som vill få dina första kunder",
    leadsPerMonth: 300,
    sites: 10,
    features: ["300 leads per månad", "10 hemsidor", "Sökning via Google Maps", "Färdiga sms-utkast"],
  },
  proffs: {
    name: "Proffs",
    price: "995 kr",
    tagline: "För dig som driver byrån på riktigt",
    leadsPerMonth: 2000,
    sites: 50,
    features: ["2 000 leads per månad", "50 hemsidor", "Allt i Start"],
  },
  byra: {
    name: "Byrå",
    price: "4 995 kr",
    tagline: "Obegränsat, för stora volymer",
    leadsPerMonth: Infinity,
    sites: Infinity,
    features: ["Obegränsat antal leads", "Obegränsat antal hemsidor", "Allt i Proffs"],
  },
};

/** Under testperioden: tillräckligt för att se en hel körning. */
export const TRIAL_LIMITS = { leadsPerMonth: 2, sites: 1 };
export const TRIAL_DAYS = 7;

/** Utan Stripe startas testperioden direkt i appen, utan kort. */
export function stripeEnabled() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function priceIdFor(plan: PlanId): string | undefined {
  return {
    start: process.env.STRIPE_PRICE_START,
    proffs: process.env.STRIPE_PRICE_PROFFS,
    byra: process.env.STRIPE_PRICE_BYRA,
  }[plan];
}

export function planForPriceId(priceId: string | undefined): PlanId | null {
  if (!priceId) return null;
  if (priceId === process.env.STRIPE_PRICE_START) return "start";
  if (priceId === process.env.STRIPE_PRICE_PROFFS) return "proffs";
  if (priceId === process.env.STRIPE_PRICE_BYRA) return "byra";
  return null;
}

export function limitsFor(plan: string, status: string | null, periodEnd?: string | null) {
  if (status === "trialing") {
    if (periodEnd && new Date(periodEnd).getTime() < Date.now()) return null; // testperioden är slut
    return TRIAL_LIMITS;
  }
  if (status !== "active") return null;
  const p = PLANS[plan as PlanId];
  return p ? { leadsPerMonth: p.leadsPerMonth, sites: p.sites } : null;
}
