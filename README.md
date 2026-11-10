# Skylta

Hitta lokala svenska företag utan hemsida, bygg en sajt åt dem med AI och få ett färdigt säljmeddelande.
Byggt med Next.js 16, Supabase och Stripe.

## Vad som finns

| Del | Var |
| --- | --- |
| Landningssida | `src/app/page.tsx` |
| Inloggning (e-post + lösenord) | `src/app/login`, `src/app/auth/confirm`, `src/proxy.ts` |
| Chatt med Nils och Saga | `src/app/app`, `src/app/api/run/route.ts` |
| Företagssök (Google Places) | `src/lib/places.ts` |
| AI som skriver sajt och sms | `src/lib/ai.ts` |
| Publika kundsajter | `src/app/s/[slug]/page.tsx` |
| Abonnemang | `src/app/api/stripe/*`, `src/lib/plans.ts` |
| Databas | `supabase/migrations/` |

Så går en körning till: användaren skriver t.ex. "5 frisörer i Linköping". Servern tolkar beställningen,
söker i Google Places, sållar bort företag som inte passar (och sparar varför), låter AI skriva en sajt
och ett sms per företag, och sparar allt. Sajten visas på `/s/<slug>`.

- **Nils** bygger åt företag som saknar hemsida.
- **Saga** bygger ett nytt förslag åt företag som redan har en hemsida.

## Kom igång

1. `npm install`
2. Kopiera `.env.example` till `.env.local` och fyll i nycklarna.
3. **Supabase:** skapa ett projekt och kör migrationen, antingen med `npx supabase link` + `npx supabase db push`
   eller genom att klistra in `supabase/migrations/20261110160034_init.sql` i SQL Editor.
   Under Authentication > Email Templates > Confirm signup, låt länken peka på
   `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email`, och sätt Site URL till din adress.
4. **Stripe:** skapa tre återkommande priser i SEK (Start, Proffs, Byrå) och lägg pris-ID:na i `.env.local`.
   Lägg till en webhook mot `/api/stripe/webhook` med händelserna `customer.subscription.created`,
   `customer.subscription.updated` och `customer.subscription.deleted`. Lokalt:
   `stripe listen --forward-to localhost:3000/api/stripe/webhook`. Slå på kundportalen i Stripe.
5. **Google:** aktivera Places API (New) och skapa en API-nyckel.
6. `npm run dev`

## Säkerhet

- Alla tabeller har RLS. Inloggade användare kan bara läsa sina egna rader; all skrivning sker på servern
  med secret key efter att användare och plan-gränser är kontrollerade.
- `SUPABASE_SECRET_KEY`, `STRIPE_SECRET_KEY` och `ANTHROPIC_API_KEY` används bara på servern.
- Kundsajterna är märkta `noindex` så länge de är förslag.

## Inte byggt än

- Saga bedömer inte hur gammal eller ful en befintlig sajt är. Hon väljer företag som har en hemsida.
- Ändra en sajt i efterhand via chatten.
- Egna domäner för kundsajter, CSV-export och AI-krediter.
- Kedjor känns inte igen automatiskt.
- Bilder på kundsajterna.

## Att kontrollera innan lansering

- Googles villkor för Places API begränsar hur länge företagsuppgifter får sparas. Läs dem och anpassa lagringen.
- Sms och mejl i marknadsföringssyfte till enskilda firmor kräver i regel samtycke (marknadsföringslagen).
  Kontrollera vad som gäller innan du eller dina användare skickar.
- GDPR: integritetspolicy, personuppgiftsbiträdesavtal med leverantörerna och villkor behövs.
- Moms: priserna visas exkl. moms. Ställ in skatt i Stripe.
