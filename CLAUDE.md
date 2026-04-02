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
- Answer Blue: `#43a5fc`
- Answer Green: `#b2ff59`
- Answer Yellow: `#ffff00`
- Answer Purple: `#e77fff`
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
