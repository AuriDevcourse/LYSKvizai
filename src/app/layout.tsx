import type { Metadata } from "next";
import { Geist, Montserrat } from "next/font/google";
import { Agentation } from "agentation";
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
  description:
    "Interactive quizzes. Play solo or with friends!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="lt">
      <body className={`${geistSans.variable} ${montserrat.variable} font-[Montserrat] antialiased`}>
          {children}
          {process.env.NODE_ENV === "development" && <Agentation />}
        </body>
    </html>
  );
}
