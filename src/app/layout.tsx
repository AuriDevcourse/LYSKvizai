import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Agentation } from "agentation";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  title: "LYS Kvizai — Žaisk, mokykis, laimėk!",
  description:
    "Interaktyvūs kvizai nuo LYS. Žaisk vienas arba su draugais Kahoot stiliumi!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="lt">
      <body className={`${geistSans.variable} antialiased`}>
          {children}
          {process.env.NODE_ENV === "development" && <Agentation />}
        </body>
    </html>
  );
}
