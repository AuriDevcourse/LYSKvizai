# Topic icons

Fourteen icons, one per topic in `src/lib/topics.ts`. Drawn to the logo's
vocabulary: heavy stroke, round joins, two or three elements at most.

**Stroke weight is one constant** (`W = 7` on a 64 grid) so the whole set moves
together. That is the property a hand-drawn set usually loses by icon nine.

`currentColor` throughout, so a component that inlines the SVG inherits colour
from its tile. Holes (the ghost's eyes) are knockouts via `fill-rule="evenodd"`,
never a second colour: a hardcoded dark eye disappears the moment the icon itself
is dark.

## Wiring them in

`topics.ts` currently holds `icon: LucideIcon`. Replacing it means inlining these
as components, and revisiting the fourteen `bg` values at the same time, because
the colours are what make the icons read. See the review sheet for two proposed
colour systems: <https://claude.ai/code/artifact/3ca15700-25e3-4ef4-8969-917940f55c4f>

## Notes

Three were redrawn after seeing the set together, which is the only way these
faults show:

- **maths** was a lopsided blob, then a clover once the corner radius was too
  generous. Corner radius 3, not 5.
- **gaming** was a d-pad, the same cross as maths. Now a ghost.
- **science** had its lip meeting its neck in a T-junction that read as a notch.

**technology** still reads a little like a crosshair below 24px. Topic tiles are
large, so this has not been chased further.
