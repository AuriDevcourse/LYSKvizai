# Generated brand assets — run 01, 2026-09-07

Not wired into the app. `public/` is untouched and the favicon is unchanged.
See BRAND.md section 5a for what was chosen and why, and
<https://claude.ai/code/artifact/08250701-a03b-4278-9848-9c2b85d79984> for the
review sheet.

- `icon.svg` — the mark. Hand-drawn on a 512 grid from generated direction A.
  This is the shippable file; the API output is not in it.
- `icon-*.png`, `favicon.ico` — rasterised from the same geometry as the SVG.
- `og-*.jpg` — 1200x630 Open Graph cards. `og-archivo-bloom` is the pick.
- `hero-wide.jpg` — 2100x900.
- `crop-og-*.jpg` — the Archivo vs Plus Jakarta Sans wordmark comparison.
- `candidates/` — all 14 raw API returns, including the two rejected marks.

Regenerate with `node scripts/generate-brand-assets.mjs --list`.

The banners are JPEG because the API has no output-format control. Anything
needing transparency or crisp edges is hand-drawn instead, which is why the mark
is SVG.
