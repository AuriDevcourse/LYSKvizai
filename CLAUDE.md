# Quizmo — Project Guidelines

## Design Philosophy: Electric Glass
A high-end digital lounge aesthetic — vibrant, translucent, and energetic. Glass panels float over dark backgrounds with orange energy accents.

### UI/UX Rules (STRICT)
1. **Minimal text** — if it can be understood without words, remove the words
2. **Dark & vibrant** — dark backgrounds (#0e0e0e) with orange/blue/purple accents
3. **Glass surfaces** — use `glass` class (white/4% bg, blur-16, ghost borders)
4. **Self-explanatory** — every screen should be usable without instructions
5. **Maximum 3 elements** per screen section — strip everything else
6. **No solid borders** — use ghost borders (1.5px, white/8-10% opacity)
7. **No grey shadows** — use colored ambient glow (orange at 15-30% opacity)

### Color Palette
- Background: `#0e0e0e` (near-black)
- Primary: `#ff9062` (warm orange accent)
- Primary Container: `#ff793e` (stronger orange)
- Primary Dim: `#e8590c` (deep orange, for glows)
- Secondary: `#43a5fc` (blue)
- Tertiary: `#e77fff` (purple)
- Error: `#ff716c` (red)

### Answer colours (single source of truth: `src/lib/answer-options.ts`)
The four answer options, in display order. Do NOT re-spell these in components —
import `ANSWER_BG` / `ANSWER_COLORS` / `ANSWER_ICONS` / `ANSWER_TEXT`.

| # | Colour | Shape | Text on it |
|---|---|---|---|
| 1 | `#ff716c` red | Triangle | `ANSWER_TEXT` (near-black) |
| 2 | `#43a5fc` blue | Diamond | `ANSWER_TEXT` |
| 3 | `#66bb6a` green | Circle | `ANSWER_TEXT` |
| 4 | `#c9a825` gold | Square | `ANSWER_TEXT` |

**Text on these is near-black, never white.** White measures 2.30-2.68:1 against
them — below even the 3:1 large-text floor. Near-black measures 7.20-8.38:1.
Purple `#e77fff` is a brand accent, not an answer colour.
- Surface: white at 4% opacity (glass base)
- Surface Hover: white at 8% opacity
- On-surface-variant: `#adaaaa` (secondary text)
- Ghost border: `rgba(255,255,255,0.08)` at 1.5px

### Typography
- **Headlines:** Baloo 2 — extrabold, tight tracking (-0.02em)
- **Body:** Be Vietnam Pro — regular/medium weight
- Use extreme scale contrast for editorial poster-like feel

### Animation Standards
- Page enter: `animate-fade-in-up`
- Lists: `stagger-children` on parent
- Success states: `animate-bounce-in`
- Score reveals: `animate-count-up`
- Glass cards: `transition-all 0.3s cubic-bezier(0.4, 0, 0.2, 1)`
- Answer buttons: `cubic-bezier(0.34, 1.56, 0.64, 1)` for spring hover

### Button Classes
- `btn-primary`: Orange gradient pill, black text, glow shadow
- `btn-secondary`: Transparent, ghost border pill, white text
- `glass`: Standard surface (4% white, blur-16, ghost border)
- `glass-active`: Selected state with orange glow border

### What to Flag
- Text that can be removed without losing clarity
- Any solid opaque borders (use ghost borders instead)
- Any `#000000` used for shadows (kills vibrancy)
- Any reference to old orange background (`#e8590c` as bg)
- Missing animations on state transitions
- Screens with more than 5 visible elements

## Visual primitives (added in the 2026-09-06 redesign)

Use these instead of hand-rolling. They exist so surfaces stay consistent.

| Class | What it is |
|---|---|
| `.aurora` `.vignette` `.grain` | The atmosphere. Mounted once in `layout.tsx`, fixed and `pointer-events:none`. Don't add per-page backgrounds. |
| `.surface` | The premium glass panel: gradient hairline border + inner specular highlight + depth shadow. Prefer over `.glass` for anything card-sized. |
| `.surface-hover` | Adds lift + a coloured bloom. Set the colour per element with `--bloom`. |
| `.neon` | The wordmark treatment. Layered bloom, keeps letterforms crisp. |
| `.chip` | Accent pill with its own glow. Set `--chip` to the accent colour. |
| `.rise` | Orchestrated entrance — direct children stagger in. One per screen. |
| `.answer-btn` | Answer chips: lit top edge, grounded bottom, specular sweep on hover. |
| `.code-tile` | Room-code tiles. Flip in on a stagger. |
| `.podium-1` / `.spotlight` | Winner plinth and its light cone. |
| `.tap-target` | 44px minimum hit area. **Sets size only** — never add `position` to it; it is applied to elements that also carry Tailwind `fixed`/`absolute`. |

### Colour and radius

Colours come from the `@theme` tokens in `globals.css` — use `bg-primary`,
`text-error`, `bg-answer-green` and so on, **not** `bg-[#ff9062]`. 256 arbitrary
hex utilities were converted to tokens on 2026-09-07; the literals that remain
are *data* (flag specs, avatar palettes), where a hex is a fact rather than a
design choice, and those should stay literal.

**Quiz themes were on that list and should not have been.** A flag's colour is a
fact about the flag; a quiz tile's colour is a design choice, and 47 of them were
arbitrary Tailwind and Kahoot hexes quietly overriding the brand on every picker.
`quiz-theme.ts` now derives each quiz's accent from its topic, so there is no
second list to fall out of step with `topics.ts`. **`src/` contains zero
arbitrary colour hexes. Keep it that way.**

Corner radii use four steps plus `full`, documented at the top of the `.glass`
block in `globals.css`: `lg` small controls · `xl` inputs and rows (the
default) · `2xl` cards · `3xl` hero surfaces · `full` pills. `rounded-md`/`sm`
are deliberately unused.

Glass has one recipe: `.glass` (or `.surface` for anything card-sized). Don't
hand-roll `bg-white/4 + backdrop-blur + border-white/8` — that combination *is*
`.glass`, and two copies of it drifted apart on the home screen.

Easing tokens: `--ease-spring` (overshoot, for interactions), `--ease-out-soft`
(entrances). Every decorative animation must be disabled under
`prefers-reduced-motion` — there is a block at the end of `globals.css`.

Fonts: use `.font-headline` / `.font-body`. **Never** `font-[var(--font-headline)]`
— Tailwind reads a bare `font-[…]` as the *weight* utility, which silently
dropped the display face from the entire app for months.

## Brand: the logo, the mark, and the topic icons

Added 2026-09-07. `BRAND.md` holds the reasoning; these are the rules.

### Never place the mark beside the word "Quizmo"

The drawn Q **is** the capital of the word. `<Logo />` renders the mark followed
by "uizmo". A mark sitting next to the full word puts the letter on screen twice
and reads "Q Quizmo".

- `<Logo />` — the full logo. Sized in `em`, so set a `text-*` size on the parent.
- `<Mark />` — the mark alone. Use this for square spaces, avatars, anywhere an
  icon is wanted. There is **no** mark-plus-full-word lockup.
- Wrap the logo in `.logo-glow`, not `.neon`. `.neon` is `text-shadow` and does
  nothing to the SVG half, so the Q would sit flat beside a glowing word.
- On an orange ground the Q must be near-black. Orange on orange is invisible.

The display face is **Baloo 2** because the drawn Q and the typeset letters have
to belong to one alphabet. Changing the display face means redrawing the mark.

### Topic icons

`src/components/icons/TopicIcons.tsx`, generated from
`brand-assets/icons/topic-*.svg`, which stay the source of truth. Edit the SVG
and regenerate; do not hand-edit the module. One stroke weight (`STROKE`) for the
whole set. Every icon is a single colour via `currentColor`, and holes are
knockouts (`fillRule="evenodd"`) — never a second colour, which vanishes when the
icon itself is dark.

**Do not put `text-white` on a topic icon.** `Topic.accent` carries both the
tinted ground and the accent text colour, and the icon inherits the accent
through `currentColor`.

### Topic colours

`Topic.accent` replaced `Topic.bg`. The old field held fourteen arbitrary hexes
(Tailwind defaults plus one of Kahoot's greens), none of them in the palette. The
accent is now one of six palette tokens at 15% over the dark ground. **Never add
an off-palette hex here.**

### Patterns and background plates

`public/pattern-*.svg` and `public/bg-*.svg`.

- Patterns take their colour from CSS via `mask-image` plus `background-color`.
  `background-image` will render them black: an SVG referenced that way is its own
  document and never sees `currentColor`.
- Plates are overlays with **no ground of their own**, so the global `.aurora`
  still shows through. They do not override the rule against per-page
  backgrounds; they sit inside a component, `pointer-events-none`, behind
  content.
- The results screen deliberately has no plate. `Confetti` and `.spotlight`
  already treat that moment.

### Lit colour variants

`--color-primary-lit`, `--color-secondary-lit`, `--color-answer-green-lit`: a
palette colour raised for use *on* the dark ground, as small bold text or the top
stop of a gradient. Measured against `#0e0e0e` they reach 10-12:1 where the base
tokens reach 8-9:1. Use the base token for fills, the lit one for text on dark.
They shipped as six loose hexes with nothing naming them as a set.

### Headings

Every `<h1>`/`<h2>` carries `.font-headline`. 24 of them did not and were
rendering in the body face; there are now none, so a heading without it is a bug.
Uppercase micro-labels are the exception and stay in the body face.

### The shape field, and where patterns go

`.shapes` is the fourth atmosphere layer, mounted once in `layout.tsx` beside
`.aurora`, `.vignette` and `.grain`. It puts the brand's shapes on every screen.
Do not add a per-page copy of it.

**It is 0.06 with a top-to-bottom fade, and both halves matter.** A flat value
has to be tuned for its worst case — body text behind a glass panel low on a long
page — which forces it down to nothing everywhere. At 0.055 flat it was
invisible; at 0.16 flat it read straight *through* the 4%-white panels on the
editor and library and text sat on noise.

The fade removes that compromise: the top of the viewport, where a wordmark or a
room code sits, carries visible shape, and the reading area below is clear. Built
as two intersected mask layers, the tile and a `linear-gradient(to bottom, #000,
transparent 78%)`, with `mask-composite: intersect` (plus the `-webkit-`
`source-in` fallback). The drift animation moves **only the first layer** — give
`mask-position` two values or the fade slides off the screen.

The layer is `fixed`, so the fade follows the viewport rather than the document:
the top of the screen always carries shape, at any scroll position. If you change
any of this, check a text-dense page, not just the home screen.

Strength lives on the poster screens instead, which have no dense text over
them: the lobby plate, the results plate, and `.podium-1`. `.podium-1` is the
only *panel* carrying a pattern — a pattern everywhere is texture, on one
surface it is hierarchy, and first place gets something second and third do not.

### Plate contrast

A plate's shapes must clear the ground by more than a couple of percent. The
lobby plate shipped in `#241f1d` on `#0e0e0e` and was invisible once the
vignette dimmed the edges; it is `#4a4340` now. If a plate looks like nothing,
this is why.

### Faded illustrations: opacity on the group, not the paint

`fill-white/10 stroke-white/10` on a shape drawn as fill-plus-thick-stroke (which
is how every rounded triangle here is drawn) composites two 10% layers where they
overlap, so a seam appears around the edge. Use solid paint inside a
`<g opacity>` instead. `BrandArt.tsx` and the generated plates both do.

### Empty states

`<EmptyPile />` from `@/components/BrandArt`, not a bare grey paragraph. Inlined
rather than `<img src="/bg-empty.svg">` so the fills come from palette tokens, it
costs no request, and it does not spend one of the 16 allowed lint warnings on
`no-img-element`.

### Never put white text on an answer colour

`ANSWER_TEXT` (near-black) is not optional. White measures 2.30-2.68:1 against
the four answer colours; near-black measures 7.20-8.38:1. `QuizCard` imported
`ANSWER_BG` and `ANSWER_ICONS` without `ANSWER_TEXT` and shipped white text for
months while the multiplayer screens were correct, so import all three or none.
This applies to the feedback banners too, which use the same colours.

### The card's verdict and the page's score must come from one value

Solo scoring works by the card calling `onSelect(question.correct)` when the
answer is right. If the card computes "correct" one way for display and another
way for that call, the two disagree silently — the year-guesser showed a
partial-credit banner and scored nothing for a year. Report the same value you
render.

### Filter before you slice

`transformQuestions` removes questions that cannot become the requested type.
Applying `?count=` before it means the filter eats into the slice and the player
gets fewer questions than asked. Transform, then slice.

### Do not gate a reveal on a timer racing another timer

Background tabs throttle timers, and they do not throttle evenly: a twenty-tick
`setInterval` falls behind a single `setTimeout`. `ResultScreen` showed the final
percentage beside a score still counting up because of it. Gate on the state the
other animation produces (`displayScore === score`), not on elapsed time.

### Topic accents are one object, not a class string

`Topic.accent` carries `classes` (literal Tailwind utilities, because Tailwind
cannot build a class name from a runtime string) and `css` (the raw colour, for
`--bloom`, gradients, rings and `color-mix`). Both come from the `ACCENTS` table
in `topics.ts`. Add a colour there, never inline at a call site.

### `.chip` supplies colour, not shape

It sets border, background, colour and glow, and no padding or radius. The caller
adds `rounded-full px-* py-*`. Without them a chip renders as a boxy block.

### Checking a focus ring needs a real keypress

`:focus-visible` does not match on a programmatic `element.focus()`, so a ring
verified that way reads as absent when it is fine. Press Tab.

### Code entry mirrors code display

The join form types into `.code-tile` boxes because `RoomCodeDisplay` shows the
host's code in the same boxes. Keep them looking alike.

It is **one real input** positioned over presentational tiles, not four inputs.
Four inputs break paste, autofill, mobile keyboards and screen-reader flow. The
input is `text-transparent caret-transparent`, not `opacity-0`, so the browser
still scrolls to it and anchors autofill.

### Do not parse a room code out of prose

Stripping non-alphanumerics from "code: ab12" gives "CODEAB12", whose first four
characters are "CODE". Only the share link (`?code=XXXX`) is unambiguous enough
to special-case.

### Collapse the avatar builder, do not unmount it

`AvatarBuilder` emits a randomised avatar on mount, and the join form's submit is
blocked until an avatar exists. Unmounting it strands the player on a dead
button. Use its `collapsed` prop.

## Mobile is the main device

Every interactive element needs a 44px minimum on both axes. Audited at 390x844
across all ten routes; these were the failures, and they are the shapes to watch
for:

- **A styled `input[type=range]` sizes its own hit area.** `.year-slider` set
  `height: 12px` on the input and painted a 32px thumb, so the draggable area
  was 12px on the screens whose whole job is dragging it. The input is now 44px
  and the thin track is drawn by `::-webkit-slider-runnable-track` /
  `::-moz-range-track`, with the thumb pulled back by `margin-top: -10px` to
  centre on it.
- **`px-3 py-2` on a small-text button lands around 32px.** Use `min-h-11`.
- **Text links used as navigation** ("Home", "Back to home") measured 20px. They
  take `.tap-target` plus horizontal padding.
- **An icon-only link with no `aria-label` has no accessible name.** Survival's
  close button announced only "link".

### Leave room for the bottom nav

`BottomNav` is `fixed` and mobile-only, about 71px tall with its margin. Two
things follow, and the first is not enough on its own:

1. `layout.tsx` wraps children in `pb-24 sm:pb-0`. This only helps pages whose
   height is driven by content.
2. A page whose root is `min-h-svh` also needs its own `pb-24 sm:pb-0`, because
   the wrapper's padding sits *below* a box that is already a full viewport tall,
   so bottom content still lands under the nav. `/editor` and `/tint` needed
   this.

The floating feedback button sits at `bottom-24` on mobile for the same reason;
at `bottom-5` it was on top of the nav on every screen.

### Auditing this yourself

Framing is `SAMEORIGIN`, so a 390px iframe of the app is a real mobile layout
viewport and media queries resolve against it. Measure with `getComputedStyle`,
not `getBoundingClientRect`: a transform anywhere in the ancestry skews the rect
and reports a compliant 44px control as 42px. And test "is it under the nav?"
*after* scrolling to the bottom, or every long page reports false positives.

## Tech Stack
- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS 4
- SSE for real-time multiplayer
- In-memory room store

## Key Commands
```bash
npm run dev    # Dev server
npm run build  # Production build (MUST pass before deploy)
npm run lint   # ESLint
```

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
