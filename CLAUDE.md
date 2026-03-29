# Quizmo — Project Guidelines

## Design Philosophy
This is a distinctive quiz platform with its own vibrant orange identity. Every change MUST follow these principles:

### UI/UX Rules (STRICT)
1. **Minimal text** — if it can be understood without words, remove the words
2. **Bold and vibrant** — use the Kahoot color palette, never subtle/muted
3. **No AI aesthetic** — no emoji decorations, no gradient blobs, no generic descriptions
4. **Self-explanatory** — every screen should be usable without instructions
5. **Maximum 3 elements** per screen section — strip everything else
6. **Typography** — always `font-extrabold` for headings, `font-bold` for body emphasis

### Color Palette
- Background: `#e8590c` (vibrant orange)
- Text: white
- Answer Red: `#e21b3c`
- Answer Blue: `#1368ce`
- Answer Green: `#26890c`
- Answer Yellow: `#d89e00`
- Surface: `glass` class (white/8 with blur)
- Buttons: `btn-primary` (white bg, orange text) or `btn-secondary` (glass with border)

### Animation Standards
- Page enter: `animate-fade-in-up`
- Lists: `stagger-children` on parent
- Success states: `animate-bounce-in`
- Score reveals: `animate-count-up`
- Buttons: `answer-btn` class for hover/active effects

### What to Flag
When reviewing code, flag these issues:
- Text that can be removed without losing clarity
- Emojis used as design elements (except quiz content emojis)
- Subtle/muted colors (anything with opacity < 0.3 on important elements)
- Missing animations on state transitions
- Screens with more than 5 visible elements
- Any reference to the old purple/#46178f theme

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
