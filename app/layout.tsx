import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { DataProvider } from "@/lib/data/provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cadence",
  description: "Time > Points",
};

import { SiteHeader } from "@/components/SiteHeader";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-zinc-50 dark:bg-zinc-950 flex justify-center min-h-screen`}
      >
        <DataProvider>
          <div className="w-full max-w-[1400px] bg-background min-h-screen shadow-2xl border-x mx-4 my-4 rounded-xl overflow-hidden flex flex-col">
            <SiteHeader />
            <main className="flex-1 p-6">
              {children}
            </main>
          </div>
        </DataProvider>
      </body>
    </html>
  );
}
