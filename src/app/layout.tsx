import { Disclaimer } from "@/components/Disclaimer";
import { Providers } from "@/components/providers";
import { SiteHeader } from "@/components/SiteHeader";
import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: "Derby Family — Top 3 picks",
  description: "Family Kentucky Derby game: your name and your top 3 horses. No money.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} min-h-full antialiased`}
      >
        <Providers>
          <SiteHeader />
          <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8">
            {children}
          </main>
          <footer className="mx-auto mt-auto w-full max-w-6xl px-4 pb-10">
            <Disclaimer />
          </footer>
        </Providers>
      </body>
    </html>
  );
}
