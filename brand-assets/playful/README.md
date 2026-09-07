# Quizmo logo — 2026-09-07

Review sheet: <https://claude.ai/code/artifact/25414c4e-5e45-4f43-8a88-078924c481b8>

## The logo

**`logo.svg`** — the drawn Q *is* the word's capital: an orange Q followed by
"uizmo". A Q mark placed *beside* the word "Quizmo" reads as "Q Quizmo", the
letter twice; those versions are in `superseded/`.

The letters are outlines, not a webfont reference, so the file renders anywhere
with no font to load and no licence to ship. Source: Baloo 2 instanced at weight
800 (OFL). Cap height 1000 units; the mark's ink is 1.04x the letter's, an
optical bump because round forms read small beside flat-sided ones.

| File | Use |
|---|---|
| `logo.svg` | off-white letters, orange Q — on dark |
| `logo-dark-ink.svg` | near-black letters, orange Q — on light |
| `logo-mono-black.svg` | all near-black — on orange, or one-colour print |
| `logo-mono-white.svg` | all off-white — on photographs, dark print |
| `logo-{dark,light,on-orange}.png` | raster, if something cannot take SVG |
| `logo-transparent{,-black,-white}.png` | raster with alpha, for compositing |
| `logo-stacked.png` | square spaces: mark above the name set **lowercase**, so a drawn Q and a typeset Q never meet |

## The mark

**`mark-primary.svg`** — the same Q alone. This is the icon: favicon, app icon,
avatar, 16px tab. `mark-alternate.svg` is the same Q with a round counter.
`mark-primary-*.png` (16→1024) and `favicon.ico` rasterise from the SVG's own
numbers.

There is **no mark-plus-Quizmo lockup** by design. For square spaces use the
mark alone or `logo-stacked.png`.

## Banners

`og-dark.jpg`, `og-orange.jpg` and their `-alt` variants — 1200x630, plates
generated in the playful direction, logo composited afterwards. Never generated:
these models cannot spell.

## Notes for whoever redraws this

The mark took three rounds and the failures repeat:

- thin ring + long tail → **magnifying glass**
- thick ring + small counter → **balloon**
- fat ring + large counter + short tail → **a Q**

Nothing goes in the counter; every variant with a shape in it slid back to the
magnifier at 32px. The counter is knocked out, not filled, so the mark drops onto
any ground, and it is a rounded square rather than a circle — echoing the fourth
answer shape without reproducing Kahoot's four-shape grid.

On an orange ground the Q must be near-black. The orange-on-orange cut is
invisible, which is what `logo-mono-black.svg` is for.

`candidates/` holds the raw API returns. Regenerate the source directions with
`node scripts/generate-brand-assets.mjs --only=play-b,play-og`.

Not wired in: `public/` untouched, favicon unchanged, nothing committed.
