import type { Metadata } from "next";
import { Geist, Montserrat } from "next/font/google";
import BottomNav from "@/components/BottomNav";
import TopNav from "@/components/TopNav";
import LanguageToggle from "@/components/LanguageToggle";
import DevAgentation from "@/components/DevAgentation";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Quizmo",
  description: "Interactive quizzes. Play solo or with friends!",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.png",
    apple: "/icons/apple-touch-icon.png",
  },
  themeColor: "#46178f",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Quizmo",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${montserrat.variable} font-[Montserrat] antialiased`}>
        <LanguageProvider>
          <TopNav />
          <div className="fixed left-3 top-3 z-50 sm:hidden">
            <LanguageToggle />
          </div>
          {children}
          <BottomNav />
        </LanguageProvider>
        <DevAgentation />
      </body>
    </html>
  );
}
