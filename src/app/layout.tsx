import type { Metadata, Viewport } from "next";
import { Baloo_2, Be_Vietnam_Pro } from "next/font/google";
import BottomNav from "@/components/BottomNav";
import DevAgentation from "@/components/DevAgentation";
import FeedbackButton from "@/components/FeedbackButton";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import "./globals.css";

/**
 * Two families, both as variable fonts.
 *
 * These used to list five static weights each, which is ten font files per
 * subset — 192KB of woff2 on a phone loading a game. Omitting `weight` makes
 * `next/font` serve the variable version instead: one file per subset covering
 * the whole weight range, including the 900 that `font-black` asks for and no
 * static weight here ever provided.
 *
 * `latin-ext` stays. Lithuanian removed as an *interface* language, but player
 * names are free text and Bačiauskas needs the č.
 *
 * The display face is Baloo 2, not Plus Jakarta Sans. The logo's drawn Q is the
 * capital of the typeset word rather than a mark sitting beside it, so the drawn
 * letter and the typeset ones have to belong to one alphabet: Baloo's rounded
 * terminals are the same gesture as the mark's tail. See BRAND.md revision 03.
 */
const baloo2 = Baloo_2({
  variable: "--font-headline",
  subsets: ["latin", "latin-ext"],
});

/**
 * Be Vietnam Pro has no variable version, so the weights are explicit — but
 * they now match what the code actually asks for, which the old list didn't:
 *
 *   - `300` is gone: `font-light` appears nowhere.
 *   - `800` and `900` are new. `font-extrabold` is used 137 times and
 *     `font-black` 13, mostly on body-font elements, and neither weight was
 *     being loaded — the browser was synthesising both.
 */
const beVietnamPro = Be_Vietnam_Pro({
  variable: "--font-body",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  /**
   * Every route reported "Quizmo" and nothing else, so a screen reader
   * announced the same page name everywhere and a tab strip was unreadable.
   * Each route now sets its own title through a layout — pages here are all
   * client components and can't export `metadata` themselves — and this
   * template appends the app name.
   */
  title: {
    default: "Quizmo",
    template: "%s · Quizmo",
  },
  description: "Interactive quizzes. Play solo or with friends!",
  manifest: "/manifest.json",
  icons: {
    /**
     * `src/app/icon.svg` is picked up automatically and served first. This
     * entry is the fallback for clients that will not take an SVG favicon.
     */
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
      <body className={`${baloo2.variable} ${beVietnamPro.variable} font-body antialiased`}>
        {/* Atmosphere. Fixed, pointer-events:none, GPU-composited — they sit
            behind (aurora, vignette) and above (grain) every screen so the app
            reads as one lit space rather than a stack of dark pages. */}
        <div className="aurora" aria-hidden="true" />
        <div className="shapes" aria-hidden="true" />
        <div className="vignette" aria-hidden="true" />
        <div className="grain" aria-hidden="true" />
        <LanguageProvider>
          {/*
            * Room for the bottom nav.
            *
            * The nav is `fixed` and mobile-only, so content scrolled underneath
            * it and the last row of a long list was unreachable — the library
            * and the editor both ended with their per-row actions covered.
            * Padding here rather than on each page, since the nav is global.
            */}
          <div className="pb-24 sm:pb-0">{children}</div>
          <BottomNav />
          <FeedbackButton />
        </LanguageProvider>
        <DevAgentation />
      </body>
    </html>
  );
}
