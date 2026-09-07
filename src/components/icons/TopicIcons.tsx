/**
 * Topic icons.
 *
 * Drawn to the logo's vocabulary: heavy stroke, round joins, two or three
 * elements at most. The app previously used Lucide line icons, which are good
 * icons and wrong beside a mark built from fat rounded forms.
 *
 * Stroke weight is one constant for the whole set (`STROKE`), which is the
 * property a hand-drawn set normally loses partway through. Every icon is a
 * single colour via `currentColor`; holes are knockouts (`fillRule="evenodd"`),
 * never a second colour, because a hardcoded dark hole vanishes the moment the
 * icon itself is dark.
 *
 * GENERATED from `brand-assets/icons/topic-*.svg`, which stay the source of
 * truth. Edit the SVGs and re-run the generator in BRAND.md section 5d rather
 * than editing here.
 */

/** The one stroke weight, on a 64 grid. */
const STROKE = 7;

export interface TopicIconProps {
  className?: string;
}

function Frame({ className, children }: TopicIconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={STROKE}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function NewsIcon(props: TopicIconProps) {
  return (
    <Frame {...props}>
      <rect x="9" y="14" width="46" height="37" rx="8" />
      <line x1="19" y1="27" x2="37" y2="27"/>
      <line x1="19" y1="38" x2="45" y2="38"/>
    </Frame>
  );
}

export function GeneralIcon(props: TopicIconProps) {
  return (
    <Frame {...props}>
      <circle cx="20" cy="22" r="8" fill="currentColor" stroke="none"/>
      <path d="M44 14 L54 32 L34 32 Z" fill="currentColor" stroke="currentColor" />
      <rect x="14" y="38" width="20" height="20" rx="6" fill="currentColor" stroke="none"/>
      <circle cx="46" cy="48" r="9" fill="currentColor" stroke="none"/>
    </Frame>
  );
}

export function GeographyIcon(props: TopicIconProps) {
  return (
    <Frame {...props}>
      <circle cx="32" cy="32" r="21" />
      <line x1="11" y1="32" x2="53" y2="32"/>
      <path d="M32 11 C 20 20, 20 44, 32 53 C 44 44, 44 20, 32 11 Z" />
    </Frame>
  );
}

export function MoviesIcon(props: TopicIconProps) {
  return (
    <Frame {...props}>
      <rect x="8" y="17" width="48" height="32" rx="7" />
      <path d="M28 28 L42 33 L28 38 Z" fill="currentColor" stroke="currentColor" />
    </Frame>
  );
}

export function CelebritiesIcon(props: TopicIconProps) {
  return (
    <Frame {...props}>
      <path d="M32.0,9.0 L37.9,23.9 L53.9,24.9 L41.5,35.1 L45.5,50.6 L32.0,42.0 L18.5,50.6 L22.5,35.1 L10.1,24.9 L26.1,23.9 Z" fill="currentColor" stroke="currentColor" />
    </Frame>
  );
}

export function HistoryIcon(props: TopicIconProps) {
  return (
    <Frame {...props}>
      <path d="M14 32 A 18 18 0 0 1 50 32" />
      <line x1="18" y1="32" x2="18" y2="48"/>
      <line x1="46" y1="32" x2="46" y2="48"/>
      <line x1="10" y1="52" x2="54" y2="52"/>
    </Frame>
  );
}

export function ScienceIcon(props: TopicIconProps) {
  return (
    <Frame {...props}>
      <path d="M26 15 L26 28 L15 47 A 5 5 0 0 0 19 54 L45 54 A 5 5 0 0 0 49 47 L38 28 L38 15"/>
      <line x1="22" y1="11" x2="42" y2="11"/>
      <line x1="26" y1="15" x2="38" y2="15" strokeWidth="0" stroke="none"/>
      <path d="M21 42 L43 42 L47 49 A 5 5 0 0 1 43 54 L21 54 A 5 5 0 0 1 17 49 Z" fill="currentColor" stroke="none"/>
    </Frame>
  );
}

export function MathsIcon(props: TopicIconProps) {
  return (
    <Frame {...props}>
      <rect x="26.5" y="9" width="11" height="27" rx="3" fill="currentColor" stroke="none"/>
      <rect x="18.5" y="17" width="27" height="11" rx="3" fill="currentColor" stroke="none"/>
      <rect x="20" y="45" width="24" height="6" rx="3" fill="currentColor" stroke="none"/>
      <rect x="20" y="55" width="24" height="6" rx="3" fill="currentColor" stroke="none"/>
    </Frame>
  );
}

export function MusicIcon(props: TopicIconProps) {
  return (
    <Frame {...props}>
      <circle cx="22" cy="46" r="10" fill="currentColor" stroke="none"/>
      <line x1="32" y1="44" x2="32" y2="14"/>
      <path d="M32 14 C 42 16, 48 20, 48 28" />
    </Frame>
  );
}

export function TechnologyIcon(props: TopicIconProps) {
  return (
    <Frame {...props}>
      <rect x="17" y="17" width="30" height="30" rx="7" />
      <rect x="27" y="27" width="10" height="10" rx="3" fill="currentColor" stroke="none"/>
      <line x1="32" y1="8" x2="32" y2="17"/>
      <line x1="32" y1="47" x2="32" y2="56"/>
      <line x1="8" y1="32" x2="17" y2="32"/>
      <line x1="47" y1="32" x2="56" y2="32"/>
    </Frame>
  );
}

export function SportsIcon(props: TopicIconProps) {
  return (
    <Frame {...props}>
      <path d="M19 12 L45 12 L45 26 A 13 13 0 0 1 19 26 Z" />
      <path d="M19 17 L12 17 A 7 7 0 0 0 19 24" />
      <path d="M45 17 L52 17 A 7 7 0 0 1 45 24" />
      <line x1="32" y1="39" x2="32" y2="48"/>
      <line x1="20" y1="54" x2="44" y2="54"/>
    </Frame>
  );
}

export function FoodIcon(props: TopicIconProps) {
  return (
    <Frame {...props}>
      <path d="M16 20 L48 20 L44 52 A 4 4 0 0 1 40 55 L24 55 A 4 4 0 0 1 20 52 Z" />
      <line x1="14" y1="20" x2="50" y2="20" strokeWidth="7"/>
      <line x1="38" y1="10" x2="32" y2="20"/>
    </Frame>
  );
}

export function AnimalsIcon(props: TopicIconProps) {
  return (
    <Frame {...props}>
      <circle cx="19" cy="25" r="7" fill="currentColor" stroke="none"/>
      <circle cx="32" cy="19" r="7" fill="currentColor" stroke="none"/>
      <circle cx="45" cy="25" r="7" fill="currentColor" stroke="none"/>
      <path d="M32 34 C 44 34, 50 42, 50 47 C 50 53, 42 55, 32 55 C 22 55, 14 53, 14 47 C 14 42, 20 34, 32 34 Z" fill="currentColor" stroke="currentColor" />
    </Frame>
  );
}

export function GamingIcon(props: TopicIconProps) {
  return (
    <Frame {...props}>
      <path fillRule="evenodd" fill="currentColor" stroke="none" d="M15 27 A 17 17 0 0 1 49 27 L49 52 L42.5 45.5 L36 52 L32 48 L28 52 L21.5 45.5 L15 52 Z M21 26 a 4 4 0 1 0 8 0 a 4 4 0 1 0 -8 0 Z M35 26 a 4 4 0 1 0 8 0 a 4 4 0 1 0 -8 0 Z"/>
    </Frame>
  );
}

export function MoreIcon(props: TopicIconProps) {
  return (
    <Frame {...props}>
      <circle cx="15" cy="32" r="6" fill="currentColor" stroke="none"/>
      <circle cx="32" cy="32" r="6" fill="currentColor" stroke="none"/>
      <circle cx="49" cy="32" r="6" fill="currentColor" stroke="none"/>
    </Frame>
  );
}
