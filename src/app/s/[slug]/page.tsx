import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { SiteContentSchema } from "@/lib/ai";
import { z } from "zod";

const Stored = SiteContentSchema.extend({
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
});

const themes = {
  natt: { hero: "bg-[#1B1B1F] text-white", sub: "text-[#D4D6DD]", btn: "bg-[#FFD23F] text-[#10201A]", accent: "text-[#1B1B1F]" },
  hav: { hero: "bg-[#1F4E79] text-white", sub: "text-[#D5E3F0]", btn: "bg-white text-[#1F4E79]", accent: "text-[#1F4E79]" },
  skog: { hero: "bg-[#0E2A20] text-white", sub: "text-[#C9D6CF]", btn: "bg-[#FFD23F] text-[#10201A]", accent: "text-[#0B6B4A]" },
  ljus: { hero: "bg-[#D9F1EA] text-[#10201A]", sub: "text-[#2E4A40]", btn: "bg-[#10201A] text-white", accent: "text-[#0B6B4A]" },
} as const;

async function load(slug: string) {
  const admin = createAdminClient();
  const { data } = await admin.from("sites").select("business_name, content").eq("slug", slug).maybeSingle();
  if (!data) return null;
  const content = Stored.safeParse(data.content);
  if (!content.success) return null;
  return { name: data.business_name as string, content: content.data };
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const site = await load(slug);
  return {
    title: site ? site.name : "Sidan finns inte",
    description: site?.content.subheadline,
    robots: { index: false, follow: false }, // förslag, inte kundens riktiga sajt än
  };
}

export default async function SitePage({ params }: Props) {
  const { slug } = await params;
  const site = await load(slug);
  if (!site) notFound();
  const { name, content } = site;
  const t = themes[content.theme];
  const tel = content.phone ? `tel:${content.phone.replace(/[^\d+]/g, "")}` : null;

  return (
    <div className="min-h-screen bg-white text-[#10201A]">
      <header className={t.hero}>
        <div className="mx-auto flex max-w-[960px] flex-col gap-6 px-6 pb-20 pt-8">
          <div className="text-sm font-semibold uppercase tracking-[0.12em]">{name}</div>
          <h1 className="mt-10 font-display text-[40px] font-extrabold leading-[1.05] tracking-tight sm:text-[64px]">{content.headline}</h1>
          <p className={`max-w-[620px] text-lg ${t.sub}`}>{content.subheadline}</p>
          {tel && (
            <a href={tel} className={`self-start rounded-full px-7 py-4 text-[17px] font-bold ${t.btn}`}>
              {content.cta_label}
            </a>
          )}
        </div>
      </header>

      <main className="mx-auto flex max-w-[960px] flex-col gap-16 px-6 py-16">
        <section className="flex flex-col gap-4">
          <h2 className={`font-display text-3xl font-extrabold tracking-tight ${t.accent}`}>Om oss</h2>
          <p className="max-w-[680px] text-lg text-[#3D4A44]">{content.about}</p>
        </section>

        <section className="flex flex-col gap-6">
          <h2 className={`font-display text-3xl font-extrabold tracking-tight ${t.accent}`}>Det här hjälper vi till med</h2>
          <div className="flex flex-wrap gap-5">
            {content.services.map((s) => (
              <div key={s.title} className="flex flex-[1_1_260px] flex-col gap-2 rounded-2xl border border-[#DCE2DE] p-6">
                <h3 className="text-lg font-bold">{s.title}</h3>
                <p className="text-[15px] text-[#3D4A44]">{s.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-3 rounded-3xl bg-[#F4F6F3] p-8">
          <h2 className={`font-display text-3xl font-extrabold tracking-tight ${t.accent}`}>Kontakt</h2>
          {content.address && <p className="text-lg">{content.address}</p>}
          {tel && <a href={tel} className="text-lg font-semibold underline">{content.phone}</a>}
        </section>
      </main>

      <footer className="border-t border-[#DCE2DE] px-6 py-6 text-center text-sm text-[#4E5B55]">
        Förslag på hemsida för {name} · byggt med Skylta
      </footer>
    </div>
  );
}

// Sidan beror på inloggning/databas och renderas vid varje anrop.
export const instant = false;
