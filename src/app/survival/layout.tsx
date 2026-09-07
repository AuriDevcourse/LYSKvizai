import type { Metadata } from "next";

/**
 * Titles the route. The page itself is a client component, which cannot export
 * `metadata`, so this thin layout carries it. See the note on `title.template`
 * in the root layout.
 */
export const metadata: Metadata = {
  title: "Survival",
  description: "Keep answering until you miss.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
