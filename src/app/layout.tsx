import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Skylta – starta webbyrå från köksbordet",
  description:
    "Skylta hittar lokala företag utan hemsida, bygger en färdig sajt åt dem med AI och skriver säljmeddelandet. Du sköter affären.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
