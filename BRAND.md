# Quizmo — brand

Written 2026-09-07. Derived from what the app already is, not invented around
it: every colour, font, motion token and line of voice below is taken from the
shipped product. Where something is a **proposal** rather than a description, it
says so.

This file is the source of truth for the code and the input for asset
generation. `CLAUDE.md` holds the implementation rules; this holds the why.


---

## Revision 02 assessment (2026-09-07)

Reviewed against the `frontend-design` and `stop-slop` skills. Revision 01
described the shipped system accurately and never questioned it. Three problems
survived that pass.

**1. The palette is the generated-design default.** Near-black ground, one warm
accent, a geometric sans. `frontend-design` names that cluster explicitly:
"near-black with a lone acid-green or vermilion pop" and "Inter or Space
Grotesk as the safe face". Quizmo reached it honestly, because a dark room and a
television demand it, and the result still looks like nobody chose it.

**2. The four answer colours belong to the genre.** Revision 01 called them
"the closest thing Quizmo has to a mascot". Kahoot ships a red triangle, blue
diamond, yellow circle and green square. Quizmo ships the same four shapes with
two colours swapped. They are a functional requirement and must not change.
They are also the least ownable thing on the screen, and claiming them as
equity was wrong.

**3. The identity says nothing about the one thing no competitor does.** Quizmo
grades a colour against its published specification and computes CIEDE2000
against the real value. Nothing in the visual identity refers to it.

### The direction: Specimen

Build on verification. The visual world of Pantone chip books, calibration
targets, registration marks, spec sheets and tabular measured values. It
describes what the product does, no competitor looks like it, it generates
structure, and it reframes the four answer colours from generic game buttons
into specimens carrying published values.

### Type proposal

| Role | Now | Proposed | Why |
|---|---|---|---|
| Display | Plus Jakarta Sans 800 | **Archivo**, wdth 125, 800 | Industrial and wide. Reads across a room and sits nowhere near the geometric sans every generated page uses. |
| Body | Be Vietnam Pro | **unchanged** | Already ships, sets small text well, replacing it buys nothing. |
| Values | (none) | **Martian Mono** | Room codes, hex values, delta-E figures, scores. A four-letter room code is data, and the product sets it in the display face today. |

Cost: a font swap in `layout.tsx` and a pass over the display classes.

### Mark directions, revised

Revision 01 proposed packing the four answer shapes into a 2x2 grid. That
reproduces Kahoot's grid, which is problem 2. Replaced with: **A** the Pantone
chip, **B** the printer's registration mark, **C** the four-chip strip with one
measured. None built.

### Voice

Revision 01 broke its own rule against pull-quote prose 24 times by em dash
count. Added to the rules: cut adverbs, cut em dashes, cut any sentence that
reads like a pull quote. Revision 02 of the review page holds to it.

Sections 3 and 4 below still describe the shipped product correctly. Section 4's
mark proposal is superseded by the directions above. Section 5a records what those
directions produced and which one won.

---

## Revision 03 (2026-09-07) — Specimen rejected, playful adopted

Auri's verdict on revision 02, after seeing it built: too clinical, and an icon
is not a logo. Both are right. Specimen described what the product *does* and
ignored what it *feels like* — a game played in a room with friends does not want
to look like a calibration target — and the deliverable stopped at a favicon
when what was needed was a mark plus a wordmark.

**What is dropped:** hairlines, crop marks, registration ticks, the chip-book
visual language, and the Pantone-chip mark. Section 5a's chosen mark is
superseded.

**What survives:** the palette, unchanged. Near-black ground, `#ff9062` primary,
the four answer colours. The argument in revision 02 problem 3 — that the
identity should refer to the CIEDE2000 grading — turned out to be an idea for a
brand book rather than for a logo, and is retired.

**The direction now:** chunky, rounded, tilted, generous radii, no fine detail.
Playful without going childish.

### The logo

A fat rounded **Q**, counter knocked out, tilted 6°, which *is* the capital of
**Quizmo** set in **Baloo 2 ExtraBold** — not a mark placed beside the word. See
the correction in section 5c for why. Details and geometry there too.

### Type, revised again

| Role | Now | Proposed | Why |
|---|---|---|---|
| Display / logo | Plus Jakarta Sans 800 | **Baloo 2 800** | Rounded terminals are the same gesture as the mark's tail, so mark and word read as one object. |
| Body | Be Vietnam Pro | **unchanged** | Still earns its place. |
| Values | (none) | **dropped** | Martian Mono belonged to Specimen. A monospace room code is a spec-sheet idea. |

**This conflicts with revision 02's Archivo proposal, and Archivo loses.** It was
chosen for an industrial, wide, spec-sheet feel that is exactly what got
rejected. The evidence gathered for it in section 5a stands and is now moot.

Both remain proposals. Nothing in the app has changed.

---

## 1. What Quizmo is

**A quiz night that runs on the room, not on a phone.**

One person puts the questions on a television. Everyone else joins from their
own phone with a four-letter code. The host is a role, not an account.

That is the whole product, and it is already what the home screen says:

> Put the questions on the big screen.
> Everyone else plays from their phone.

### What it is not

- **Not a study app.** There are no streaks to maintain, no daily goal, no
  account. You open it when people are in the room.
- **Not a solo time-killer** — though it has four solo games, they are the thing
  you play *while waiting for the fourth person to arrive*.
- **Not a classroom tool.** No rosters, no grades, no teacher dashboard.

### Three things that are actually true of it

1. **Two taps to a game.** Pick "Play solo", pick "Science", you are answering
   a question. Hosting is three: Host → topic → Big screen. This is measured,
   not aspirational.
2. **The answers are checkable.** The Tint game scores your colour against the
   *published* specification — Pantone, RAL, a royal decree — using CIEDE2000,
   not a vibe. When a subject had no verifiable answer it was removed from the
   game. That principle earned its place and it defines the brand: Quizmo would
   rather have fewer questions than unfalsifiable ones.
3. **It is built for a room with the lights down.** The dark ground and the
   oversized type are not a style choice copied from somewhere; they are what
   works on a TV across ten feet of living room.

---

## 2. Voice

**Plain, warm, and slightly formal. Never chirpy.**

The product already talks this way. Real strings, unedited:

| Shipped copy | Why it works |
|---|---|
| "Got a four-letter code?" | A question, answered in four words. No pitch. |
| "Just you and a topic, right now" | States the offer. "Right now" does the selling. |
| "Three lives, rising speed" | Three nouns. You know the whole game. |
| "Big screen, everyone joins by code" | Mechanics as the description. |
| "Hold to see the official colour" | "Official" is the brand in one word. |

### Rules

- **Say the mechanic.** "Three lives, rising speed" beats "Test your knowledge
  under pressure!"
- **Second person, present tense.** "You are thirty seconds away," not "Users
  can join quickly."
- **No exclamation marks in the shell.** They are reserved for in-game
  moments — `"Timer -3s for everyone!"` is correct, a marketing line is not.
- **Numbers over adjectives.** "771 questions" beats "a huge library".
- **Never call the player a user.** They are a player, or a host.
- **British-leaning spelling** (colour, favourite), matching the existing copy.

### Words we use / avoid

| Use | Avoid |
|---|---|
| host, player, room, code | user, participant, session, lobby-code |
| quiz night, the room | gamification, engagement, experience |
| topic, mix | category, playlist |
| official, published, measured | curated, hand-picked, premium |

---

## 3. The visual system

Already implemented. These are the live token values from
`src/app/globals.css`, not a moodboard.

### Ground

| Token | Value | Role |
|---|---|---|
| `--color-background` | `#0e0e0e` | Near-black. Everything sits on this. |
| `--color-foreground` | `#ffffff` | Text. |
| `--color-surface` | `white / 4%` | Glass panels. |
| `--color-on-surface-variant` | `#adaaaa` | Secondary text. |

The ground is near-black, not black: `#0e0e0e` keeps the coloured blooms
readable and stops OLED panels from crushing the panel edges to nothing.

### Brand colour

| Token | Value | Role |
|---|---|---|
| `--color-primary` | `#ff9062` | **The brand colour.** Warm orange. Hosting, primary action, the wordmark glow. |
| `--color-primary-container` | `#ff793e` | Stronger orange, gradient partner. |
| `--color-primary-dim` | `#e8590c` | Deep orange, for glows and blooms. |
| `--color-on-primary` | `#431300` | Text on orange. Never white. |

Orange is the host's colour. It is warm, it reads as *invitation* rather than
alert, and it survives a cheap projector.

### The answer vocabulary — load-bearing, do not restyle

| # | Token | Value | Shape |
|---|---|---|---|
| 1 | `--color-error` | `#ff716c` | Triangle |
| 2 | `--color-answer-blue` | `#43a5fc` | Diamond |
| 3 | `--color-answer-green` | `#66bb6a` | Circle |
| 4 | `--color-answer-yellow` | `#c9a825` | Square |

These four are the closest thing Quizmo has to a mascot. A player looks at the
TV, sees *blue diamond*, and taps the blue diamond on their phone. **Colour and
shape are always paired** — colour alone fails for the ~8% of men with a colour
vision deficiency who are in every room of eight.

Text on these is near-black. White measures 2.30–2.68:1 against them, below
even the 3:1 large-text floor; near-black measures 7.20–8.38:1.

`--color-tertiary` `#e77fff` (purple) is an accent for special rounds. It is
**not** an answer colour.

### Type

- **Display / headline — Plus Jakarta Sans**, extrabold, tight tracking
  (−0.02em). Geometric, slightly friendly, holds up at poster scale. Used at
  3xl–6xl for the wordmark, questions and scores.
- **Body — Be Vietnam Pro**, 400–900. Neutral, wide aperture, legible small.
- Extreme scale contrast is deliberate: the arrival screen is a poster, the
  game screen is a utility.

### Motion

| Token | Curve | Use |
|---|---|---|
| `--ease-spring` | `cubic-bezier(0.34, 1.4, 0.5, 1)` | Interactions. Overshoots — things feel pressed. |
| `--ease-out-soft` | `cubic-bezier(0.16, 1, 0.3, 1)` | Entrances. Arrives and settles. |

Every decorative animation is disabled under `prefers-reduced-motion`. Motion
is a courtesy, never information.

### Surfaces and shape

- **One glass recipe:** `.glass` / `.surface` — white 4%, 16px blur, 1.5px
  white-8% hairline border. Never hand-rolled.
- **Radii:** `lg` controls · `xl` inputs and rows · `2xl` cards · `3xl` hero
  surfaces · `full` pills.
- **No grey shadows.** Depth comes from coloured bloom (`--bloom`), never from
  black. Grey shadows on a near-black ground read as dirt.
- **Atmosphere:** a fixed `aurora` gradient, a `vignette`, and an SVG
  `feTurbulence` `grain` overlay. The grain is what stops the dark ground from
  looking like a switched-off screen.

---

## 4. Identity assets

### The wordmark

Today the wordmark is set type, not a drawn logo: **"Quizmo"** in Plus Jakarta
Sans ExtraBold, tight tracking, white, with the `.neon` treatment — layered
bloom in `--color-primary-dim` that keeps the letterforms crisp while lighting
the air around them.

That is deliberate and it is enough for the product. What is missing is a
**mark** that works where the wordmark cannot: a favicon, an app icon, an
avatar, a 16px tab.

### Proposed mark

> **This section is a proposal, not a description. Nothing below is built yet.**

The brief for a Quizmo mark, in order of priority:

1. **Legible at 16px.** It is a favicon before it is anything else.
2. **Derived from the answer vocabulary.** The four shapes — triangle, diamond,
   circle, square — are already the most recognisable thing in the product. A
   mark that ignores them throws away the only equity Quizmo has.
3. **Reads on the near-black ground** and on a light ground, unmodified.
4. **Not a question mark, not a lightbulb, not a brain, not a speech bubble.**
   Those are the four defaults of every quiz app; picking one makes Quizmo
   invisible in a list of competitors.

Three directions worth generating:

- **A. The four shapes as one glyph.** Triangle, diamond, circle and square
  packed into a square — a 2×2 quadrant. Reads as a mark at 16px, reads as *the
  answer buttons* at any larger size. Warm orange ground, near-black shapes.
- **B. The "Q" as a room.** A geometric Q whose tail is a screen and whose
  counter holds one small shape. Nods to the big-screen premise.
- **C. Four dots, one lit.** Four shapes in a row, one of them orange and the
  rest dim — the moment a correct answer is revealed. The most abstract of the
  three; strongest as a loading or empty-state motif even if it loses as a
  logo.

---

## 5. Asset generation — prompt specs

For the API phase. Each spec is deliberately explicit about the ground, the
palette and what to avoid, because "quiz app logo" produces the same four
clichés every time.

### Shared preamble

Prepend to every prompt:

```
Flat vector, geometric, no gradients except a single warm orange bloom.
Palette strictly: near-black #0e0e0e ground, warm orange #ff9062 primary,
with optional accents #43a5fc blue, #66bb6a green, #c9a825 gold, #ff716c red.
No text, no letters unless specified. No drop shadows. No 3D, no bevel,
no glossy highlight. Centred, generous margin, square canvas.
```

### 5.1 App icon / favicon

```
<preamble>
A single mark for a live quiz app: the four answer shapes — an upward
triangle, a diamond, a circle and a square — arranged as a tight 2x2 grid
inside a rounded square. Shapes in near-black on a warm orange #ff9062
ground. Equal optical weight, generous gutters. Must remain legible reduced
to 16 by 16 pixels.
Avoid: question marks, lightbulbs, brains, speech bubbles, gameshow podiums.
```
Sizes: 16, 32, 128, 192, 384, 512, 1024. Apple touch icon 180.

### 5.2 Player avatars

The app already generates avatars with DiceBear (Adventurer), configured by the
player and encoded as a short string. **Do not replace this** — it is
deterministic, tiny, and it lets a player build their own face rather than pick
from a grid. Any generated set is a *fallback* for players who skip the builder.

If a fallback set is wanted:

```
<preamble>
A simple flat avatar for a quiz player: a single geometric character head,
front-facing, bold shapes, no facial detail beyond eyes and mouth. One accent
colour from the palette per avatar. Circular crop, transparent background.
Consistent line weight and head proportion across the whole set.
```
Generate 12–16 across the accent colours. 256px, transparent PNG.

### 5.3 Topic art

Fourteen topics currently use Lucide line icons on a solid tile, which works
and needs no replacement. If illustrated topic art is wanted:

```
<preamble>
A flat geometric illustration representing <TOPIC>, built from simple shapes.
Single warm-orange #ff9062 focal element against near-black. Sparse: three to
five shapes total, no scene, no perspective, no characters.
Square, 512px, centred with wide margin.
```
Topics: News · General · Geography · Movies & TV · Celebrities · History ·
Science · Maths · Music · Technology · Sports · Food & Drink · Animals &
Nature · Gaming.

### 5.4 Quiz images

**Do not generate these.** Quiz pictures are evidence — a question asking
"which landmark is this?" needs a photograph of the landmark, and a generated
image would make the question unanswerable or wrong. Source real,
correctly-licensed photographs.

Relevant now: **all 30 external quiz images are dead** (Wikimedia moved
thumbnail hosting and dropped arbitrary widths), and `zoom-out-pictures` — all
15 questions — is unplayable as a result. That is a sourcing job, not a
generation job.

### 5.5 Social / OG card

```
<preamble>
A wide 1200x630 social card. Near-black ground with a soft warm orange bloom
top-left and a faint film grain over everything. Lower third empty for text.
The four answer shapes small and evenly spaced along the bottom edge, one of
them orange and the others dim grey.
No text in the image.
```
Wordmark and tagline composited over it in Plus Jakarta Sans ExtraBold, so the
copy stays editable and correctly kerned rather than hallucinated.

---

## 5a. Generation run 01 (2026-09-07)

Seven prompts, two variants each, `gemini-3-pro-image`. All 14 returned. The
executable form of the prompts is `scripts/generate-brand-assets.mjs`; when it
and this file disagree, this file wins. Review sheet:
<https://claude.ai/code/artifact/08250701-a03b-4278-9848-9c2b85d79984>

**Superseded by section 5c.** The mark below was chosen well, for a direction
that was then rejected. The 16px method it established still applies.

**The mark: direction A, the colour chip.** Chosen on the 16px test, which
reversed the expected answer. All three directions were downscaled to 16, 24 and
32px before choosing:

| Direction | 16px | Outcome |
|---|---|---|
| A · colour chip | Holds. Field, band and three swatches stay distinct. | **Adopted.** |
| B · registration mark | Fails. Hairlines reduce to pale grey mush. | Kept for large decorative use only. |
| C · four chips, one measured | Fails. Collapses to one orange dot. | Loading motif, as section 4 predicted. |

B is the best drawing of the three and the worst icon. That is not a judgement
the prompt could have made; it needed the reduction.

**The generated mark is not the shipped mark.** The API returns JPEG with no
format control, and a favicon with JPEG artefacts on its hairlines is not a
favicon. Direction A was redrawn by hand as SVG on a 512 grid, and the PNG
ladder is rasterised from the same geometry constants so the two cannot drift.
Three swatches rather than four: a fourth loses its gutters at 16px and the row
reads as one smear.

**Banners.** Every plate was generated with no lettering, by instruction, and
the wordmark composited afterwards in the real face at the product's -0.02em
tracking. Four cards: dark with bloom (recommended), dark with crop marks,
paper, and a 2100x900 wide hero.

**An unplanned finding on the type proposal.** Revision 02 argued for Archivo
wdth 125 / wght 800 on reasoning alone. Setting the same wordmark at the same
size in both faces settles it: Archivo fills the measure and its Q is a letter
someone could recognise; Plus Jakarta Sans is the blander of the two. The
proposal now has evidence. It is still a proposal — nothing in the app changed.

**Not generated, deliberately:** quiz images (section 5.4 — they are evidence,
and the 30 dead ones are a sourcing job), and player avatars (the DiceBear
builder stays). One Science topic tile was generated to test the direction and
not adopted; the Lucide icons work.

**Where it is.** Session scratchpad only. Nothing written into `public/`, the
favicon untouched, nothing committed.

---

## 5b. Correction to the flow analysis

An earlier note in this session claimed True/False and Fastest Finger had "one
playable quiz each". That counted **native** question types in the data. It is
wrong in effect: `transformQuestions` *synthesises* both from ordinary
questions, so every quiz genuinely qualifies for those modes. The raw type mix
(Standard 594 &middot; Year guesser 78 &middot; Bluff 77 &middot; Zoom out 15
&middot; True/false 4 &middot; Fastest finger 3) describes the stored data, not
what is playable.

The conclusion still holds &mdash; a mandatory game-type screen ahead of the
topics taxed every player &mdash; but for a different reason: it is a
*refinement*, not a prerequisite. Only Zoom Out is genuinely content-limited
(one topic).

## 5c. Generation run 02 — playful (2026-09-07)

Five playful mark directions plus two banner plates, two variants each,
`gemini-3-pro-image`. Review sheet:
<https://claude.ai/code/artifact/25414c4e-5e45-4f43-8a88-078924c481b8>

| Direction | Outcome |
|---|---|
| B · chunky Q | **Won.** Became the drawn mark. |
| A · tumbling answer shapes | Kept, but not as a mark — four overlapping shapes mush at 16px. Right art for an empty state, a loading screen, or a results card header. |
| C · the chip loosened up | No. The clinical chip in a costume. |
| D · burst | No. Reads as a rocket. |
| E · buzzer | No. The gameshow trope the brief set out to avoid. |

**The API gave the idea and could not give the letter.** Direction B's own second
variant came back as a literal magnifying glass, which exposed the failure mode
before any drawing started. The mark took three rounds:

1. Thin ring, long 45° tail → **magnifying glass.** A ring on a stick.
2. Thick ring, small counter, stub tail → **balloon.** The bowl stopped reading
   as a ring.
3. Fat ring, large counter, short tail clearing the bowl's edge → **a Q.** All
   three variables had to move together.

**Nothing goes in the counter.** Every variant with a shape inside it slid back
to the magnifier at 32px. The counter is also knocked out rather than filled, so
the mark drops onto any ground, and it is a rounded square rather than a circle —
which echoes the fourth answer shape without reproducing Kahoot's grid.

Geometry, on a 512 grid: ring r 168; counter 172 square, radius 44; tail at 45°,
width 104, round caps; tilt −6°. The SVG carries these numbers and the PNG ladder
rasterises from the same constants, so the two cannot drift.

### Correction: the mark is the word's capital

Auri's note on the first lockup: the Q mark placed beside "Quizmo" reads as
**"Q Quizmo"** — the letter twice. Correct, and it is the standard trap for any
brand whose mark is its own initial. It does not show up while you are drawing
the mark alone.

**The fix:** the drawn Q *is* the word's capital. The logo is an orange drawn Q
followed by "uizmo". One letter doing both jobs, and the mark now has a reason to
be a Q at all.

**Which forces one rule: there is no mark-plus-Quizmo lockup.** For a square
space, use the mark alone, or the stacked version, which sets the name lowercase
so a drawn Q and a typeset Q never meet.

The alternative fix was to make the mark stop being a letter. Shape clusters were
drawn and lose: three coloured shapes on a diagonal could belong to any app. They
solve the duplication by making the mark say nothing. Kept in
`brand-assets/playful/superseded/` as a real option.

**This also settles the typeface.** Baloo 2 was chosen because its rounded
terminals match the mark's tail. That mattered moderately when the mark sat
beside the word; now that the mark is a letter *in* the word, the drawn Q and the
typeset letters must belong to one alphabet, and only Baloo does. Lilita One is
no longer a viable runner-up.

**The logo ships as outlines, not a webfont reference,** so it renders anywhere
with no font to load and no licence to ship. Source: Baloo 2 instanced at weight
800 (OFL). The mark's ink is 1.04x the letter's height — an optical bump, because
round forms read small beside flat-sided ones.

**One thing to remember:** on an orange ground the Q must be near-black. The
first pass left it orange-on-orange and the letter vanished. Caught by looking at
the rendered banner, not by reading the code. That cut is `logo-mono-black.svg`.

**Banners** were regenerated in the playful direction — chunky shapes scattered
off the top right, left and lower thirds kept clear — and the logo composited
afterwards, never generated. Two of the four came back matted inside a frame the
prompt never asked for; the inner card is detected and cropped programmatically
rather than binned.

**Where it is.** `brand-assets/playful/`, untracked. `public/` untouched, favicon
unchanged, nothing committed.

---

## 5d. Surface kit — icons, patterns, plates (2026-09-07)

Review sheet: <https://claude.ai/code/artifact/3ca15700-25e3-4ef4-8969-917940f55c4f>

**Almost all authored SVG, not generated raster.** Generation earned its place
for the logo direction and the banner plates. For a repeating tile, an icon set
or a plate that needs exact palette colours, it loses to code on every axis that
matters: seamlessness, file size, scaling, colour control, and consistency across
a set.

### Topic icons (14)

`brand-assets/icons/topic-*.svg`. The app uses Lucide line icons today; they are
good icons and wrong for this brand, hairline strokes beside a mark built from
fat rounded forms. These use one stroke weight held as a single constant, which
is the property a hand-drawn set usually loses partway through.

Three were redrawn only after seeing the set together: **maths** was a lopsided
blob and then a clover, **gaming** was a d-pad and therefore the same cross as
maths (now a ghost), **science** had a T-junction that read as a notch. Holes are
knockouts via `fill-rule="evenodd"`, never a second colour — a hardcoded dark eye
vanishes the moment the icon itself is dark.

### An unrelated finding: the topic colours are off-palette

Every topic in `src/lib/topics.ts` carries a `bg`, and **none of those colours
are in the brand palette**: `#ef4444` and `#8b5cf6` and `#a855f7` are Tailwind
defaults, `#26890c` is Kahoot's green. Fourteen off-palette flat colour fields is
a large part of why the app reads as a Kahoot clone. Two systems proposed on the
sheet; the recommendation is **tinted glass** — the accent at 14% over the dark
ground with the icon in the accent, so six palette colours cover fourteen topics
without fourteen flat fields shouting at once.

### Patterns (5)

`brand-assets/patterns/pattern-*.svg`, under 2KB each, seamless by construction:
a shape reaching past a tile edge is drawn again on the opposite edge.

**Colour comes from CSS via `mask-image`, not from the file.** This cost a round.
Built with `currentColor` they all rendered black, because an SVG referenced as
`background-image` is its own document and never sees the page's colour. Masking
uses only the tile's alpha, so one file serves every colour and ground. Recipe in
the folder README.

### Background plates (3)

`brand-assets/backgrounds/bg-*.svg`. Overlays with **no ground of their own**,
which the app requires: `CLAUDE.md` mounts the atmosphere once in `layout.tsx`
and forbids per-page backgrounds.

The trap worth recording: `slice` crops a short wide container to the *vertical
middle*, which is exactly where a room code or a winner's name sits. The clear
zone has to be a central band, not a region near the burst's origin. The first
version reserved the wrong place and a shape landed on the winner's name. The
empty-state plate uses `meet` instead, because slicing cropped the illustration
out entirely.

Generated attempts: one of six usable. Squiggly noodles instead of shapes for the
celebration plate, grey pebbles for the empty state, and four of six matted
inside a frame the prompt never asked for.

---

## 5e. Wired into the app (2026-09-07)

Everything above stopped being a proposal. Baloo 2 is the display face,
`<Logo />` is on the home hero and the host lobby, the app icons and OG images
come from the mark, the fourteen topic icons replace Lucide, and `Topic.bg`
became `Topic.accent` on palette tokens. Rules live in `CLAUDE.md`.

Two things the integration settled that the design work had left open:

**The display face is now load-bearing.** While the mark sat beside the word,
Baloo was a preference. Now that the drawn Q is the word's capital, the two must
belong to one alphabet: changing the display face means redrawing the mark.

**Maskable icons need an opaque ground.** `manifest.json` declares the PWA icons
`any maskable`, and a launcher may crop them to a circle. The mark's counter is
knocked out to transparency, so a transparent maskable icon renders as a
coloured blob on whatever the launcher paints. The PWA and apple-touch icons
therefore sit on an opaque `#0e0e0e` ground inside a safe zone; only the browser
favicon keeps transparency.

The results screen deliberately has no background plate. `Confetti` and
`.spotlight` already treat that moment, and adding one would break the app's own
limit of three elements per section. Patterns are shipped to `public/` but not
yet used anywhere.

---

## 6. How to assess this

The brand is doing its job if:

- [ ] A photograph of the TV mid-game is recognisably Quizmo with no wordmark
      visible. *The four shapes should carry it.*
- [ ] The mark is identifiable in a 16px browser tab beside ten others.
- [ ] A new screen can be built from this file without asking a colour
      question.
- [ ] A stranger reading the home screen can say what the product is in one
      sentence, and that sentence mentions other people.
- [ ] No asset needs the word "premium", "ultimate" or "brain" to explain
      itself.

### Known gaps

| Gap | Status |
|---|---|
| No drawn mark — wordmark is set type only | §4 proposes three directions |
| No favicon that isn't a placeholder | `public/favicon.png` predates this |
| No OG/social card | §5.5 |
| 30 dead quiz images | Sourcing, not branding |
| Name unresolved: repo is `LYSKvizai`, product is `Quizmo` | Product name should win everywhere player-visible; the repo name is historical |
