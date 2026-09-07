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
mark proposal is superseded by the directions above.

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
