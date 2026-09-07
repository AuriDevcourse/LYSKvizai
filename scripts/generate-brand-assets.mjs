#!/usr/bin/env node
/**
 * Generate Quizmo brand assets from the prompts in BRAND.md.
 *
 * The prompts live here rather than being parsed out of BRAND.md because a
 * prompt is code once you are sending it to an API: it needs a stable id, an
 * aspect ratio and a variant count, none of which fit in prose. BRAND.md
 * remains the source of truth for the *direction*; this file is the executable
 * form of it. If they drift, BRAND.md wins.
 *
 * Directions follow BRAND.md revision 02 ("Specimen"), which superseded the
 * revision 01 2x2 answer-shape grid — that grid reproduced Kahoot's.
 *
 *   GEMINI_API_KEY=... node scripts/generate-brand-assets.mjs
 *   node scripts/generate-brand-assets.mjs --only=icon-a,og-card
 *   node scripts/generate-brand-assets.mjs --list
 *   node scripts/generate-brand-assets.mjs --out=/tmp/brand --variants=1
 *
 * Output is JPEG, whatever is asked for: the API returns inline JPEG and has no
 * output-format control, so anything needing transparency or crisp edges gets
 * redrawn as SVG by hand afterwards. These are directions to choose between,
 * not shippable files.
 *
 * Nothing here writes into public/ or src/. That is a deliberate second step.
 */

import { writeFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const MODEL = "gemini-3-pro-image";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

/**
 * Prepended to every prompt. Explicit about ground, palette and exclusions
 * because "quiz app logo" produces the same four cliches every time.
 */
const PREAMBLE = `Flat vector illustration, geometric, precise, hard-edged.
Palette strictly limited to: near-black #0e0e0e, warm orange #ff9062, off-white #f4f2f0,
warm grey #3a3634, and sparingly #43a5fc blue, #66bb6a green, #c9a825 gold, #ff716c red.
No gradients. No drop shadows. No 3D, no bevel, no glossy highlight, no reflection.
No text, no letters, no numbers, no lettering of any kind.
Clean vector edges as if drawn in Illustrator, not rendered.`;

/**
 * The visual world the identity borrows from: Pantone chip books, calibration
 * targets, registration marks, spec sheets. Added to the marks and the cards,
 * not to the topic art, which needs to stay simple enough to read on a tile.
 */
const SPECIMEN = `Visual language of a printer's colour specimen card or a calibration target:
thin hairline rules, crop marks, small registration ticks, generous white space,
everything aligned to a strict grid.`;


/**
 * Playful set, added after the Specimen run read as clinical. A quiz played in a
 * room with friends should not look like a calibration target.
 *
 * What carries over: the orange, the near-black ground, the four answer colours.
 * What changes: rounded and chunky instead of hairline, tilted and bouncing
 * instead of grid-locked, no crop marks, no registration furniture.
 */
const PLAYFUL = `Flat vector illustration, bold and chunky, thick rounded forms, generous corner radii.
Playful, energetic, friendly, toy-like. Confident simple shapes, no fine detail, no hairlines.
Palette strictly limited to: warm orange #ff9062, deeper orange #ff793e, near-black #0e0e0e,
off-white #f4f2f0, and the four answer colours #ff716c red, #43a5fc blue, #66bb6a green, #c9a825 gold.
No gradients, no drop shadows, no 3D, no bevel, no gloss.
No text, no letters, no numbers, no lettering of any kind.
Clean vector edges as if drawn in Illustrator. Centred, square canvas, generous margin.`;

const PLAYFUL_ASSETS = [
  {
    id: "play-a",
    label: "Playful A — tumbling answer shapes",
    aspectRatio: "1:1",
    prompt: `${PLAYFUL}

A mark for a live quiz app: the four answer shapes — a triangle, a diamond, a circle
and a square — chunky with softly rounded corners, tumbling along a loose upward arc
as if tossed in the air. Each a different answer colour, each rotated to a different
angle, overlapping slightly. Energetic and off-grid, never a neat row or a 2x2 grid.
On an off-white #f4f2f0 ground.
Avoid: question marks, lightbulbs, brains, speech bubbles, dice, confetti specks,
neat grids, playing cards.`,
  },
  {
    id: "play-b",
    label: "Playful B — the chunky Q",
    aspectRatio: "1:1",
    prompt: `${PLAYFUL}

A mark for a live quiz app: a single bold geometric letter Q, drawn as a very thick
rounded ring in warm orange #ff9062, its tail a short fat rounded bar angled down-right.
Sitting inside the ring's opening, one small chunky shape in a contrasting answer colour.
Friendly, heavy, confident, slightly tilted counter-clockwise so it feels in motion.
On a near-black #0e0e0e ground. This is the one asset allowed a letter: the letter Q,
drawn as a shape, and nothing else.
Avoid: thin strokes, serif letterforms, question marks, at-signs, power buttons, loading spinners.`,
  },
  {
    id: "play-c",
    label: "Playful C — the chip, loosened up",
    aspectRatio: "1:1",
    prompt: `${PLAYFUL}

A mark for a live quiz app, evolving a colour-chip idea into something friendly:
a fat rounded square tilted about eight degrees clockwise, its upper two thirds solid
warm orange #ff9062, its lower third a near-black #0e0e0e band holding three chunky
rounded dots in red #ff716c, blue #43a5fc and green #66bb6a. Thick, toy-like, buoyant,
with a heavy off-white #f4f2f0 outline around the whole shape.
On an off-white #f4f2f0 ground. Must stay legible reduced to 16 by 16 pixels.
Avoid: hairlines, crop marks, registration ticks, price tags, luggage labels, batteries.`,
  },
  {
    id: "play-d",
    label: "Playful D — the burst",
    aspectRatio: "1:1",
    prompt: `${PLAYFUL}

A mark for a live quiz app: a burst of celebration. One fat rounded orange #ff9062
shape at the centre, with four chunky rounded shapes — a small triangle, diamond,
circle and square in the four answer colours — flying outward from it on radiating
diagonals, evenly spaced around it, each with a short thick rounded motion streak
behind it. Symmetrical, joyful, high energy.
On a near-black #0e0e0e ground.
Avoid: literal fireworks, starbursts with many thin rays, confetti specks, sparkles,
explosion clouds, sun with rays.`,
  },
  {
    id: "play-e",
    label: "Playful E — the buzzer",
    aspectRatio: "1:1",
    prompt: `${PLAYFUL}

A mark for a live quiz app: a big fat round buzzer button seen straight on from above,
a thick warm orange #ff9062 disc sitting in a chunky near-black #0e0e0e rounded base,
with three short thick rounded arcs above it on one side to show it has just been hit.
Flat top-down view, no perspective, no shadow, no thickness rendering.
On an off-white #f4f2f0 ground.
Avoid: perspective views, chrome, metal, shading, hands, cartoon bells, alarm clocks,
gameshow podiums, record players.`,
  },
];

const ASSETS = [
  {
    id: "icon-a",
    label: "App icon A — the colour chip",
    aspectRatio: "1:1",
    prompt: `${PREAMBLE}
${SPECIMEN}

A single app icon: a printer's colour specimen chip, seen flat and straight on.
A rounded square divided horizontally. The upper two thirds is one solid field of
warm orange #ff9062. The lower third is a near-black #0e0e0e label band holding
three small evenly spaced square swatches in red #ff716c, blue #43a5fc and green #66bb6a,
each the same size, aligned on one baseline, with a hairline rule above them.
Symmetrical, centred, generous margin.
Must stay legible reduced to 16 by 16 pixels: three shapes maximum at that size.
Avoid: question marks, lightbulbs, brains, speech bubbles, gameshow podiums, playing cards.`,
  },
  {
    id: "icon-b",
    label: "App icon B — the registration mark",
    aspectRatio: "1:1",
    prompt: `${PREAMBLE}

A single app icon: a printer's registration mark. A perfect circle crossed by a
horizontal and a vertical hairline that extend slightly past its edge, dividing
it into four equal quadrants. Three quadrants are empty on an off-white #f4f2f0
ground; one quadrant, the upper right, is filled solid warm orange #ff9062.
All linework in warm grey #3a3634 at a single consistent hairline weight.
Centred, geometric, mathematically exact, generous margin.
Must stay legible reduced to 16 by 16 pixels.
Avoid: crosshairs on a gun sight, targets with concentric rings, loading spinners, pie charts.`,
  },
  {
    id: "icon-c",
    label: "App icon C — four chips, one measured",
    aspectRatio: "1:1",
    prompt: `${PREAMBLE}
${SPECIMEN}

A single app icon on a near-black #0e0e0e ground: four small squares in a tight
row, equal size, equal gutters, horizontally centred. The second square from the
left is solid warm orange #ff9062 and sits very slightly larger with two small
registration ticks above and below it, as if it has been selected and measured.
The other three squares are dim warm grey #3a3634. One hairline rule runs
beneath the whole row, extending a little past both ends.
Centred, generous margin. Must stay legible reduced to 16 by 16 pixels.
Avoid: progress bars, equalisers, loading dots, barcodes, keyboard keys.`,
  },
  {
    id: "og-card",
    label: "Social / OG card — specimen sheet",
    aspectRatio: "16:9",
    prompt: `${PREAMBLE}
${SPECIMEN}

A wide social banner, landscape, near-black #0e0e0e ground.
Along the top edge, a row of four colour specimen chips: red #ff716c, blue #43a5fc,
green #66bb6a and gold #c9a825, each a plain rectangle with a hairline border and
small crop marks at its corners, evenly spaced, aligned on one baseline.
Small registration ticks in the top left and top right corners of the banner.
One long hairline rule in warm grey #3a3634 across the upper third.
A soft warm orange #ff9062 bloom, low intensity, in the far top left corner only.
The entire lower two thirds is empty near-black, left completely clear for text
to be placed later. Very faint film grain over everything.
Absolutely no text, no letters, no numbers, no words anywhere in the image.
Avoid: confetti, party balloons, trophies, quiz buzzers, stage lighting, people.`,
  },
  {
    id: "og-card-light",
    label: "Social / OG card — light variant",
    aspectRatio: "16:9",
    prompt: `${PREAMBLE}
${SPECIMEN}

A wide social banner, landscape, off-white #f4f2f0 paper ground with very faint
paper texture. Along the top edge, a row of four colour specimen chips: red
#ff716c, blue #43a5fc, green #66bb6a and gold #c9a825, each a plain rectangle
with a hairline warm grey #3a3634 border and small crop marks at its corners,
evenly spaced, aligned on one baseline. Small registration marks in the top left
and top right corners. Two long hairline rules across the upper third, close
together. A single solid warm orange #ff9062 rectangle at the far right of the
chip row, larger than the others. The entire lower two thirds left completely
clear for text to be placed later.
Absolutely no text, no letters, no numbers, no words anywhere in the image.
Avoid: confetti, balloons, trophies, stage lighting, people, mockup shadows.`,
  },
  {
    id: "banner-wide",
    label: "Wide hero banner — chip book spread",
    aspectRatio: "21:9",
    prompt: `${PREAMBLE}
${SPECIMEN}

An ultra-wide banner, near-black #0e0e0e ground. A fanned-out printer's colour
chip book seen flat from directly above, occupying the left third: a stack of
narrow rectangular chips overlapping in a shallow fan, each a solid colour drawn
strictly from the palette, with the widest and most prominent chip in warm orange
#ff9062. The remaining right two thirds is empty near-black with two hairline
warm grey #3a3634 rules and a few small registration ticks, left clear for text.
Flat top-down view, no perspective, no thickness, no shadow beneath the stack.
Absolutely no text, no letters, no numbers, no words anywhere in the image.
Avoid: hands holding the chips, desks, plants, laptops, product mockups.`,
  },
  {
    id: "topic-science",
    label: "Topic art sample — Science",
    aspectRatio: "1:1",
    prompt: `${PREAMBLE}

A flat geometric illustration representing Science, on a near-black #0e0e0e
ground, built from three to five simple shapes only. One solid warm orange
#ff9062 focal element. No scene, no perspective, no characters, no background
detail. Reads instantly at small size as a single icon-like image.
Square, centred, wide margin.
Avoid: Erlenmeyer flasks with bubbles, atoms with orbiting electrons, DNA helices,
microscopes, cartoon scientists.`,
  },
  {
    id: "play-og",
    label: "Playful banner — dark",
    aspectRatio: "16:9",
    prompt: `${PLAYFUL}

A wide landscape banner on a near-black #0e0e0e ground. Scattered across the upper
right area only: eight or nine chunky rounded shapes — triangles, diamonds, circles
and squares in the four answer colours plus warm orange — at varied sizes and varied
rotations, floating with generous space between them, some partly cropped by the top
and right edges. A soft warm orange glow behind the densest cluster.
The entire left half and lower half left completely empty near-black for a logo.
Absolutely no text, no letters, no numbers anywhere in the image.
Avoid: confetti specks, balloons, streamers, trophies, sparkles, people, dense patterns
that fill the whole frame.`,
  },
  {
    id: "play-og-light",
    label: "Playful banner — light",
    aspectRatio: "16:9",
    prompt: `${PLAYFUL}

A wide landscape banner on a solid warm orange #ff9062 ground. Scattered across the
upper right area only: eight or nine chunky rounded shapes — triangles, diamonds,
circles and squares in near-black #0e0e0e, off-white #f4f2f0 and the four answer
colours — at varied sizes and rotations, floating with generous space between them,
some partly cropped by the top and right edges.
The entire left half and lower half left completely empty flat orange for a logo.
Absolutely no text, no letters, no numbers anywhere in the image.
Avoid: confetti specks, balloons, streamers, trophies, sparkles, people, gradients,
dense patterns that fill the whole frame.`,
  },
  {
    id: "bg-lobby",
    label: "Background plate — lobby / waiting",
    aspectRatio: "16:9",
    prompt: `${PLAYFUL}

A wide landscape decorative plate, near-black #0e0e0e ground, very low contrast and
deliberately quiet: it sits behind text. Chunky rounded shapes — triangles, diamonds,
circles, squares — in dark warm grey #241f1d, barely lighter than the ground, scattered
sparsely across the whole frame at varied sizes and rotations, several cropped by the
edges. One single shape in muted warm orange, small, off to one side. Large empty
areas between shapes.
Absolutely no text, no letters, no numbers anywhere.
Avoid: bright colours, high contrast, dense patterns, confetti, glow, vignettes,
anything that would compete with text placed on top.`,
  },
  {
    id: "bg-celebrate",
    label: "Background plate — results / celebration",
    aspectRatio: "16:9",
    prompt: `${PLAYFUL}

A wide landscape decorative plate, near-black #0e0e0e ground. Chunky rounded shapes in
the four answer colours and warm orange bursting outward from a point low and centre,
as if thrown upward: denser and larger near the edges of the frame, sparse and empty
through the middle and lower centre. Some shapes cropped by the top and side edges.
A soft warm orange glow low centre.
The middle of the frame stays clear for a name and a score.
Absolutely no text, no letters, no numbers anywhere.
Avoid: literal confetti specks, streamers, balloons, fireworks, trophies, people,
sparkles, dense fill.`,
  },
  {
    id: "bg-empty",
    label: "Background plate — empty state",
    aspectRatio: "4:3",
    prompt: `${PLAYFUL}

A single friendly illustration for an empty state, near-black #0e0e0e ground: three or
four chunky rounded shapes resting in a loose pile at the bottom of the frame, as if set
down, one of them warm orange #ff9062 and the others dim warm grey #3a3634. Calm and
still, not energetic. Generous empty space above the pile.
Absolutely no text, no letters, no numbers anywhere.
Avoid: sad faces, cartoon characters, empty boxes, magnifying glasses, clouds, ghosts,
dotted outlines.`,
  },
];

ASSETS.push(...PLAYFUL_ASSETS);

/* ------------------------------------------------------------------ runner */

function parseArgs(argv) {
  const opts = { only: null, out: null, variants: 2, list: false };
  for (const arg of argv) {
    if (arg === "--list") opts.list = true;
    else if (arg.startsWith("--only=")) opts.only = arg.slice(7).split(",").filter(Boolean);
    else if (arg.startsWith("--out=")) opts.out = arg.slice(6);
    else if (arg.startsWith("--variants=")) opts.variants = Number(arg.slice(11));
    else {
      console.error(`Unknown argument: ${arg}`);
      process.exit(2);
    }
  }
  if (!Number.isInteger(opts.variants) || opts.variants < 1 || opts.variants > 6) {
    console.error("--variants must be an integer 1-6");
    process.exit(2);
  }
  return opts;
}

async function generate(asset, key) {
  const res = await fetch(`${ENDPOINT}?key=${encodeURIComponent(key)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: asset.prompt }] }],
      generationConfig: { imageConfig: { aspectRatio: asset.aspectRatio } },
    }),
  });

  const body = await res.json();
  if (body.error) throw new Error(`${body.error.status ?? res.status}: ${body.error.message}`);

  const candidate = body.candidates?.[0];
  const image = candidate?.content?.parts?.find((p) => p.inlineData)?.inlineData;
  if (!image) {
    // A refusal or a safety block comes back as text, or as no parts at all.
    const text = candidate?.content?.parts?.find((p) => p.text)?.text;
    throw new Error(`no image returned (finish=${candidate?.finishReason ?? "?"})${text ? `: ${text.slice(0, 200)}` : ""}`);
  }
  return {
    buffer: Buffer.from(image.data, "base64"),
    ext: image.mimeType === "image/png" ? "png" : "jpg",
  };
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));

  if (opts.list) {
    for (const a of ASSETS) console.log(`${a.id.padEnd(16)} ${a.aspectRatio.padEnd(6)} ${a.label}`);
    return;
  }

  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    console.error("GEMINI_API_KEY is not set.");
    process.exit(1);
  }

  const selected = opts.only ? ASSETS.filter((a) => opts.only.includes(a.id)) : ASSETS;
  if (opts.only) {
    const missing = opts.only.filter((id) => !ASSETS.some((a) => a.id === id));
    if (missing.length) {
      console.error(`Unknown asset id(s): ${missing.join(", ")}. Try --list.`);
      process.exit(2);
    }
  }

  const outDir = resolve(opts.out ?? "brand-assets");
  await mkdir(outDir, { recursive: true });

  let failed = 0;
  for (const asset of selected) {
    for (let v = 1; v <= opts.variants; v++) {
      const name = `${asset.id}-${v}`;
      try {
        const { buffer, ext } = await generate(asset, key);
        const path = resolve(outDir, `${name}.${ext}`);
        await writeFile(path, buffer);
        console.log(`ok   ${name.padEnd(18)} ${(buffer.length / 1024).toFixed(0)} KB  ${path}`);
      } catch (err) {
        failed++;
        console.error(`FAIL ${name.padEnd(18)} ${err.message}`);
      }
    }
  }

  console.log(`\n${outDir}`);
  if (failed) {
    console.error(`${failed} generation(s) failed.`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
