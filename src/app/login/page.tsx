import Link from "next/link";
import { Logo } from "@/components/Logo";
import { login, signup } from "./actions";

const errors: Record<string, string> = {
  inloggning: "Fel e-post eller lösenord.",
  losenord: "Lösenordet måste vara minst 8 tecken.",
  registrering: "Det gick inte att skapa kontot. Har du redan ett konto?",
  lank: "Länken är ogiltig eller har gått ut.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; fel?: string; info?: string }>;
}) {
  const { mode, fel, info } = await searchParams;
  const isSignup = mode === "signup";

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-6 py-12">
      <Link href="/" aria-label="Skylta, startsida"><Logo /></Link>
      <div className="w-full max-w-[420px] rounded-3xl border border-line bg-white p-8">
        <h1 className="font-display text-3xl font-extrabold tracking-tight">
          {isSignup ? "Skapa konto" : "Logga in"}
        </h1>
        {fel && errors[fel] && (
          <p role="alert" className="mt-4 rounded-xl bg-[#FDECEC] px-4 py-3 text-[15px] text-[#8A1C1C]">{errors[fel]}</p>
        )}
        {info === "bekrafta" && (
          <p role="status" className="mt-4 rounded-xl bg-[#DDEFE6] px-4 py-3 text-[15px] text-[#0A5A3F]">
            Kolla din e-post och klicka på länken för att bekräfta kontot.
          </p>
        )}
        <form className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-[15px] font-medium">
            E-post
            <input name="email" type="email" required autoComplete="email" className="rounded-xl border border-[#C9D1CC] px-4 py-3 font-normal" />
          </label>
          <label className="flex flex-col gap-1.5 text-[15px] font-medium">
            Lösenord
            <input name="password" type="password" required minLength={8} autoComplete={isSignup ? "new-password" : "current-password"} className="rounded-xl border border-[#C9D1CC] px-4 py-3 font-normal" />
          </label>
          <button formAction={isSignup ? signup : login} className="mt-2 rounded-full bg-forest px-6 py-3.5 font-semibold text-white hover:bg-forest-dark">
            {isSignup ? "Skapa konto" : "Logga in"}
          </button>
        </form>
        <p className="mt-6 text-[15px] text-body">
          {isSignup ? (
            <>Har du redan ett konto? <Link className="font-semibold text-forest underline" href="/login">Logga in</Link></>
          ) : (
            <>Ny här? <Link className="font-semibold text-forest underline" href="/login?mode=signup">Skapa konto</Link></>
          )}
        </p>
      </div>
    </main>
  );
}

// Sidan beror på inloggning/databas och renderas vid varje anrop.
export const instant = false;
