# Patterns

Five seamless tiles, 240 units square, each under 2 KB.

**Seamless by construction:** a shape reaching past a tile edge is drawn again on
the opposite edge. Verified by tiling each at 60px, where a seam would be
obvious.

## Colour comes from CSS, not from the file

Apply them with `mask-image`, not `background-image`. An SVG referenced as
`background-image` is its own document and never sees the page's colour, so
`currentColor` inside it resolves to black. Masking uses only the tile's alpha:

```css
.surface::before {
  content: ""; position: absolute; inset: 0; pointer-events: none;
  background-color: var(--color-primary);   /* the colour */
  mask-image: url(pattern-scatter.svg);
  -webkit-mask-image: url(pattern-scatter.svg);
  mask-size: 120px 120px; mask-repeat: repeat;
  opacity: .12;                             /* the weight */
}
```

Inlined straight into the DOM instead, `currentColor` works as normal.

| Tile | For |
|---|---|
| `pattern-scatter.svg` | quiet enough to sit behind body text |
| `pattern-grid.svg` | even grid, one cell rotated |
| `pattern-answers.svg` | one of each answer shape per tile |
| `pattern-burst.svg` | dense; celebration and results surfaces |
| `pattern-dots.svg` | the calmest of the set |
