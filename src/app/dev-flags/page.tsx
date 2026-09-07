"use client";

import FlagArt from "@/components/games/FlagArt";
import { FLAGS, officialPalette, playableRegions } from "@/lib/games/flags";

/**
 * Contact sheet for the flag artwork. Development aid only — it isn't linked
 * from anywhere and exists so the drawings can be checked against the real
 * flags at a glance, which is much faster than opening 23 game rounds.
 */
export default function DevFlagsPage() {
  // Development aid, not a feature. It ships in the bundle otherwise and shows
  // up as a crawlable route on the live site for no reason.
  if (process.env.NODE_ENV === "production") return null;

  const total = FLAGS.reduce((n, f) => n + playableRegions(f).length, 0);
  return (
    <div className="min-h-svh px-6 py-10">
      <h1 className="font-headline mb-1 text-2xl font-extrabold text-white">
        {FLAGS.length} flags · {total} playable colour references
      </h1>
      <p className="mb-8 text-sm text-white/45">
        Every colour cites a published specification. Development view.
      </p>
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
        {FLAGS.map((flag) => (
          <div key={flag.id} className="surface rounded-2xl p-3">
            <div className="overflow-hidden rounded-lg">
              <FlagArt id={flag.id} colors={officialPalette(flag)} width={200} title={flag.name} />
            </div>
            <p className="mt-2 text-sm font-extrabold text-white">{flag.name}</p>
            <p className="text-xs text-white/40">
              {playableRegions(flag).length} playable
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
