import Link from "next/link";
import { Logo } from "@/components/Logo";
import { PLANS, type PlanId } from "@/lib/plans";

const h2 = "font-display text-3xl font-extrabold leading-[1.08] tracking-tight sm:text-[44px]";
const wrap = "mx-auto max-w-[1120px] px-6";

const steps = [
  { n: "1", title: "Hitta", text: "Skriv till exempel ”rörmokare i Norrköping”. Skylta letar upp företag som saknar hemsida, eller har en som behöver göras om." },
  { n: "2", title: "Bygg", text: "Varje företag får en egen sajt på svenska med text och kontaktuppgifter. Klar på några minuter, utan en rad kod." },
  { n: "3", title: "Sälj", text: "Du får ett färdigt meddelande med länk till sajten. Skicka det från din egen mobil och ta betalt hur du vill." },
];

const agents = [
  { initial: "N", name: "Nils", role: "Bygger nytt", badge: "bg-forest text-white", text: "Nils letar upp företag som helt saknar hemsida och bygger en från grunden, med text och kontaktuppgifter.", example: "”Hitta 5 rörmokare i Norrköping utan hemsida”" },
  { initial: "S", name: "Saga", role: "Gör om gammalt", badge: "bg-sign text-ink", text: "Saga hittar företag som redan har en sajt och visar en ny, modernare version som kunden kan jämföra med.", example: "”Hitta 5 bilverkstäder i Linköping med gammal hemsida”" },
];

const shortlist = [
  { name: "Salong Björkgatan", meta: "4,8 i betyg · 187 omdömen", status: "Bygger", ok: true },
  { name: "Klipp & Fade Vasastan", meta: "4,7 i betyg · 96 omdömen", status: "Bygger", ok: true },
  { name: "Kedjesalong, gallerian", meta: "3,9 i betyg · 340 omdömen", status: "Har redan hemsida", ok: false },
  { name: "Sax & Stål Herrfrisör", meta: "4,6 i betyg · 58 omdömen", status: "Saknar telefonnummer", ok: false },
  { name: "Kommunens tillståndsenhet", meta: "2,4 i betyg · 40 omdömen", status: "Inte ett företag", ok: false },
];

const demos = [
  { brand: "Östgöta Flytt", headline: "Vi bär. Du flyttar in.", cta: "Få offert", meta: "Flyttfirma · Norrköping", box: "bg-[#1F4E79] text-white", label: "text-[#D5E3F0]", btn: "bg-white text-[#1F4E79]" },
  { brand: "Tandvården vid Ån", headline: "Ett lugnare tandläkarbesök.", cta: "Boka undersökning", meta: "Tandläkare · Motala", box: "bg-[#D9F1EA] text-ink", label: "text-[#2E4A40]", btn: "bg-ink text-white" },
  { brand: "Salong Björkgatan", headline: "Vassa klipp mitt i Linköping.", cta: "Boka tid", meta: "Frisör · Linköping", box: "bg-[#1B1B1F] text-white", label: "text-[#C9CBD3]", btn: "bg-sign text-ink" },
];

const perks = [
  { title: "Du behåller hela priset", text: "Sätt ditt eget pris per sajt. Skylta tar ingen provision på det du säljer." },
  { title: "Dina kunder, din kontakt", text: "Meddelandet skickas från din egen mobil. Kunden pratar med dig, inte med oss." },
  { title: "Ta betalt som du vill", text: "Swish, faktura eller månadsavtal. Betalningen går direkt mellan dig och kunden." },
  { title: "Inget försvinner", text: "Varje sajt och varje meddelande sparas på ditt konto så fort det är klart." },
];

const faq = [
  { q: "Behöver jag kunna design eller kod?", a: "Nej. Du skriver vad du vill ha på vanlig svenska, så bygger Skylta sajten." },
  { q: "Skickar Skylta meddelanden åt mig?", a: "Nej. Meddelandet öppnas i din egen sms-app och det är du som trycker på skicka. Kontakten och kunden är din." },
  { q: "Hur funkar testperioden?", a: "Du väljer plan och testar i 7 dagar utan kostnad. Avslutar du innan dess dras ingenting." },
  { q: "Vad kan jag ta betalt för en sajt?", a: "Det bestämmer du själv. Skylta tar ingen del av det du säljer." },
  { q: "Kan jag byta eller avsluta min plan?", a: "Ja, när som helst under Betalning, även under testperioden." },
];

export default function Home() {
  return (
    <div className="leading-normal">
      <header className={`${wrap} flex flex-wrap items-center justify-between gap-4 py-5`}>
        <Link href="/" aria-label="Skylta, startsida"><Logo /></Link>
        <nav className="flex flex-wrap items-center gap-7 text-[15px] font-medium">
          <a className="py-3" href="#sa-funkar-det">Så funkar det</a>
          <a className="py-3" href="#exempel">Exempel</a>
          <a className="py-3" href="#priser">Priser</a>
          <a className="py-3" href="#fragor">Frågor</a>
        </nav>
        <div className="flex items-center gap-4 text-[15px]">
          <Link className="px-1 py-3 font-medium" href="/login">Logga in</Link>
          <Link className="rounded-full bg-forest px-5 py-3 font-semibold text-white hover:bg-forest-dark" href="/login?mode=signup">Testa gratis</Link>
        </div>
      </header>

      <main>
        <section className={`${wrap} flex flex-wrap items-center gap-14 pb-22 pt-14`}>
          <div className="flex min-w-0 flex-[1_1_420px] flex-col gap-6">
            <span className="self-start rounded-full bg-sign px-3 py-1.5 text-[13px] font-bold">Byggd för den svenska marknaden</span>
            <h1 className="font-display text-[40px] font-extrabold leading-[1.02] tracking-tighter sm:text-[68px]">Starta webbyrå från köksbordet.</h1>
            <p className="max-w-[520px] text-[19px] text-body">Skriv en bransch och en ort. Skylta hittar lokala företag utan hemsida, bygger en färdig sajt åt vart och ett med AI och skriver säljmeddelandet. Du sköter affären.</p>
            <div className="flex flex-wrap gap-3">
              <Link className="rounded-full bg-forest px-7 py-4 text-[17px] font-semibold text-white hover:bg-forest-dark" href="/login?mode=signup">Testa gratis i 7 dagar</Link>
              <a className="rounded-full border border-[#C9D1CC] bg-white px-7 py-4 text-[17px] font-semibold" href="#sa-funkar-det">Se hur det funkar</a>
            </div>
            <p className="text-sm text-muted">Ingen bindningstid. Avsluta när du vill.</p>
          </div>

          <div className="flex min-w-0 flex-[1_1_420px] flex-col gap-3.5 rounded-3xl border border-line bg-white p-5 shadow-[0_24px_48px_-24px_rgba(16,32,26,0.25)]">
            <div className="max-w-[88%] self-end rounded-[18px_18px_4px_18px] bg-forest px-4 py-3 text-[15px] text-white">Hitta 5 frisörer i Linköping utan hemsida, bygg deras sajter och skriv ett sms</div>
            <div className="max-w-[92%] self-start rounded-[18px_18px_18px_4px] bg-[#EEF2EF] px-4 py-3 text-[15px]">
              <div className="font-semibold">Klart! Jag byggde 2 sajter.</div>
              <div className="mt-1 text-body">Hoppade över 3: en som redan har hemsida, en utan telefonnummer och en som inte är ett företag.</div>
            </div>
            <div className="overflow-hidden rounded-2xl border border-line">
              <div className="flex flex-col gap-3 bg-[#1B1B1F] px-5 py-7 text-white">
                <div className="text-xs uppercase tracking-[0.12em] text-[#C9CBD3]">Salong Björkgatan</div>
                <div className="font-display text-[28px] font-bold leading-[1.1]">Vassa klipp mitt i Linköping.</div>
                <span className="self-start rounded-full bg-sign px-3.5 py-2 text-[13px] font-bold text-ink">Boka tid</span>
              </div>
              <div className="flex flex-wrap justify-between gap-2 px-3.5 py-2.5 text-[13px] text-muted">
                <span className="font-semibold text-ink">Salong Björkgatan</span>
                <span>skylta.se/s/salong-bjorkgatan</span>
              </div>
            </div>
            <div className="max-w-[92%] self-start rounded-[18px_18px_18px_4px] bg-[#EEF2EF] px-4 py-3 text-[15px]">
              <div className="mb-1 text-xs font-bold text-forest">SMS-UTKAST</div>
              Hej! Jag såg att Salong Björkgatan saknar hemsida, så jag byggde ett förslag åt er. Kika gärna – helt utan krav.
            </div>
            <p className="text-center text-xs text-muted">Demoföretag – så här ser en körning ut</p>
          </div>
        </section>

        <section id="sa-funkar-det" className="bg-night text-white">
          <div className={`${wrap} flex flex-col gap-12 py-22`}>
            <div className="flex max-w-[640px] flex-col gap-3">
              <div className="text-[13px] font-bold uppercase tracking-[0.12em] text-sign">Så funkar det</div>
              <h2 className={h2}>Tre steg från idé till första kund.</h2>
            </div>
            <div className="flex flex-wrap gap-6">
              {steps.map((s) => (
                <div key={s.n} className="flex flex-[1_1_280px] flex-col gap-3 rounded-[20px] bg-night-soft p-7">
                  <div className="font-display text-[40px] font-extrabold text-sign">{s.n}</div>
                  <h3 className="text-[22px] font-bold">{s.title}</h3>
                  <p className="text-[#C9D6CF]">{s.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className={`${wrap} flex flex-col gap-10 pt-22`}>
          <div className="flex max-w-[680px] flex-col gap-3">
            <h2 className={h2}>Två AI-kollegor gör jobbet.</h2>
            <p className="text-[17px] text-body">Välj vem du vill prata med. Båda hittar företagen, bygger sajten och skriver säljmeddelandet åt dig.</p>
          </div>
          <div className="flex flex-wrap gap-6">
            {agents.map((a) => (
              <div key={a.name} className="flex min-w-0 flex-[1_1_340px] flex-col gap-4 rounded-3xl border border-line bg-white p-8">
                <div className="flex items-center gap-4">
                  <div aria-hidden="true" className={`flex h-16 w-16 flex-none items-center justify-center rounded-full font-display text-[28px] font-extrabold ${a.badge}`}>{a.initial}</div>
                  <div>
                    <h3 className="font-display text-[28px] font-extrabold tracking-tight">{a.name}</h3>
                    <div className="text-[15px] font-semibold text-forest">{a.role}</div>
                  </div>
                </div>
                <p className="text-body">{a.text}</p>
                <div className="rounded-[14px] bg-[#EEF2EF] px-4 py-3 text-[15px]">{a.example}</div>
              </div>
            ))}
          </div>
        </section>

        <section className={`${wrap} flex flex-wrap items-center gap-14 py-22`}>
          <div className="flex min-w-0 flex-[1_1_380px] flex-col gap-5">
            <h2 className={h2}>Den väljer företagen som är värda din tid.</h2>
            <p className="text-[17px] text-body">Skylta går igenom fler företag än du ber om och sållar bort myndigheter, stängda verksamheter och alla du inte kan nå. Du ser alltid varför ett företag hoppades över.</p>
          </div>
          <div className="min-w-0 flex-[1_1_420px] rounded-3xl border border-line bg-white p-6">
            <div className="pb-3 font-bold">Frisörer i Linköping</div>
            {shortlist.map((r) => (
              <div key={r.name} className="flex flex-wrap items-center justify-between gap-2 border-t border-[#E6EAE7] py-3.5">
                <div>
                  <div className="font-semibold">{r.name}</div>
                  <div className="text-[13px] text-muted">{r.meta}</div>
                </div>
                <span className={`rounded-full px-3 py-1.5 text-[13px] font-semibold ${r.ok ? "bg-[#DDEFE6] text-[#0A5A3F]" : "bg-[#ECEFEC] text-body"}`}>{r.status}</span>
              </div>
            ))}
          </div>
        </section>

        <section id="exempel" className="bg-mist-dark">
          <div className={`${wrap} flex flex-col gap-10 py-22`}>
            <div className="flex max-w-[680px] flex-col gap-3">
              <h2 className={h2}>Sajter som de här, klara på några minuter.</h2>
              <p className="text-[17px] text-body">Varje sajt skrivs för just det företaget. De tre här är demoföretag.</p>
            </div>
            <div className="flex flex-wrap gap-6">
              {demos.map((d) => (
                <div key={d.brand} className="min-w-0 flex-[1_1_300px] overflow-hidden rounded-[20px] border border-line bg-white">
                  <div className={`flex min-h-[200px] flex-col justify-end gap-3.5 px-6 py-9 ${d.box}`}>
                    <div className={`text-xs uppercase tracking-[0.12em] ${d.label}`}>{d.brand}</div>
                    <div className="font-display text-[28px] font-bold leading-[1.1]">{d.headline}</div>
                    <span className={`self-start rounded-full px-3.5 py-2 text-[13px] font-bold ${d.btn}`}>{d.cta}</span>
                  </div>
                  <div className="px-5 py-4 text-sm text-muted">{d.meta}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className={`${wrap} flex flex-col gap-10 py-22`}>
          <div className="flex max-w-[680px] flex-col gap-3">
            <h2 className={h2}>Kunderna är dina. Pengarna också.</h2>
            <p className="text-[17px] text-body">Ingen marknadsplats och ingen mellanhand. Skylta är verktyget, byrån är du.</p>
          </div>
          <div className="flex flex-wrap gap-6">
            {perks.map((p) => (
              <div key={p.title} className="flex flex-[1_1_230px] flex-col gap-2 rounded-[20px] border border-line bg-white p-6">
                <h3 className="text-lg font-bold">{p.title}</h3>
                <p className="text-[15px] text-body">{p.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="priser" className="bg-mist-dark">
          <div className={`${wrap} flex flex-col gap-10 py-22`}>
            <div className="flex max-w-[680px] flex-col gap-3">
              <h2 className={h2}>Testa gratis i 7 dagar.</h2>
              <p className="text-[17px] text-body">Skapa ett konto och prova utan kort. Vill du fortsätta efter 7 dagar väljer du en plan. Priser exkl. moms.</p>
            </div>
            <div className="flex flex-wrap items-stretch gap-6">
              {(Object.keys(PLANS) as PlanId[]).map((id) => {
                const p = PLANS[id];
                const featured = id === "proffs";
                return (
                  <div key={id} className={`flex min-w-0 flex-[1_1_290px] flex-col gap-5 rounded-3xl p-8 ${featured ? "bg-night text-white" : "border border-line bg-white"}`}>
                    {featured && <span className="self-start rounded-full bg-sign px-3 py-1 text-xs font-bold text-ink">Populärast</span>}
                    <div>
                      <h3 className="text-xl font-bold">{p.name}</h3>
                      <p className={`mt-1 text-[15px] ${featured ? "text-[#C9D6CF]" : "text-muted"}`}>{p.tagline}</p>
                    </div>
                    <div>
                      <span className="font-display text-[44px] font-extrabold tracking-tight">{p.price}</span>
                      <span className={featured ? "text-[#C9D6CF]" : "text-muted"}> /mån</span>
                    </div>
                    <ul className="flex flex-col gap-2.5 text-[15px]">
                      {p.features.map((f) => <li key={f}>{f}</li>)}
                    </ul>
                    <Link href="/login?mode=signup" className={`mt-auto rounded-full px-5 py-3.5 text-center font-semibold ${featured ? "bg-sign text-ink" : "border border-ink bg-white text-ink"}`}>Testa gratis</Link>
                  </div>
                );
              })}
            </div>
            <p className="text-sm text-muted">Under testperioden ingår 1 hemsida, tillräckligt för att se en hel körning. Ingen bindningstid.</p>
          </div>
        </section>

        <section id="fragor" className="mx-auto flex max-w-[760px] flex-col gap-8 px-6 py-22">
          <h2 className={h2}>Vanliga frågor</h2>
          <div className="flex flex-col gap-3">
            {faq.map((f, i) => (
              <details key={f.q} open={i === 0} className="rounded-2xl border border-line bg-white px-5 py-4">
                <summary className="cursor-pointer text-[17px] font-semibold">{f.q}</summary>
                <p className="mt-3 text-body">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="px-6 pb-22">
          <div className="mx-auto flex max-w-[1072px] flex-col items-center gap-5 rounded-[32px] bg-forest px-8 py-16 text-center text-white">
            <h2 className="max-w-[720px] font-display text-[32px] font-extrabold leading-[1.05] tracking-tight sm:text-[52px]">Bygg din första kundsajt i dag.</h2>
            <p className="text-lg text-[#E2F1EA]">7 dagar gratis. Ingen bindningstid.</p>
            <Link href="/login?mode=signup" className="rounded-full bg-sign px-8 py-4 text-[17px] font-bold text-ink">Testa gratis</Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className={`${wrap} flex flex-wrap items-center justify-between gap-4 py-8 text-sm text-muted`}>
          <div className="flex items-center gap-3 text-ink"><Logo size={28} /></div>
          <span>[DITT FÖRETAGSNAMN] · Org.nr [ORG.NR]</span>
        </div>
      </footer>
    </div>
  );
}
