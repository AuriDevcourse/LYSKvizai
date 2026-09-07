import type { Metadata } from "next";

/**
 * Titles the route. The page itself is a client component, which cannot export
 * `metadata`, so this thin layout carries it. See the note on `title.template`
 * in the root layout.
 */
export const metadata: Metadata = {
  title: "Join a game",
  description: "Enter a room code to join, or start a new game.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
