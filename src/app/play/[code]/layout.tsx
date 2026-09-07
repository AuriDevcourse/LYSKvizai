import type { Metadata } from "next";

/**
 * The room code in the tab title.
 *
 * Hosts routinely have the big screen and their own phone open at once, and
 * both said "Quizmo". The code is the one thing that distinguishes them.
 */
export async function generateMetadata(
  { params }: { params: Promise<{ code: string }> }
): Promise<Metadata> {
  const { code } = await params;
  const clean = code.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4);
  return { title: clean ? `Room ${clean}` : "Room" };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
