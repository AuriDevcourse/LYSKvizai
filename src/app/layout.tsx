import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { Plus_Jakarta_Sans, Be_Vietnam_Pro } from "next/font/google";
import BottomNav from "@/components/BottomNav";
import DevAgentation from "@/components/DevAgentation";
import FeedbackButton from "@/components/FeedbackButton";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext"],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-headline",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700", "800"],
});

const beVietnamPro = Be_Vietnam_Pro({
  variable: "--font-body",
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Quizmo",
  description: "Interactive quizzes. Play solo or with friends!",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.png",
    apple: "/icons/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Quizmo",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0e0e0e",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${plusJakartaSans.variable} ${beVietnamPro.variable} font-[var(--font-body)] antialiased`}>
        <LanguageProvider>
          {children}
          <BottomNav />
          <FeedbackButton />
        </LanguageProvider>
        <DevAgentation />
      </body>
    </html>
  );
}
