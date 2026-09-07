# Background plates

**Overlays with no ground of their own.** `CLAUDE.md` mounts `.aurora`,
`.vignette` and `.grain` once in `layout.tsx` and forbids per-page backgrounds,
so an opaque plate would cover the atmosphere the app already has. Drop one in as
an absolutely positioned, `pointer-events: none` overlay and set its opacity to
taste.

| File | Use | Size |
|---|---|---|
| `bg-lobby.svg` | lobby, waiting. Central band left clear. | 2.6 KB |
| `bg-celebrate.svg` | results, winner. Central band left clear. | 7.9 KB |
| `bg-empty.svg` | empty states. One illustration, `xMidYMax meet`. | 1.0 KB |
| `bg-lobby-plate.jpg` | the one usable generated plate, for share images | raster |
| `candidates/` | all six raw generated plates | raster |

## Why these are authored, not generated

One generated plate of six was usable. "Chunky rounded shapes" came back as
squiggly noodles for the celebration plate and as grey pebbles for the empty
state, and four of six arrived matted inside a frame the prompt never asked for.
Authoring gave exact palette colours, kilobyte files, clean scaling and a
vocabulary matching the icons.

## The trap in the clear zone

`lobby` and `celebrate` use `preserveAspectRatio="xMidYMid slice"`, so a short
wide container crops to the **vertical middle** — exactly where a room code or a
winner's name sits. The clear zone must therefore be a central band, not a region
near the burst's origin. My first version reserved space at the burst origin and
a shape landed on top of the winner's name.

`empty` uses `meet`, not `slice`: it is one illustration, and slicing cropped the
pile clean out of a short container.
