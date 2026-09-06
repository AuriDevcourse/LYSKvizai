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
- **Headlines:** Plus Jakarta Sans — extrabold, tight tracking (-0.02em)
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

Easing tokens: `--ease-spring` (overshoot, for interactions), `--ease-out-soft`
(entrances). Every decorative animation must be disabled under
`prefers-reduced-motion` — there is a block at the end of `globals.css`.

Fonts: use `.font-headline` / `.font-body`. **Never** `font-[var(--font-headline)]`
— Tailwind reads a bare `font-[…]` as the *weight* utility, which silently
dropped Plus Jakarta Sans from the entire app for months.

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
