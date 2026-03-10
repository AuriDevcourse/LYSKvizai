"use client";

// Avatar config format: "animal:color:hat:accessory" e.g. "bear:amber:crown:glasses"
// Falls back to rendering as emoji if not in this format

export interface AvatarConfig {
  animal: string;
  color: string;
  hat: string;
  accessory: string;
}

export const ANIMALS = [
  { id: "bear", label: "Meška" },
  { id: "fox", label: "Lapė" },
  { id: "cat", label: "Katė" },
  { id: "rabbit", label: "Zuikis" },
  { id: "owl", label: "Pelėda" },
  { id: "penguin", label: "Pingvinas" },
  { id: "dog", label: "Šuo" },
  { id: "frog", label: "Varlė" },
] as const;

export const COLORS = [
  { id: "red", fill: "#e21b3c", light: "#ff6b81" },
  { id: "blue", fill: "#1368ce", light: "#5b9bff" },
  { id: "green", fill: "#26890c", light: "#5ec740" },
  { id: "yellow", fill: "#d89e00", light: "#ffc733" },
  { id: "purple", fill: "#7b2ff2", light: "#a76bff" },
  { id: "pink", fill: "#e84393", light: "#fd79a8" },
  { id: "orange", fill: "#e17055", light: "#fab1a0" },
  { id: "teal", fill: "#00b894", light: "#55efc4" },
] as const;

export const HATS = [
  { id: "none", label: "—" },
  { id: "crown", label: "Karūna" },
  { id: "tophat", label: "Cilindras" },
  { id: "beanie", label: "Kepurė" },
  { id: "cap", label: "Kepuraitė" },
  { id: "wizard", label: "Burtininko" },
  { id: "party", label: "Vakarėlio" },
] as const;

export const ACCESSORIES = [
  { id: "none", label: "—" },
  { id: "glasses", label: "Akiniai" },
  { id: "sunglasses", label: "Saulės" },
  { id: "bowtie", label: "Peteliškė" },
  { id: "scarf", label: "Šalikas" },
  { id: "star", label: "Žvaigždė" },
] as const;

export function encodeAvatar(config: AvatarConfig): string {
  return `${config.animal}:${config.color}:${config.hat}:${config.accessory}`;
}

export function decodeAvatar(str: string): AvatarConfig | null {
  const parts = str.split(":");
  if (parts.length !== 4) return null;
  return { animal: parts[0], color: parts[1], hat: parts[2], accessory: parts[3] };
}

function getColor(colorId: string) {
  return COLORS.find((c) => c.id === colorId) ?? COLORS[0];
}

interface AvatarProps {
  value: string; // encoded avatar string or emoji
  size?: number;
  className?: string;
}

export default function Avatar({ value, size = 48, className = "" }: AvatarProps) {
  const config = decodeAvatar(value);

  // Fallback: render as emoji text
  if (!config) {
    const fontSize = size * 0.6;
    return (
      <span
        className={`inline-flex items-center justify-center ${className}`}
        style={{ width: size, height: size, fontSize }}
      >
        {value}
      </span>
    );
  }

  const color = getColor(config.color);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      style={{ display: "inline-block" }}
    >
      {/* Background circle */}
      <circle cx="50" cy="50" r="48" fill={color.fill} />

      {/* Animal face */}
      <AnimalFace animal={config.animal} color={color} />

      {/* Hat */}
      <HatLayer hat={config.hat} color={color} />

      {/* Accessory */}
      <AccessoryLayer accessory={config.accessory} />
    </svg>
  );
}

function AnimalFace({ animal, color }: { animal: string; color: { fill: string; light: string } }) {
  const eyeY = 48;
  const eyeL = 38;
  const eyeR = 62;

  // Shared eyes
  const eyes = (
    <>
      <circle cx={eyeL} cy={eyeY} r="5" fill="white" />
      <circle cx={eyeR} cy={eyeY} r="5" fill="white" />
      <circle cx={eyeL + 1.5} cy={eyeY - 1} r="2.5" fill="#1a1a2e" />
      <circle cx={eyeR + 1.5} cy={eyeY - 1} r="2.5" fill="#1a1a2e" />
      {/* Eye shine */}
      <circle cx={eyeL + 2.5} cy={eyeY - 2} r="1" fill="white" />
      <circle cx={eyeR + 2.5} cy={eyeY - 2} r="1" fill="white" />
    </>
  );

  // Shared smile
  const smile = (
    <path d="M 42 60 Q 50 68 58 60" fill="none" stroke="#1a1a2e" strokeWidth="2.5" strokeLinecap="round" />
  );

  switch (animal) {
    case "bear":
      return (
        <g>
          {/* Ears */}
          <circle cx="22" cy="22" r="12" fill={color.light} />
          <circle cx="78" cy="22" r="12" fill={color.light} />
          <circle cx="22" cy="22" r="6" fill={color.fill} opacity="0.5" />
          <circle cx="78" cy="22" r="6" fill={color.fill} opacity="0.5" />
          {/* Snout */}
          <ellipse cx="50" cy="60" rx="14" ry="10" fill={color.light} />
          <ellipse cx="50" cy="57" rx="4" ry="3" fill="#1a1a2e" />
          {eyes}
          {smile}
        </g>
      );
    case "fox":
      return (
        <g>
          {/* Ears - pointy */}
          <polygon points="18,8 10,32 30,28" fill={color.light} />
          <polygon points="82,8 90,32 70,28" fill={color.light} />
          {/* Inner ears */}
          <polygon points="18,14 14,28 26,26" fill="white" opacity="0.5" />
          <polygon points="82,14 86,28 74,26" fill="white" opacity="0.5" />
          {/* Snout - white */}
          <ellipse cx="50" cy="62" rx="16" ry="12" fill="white" opacity="0.9" />
          <ellipse cx="50" cy="57" rx="4" ry="3" fill="#1a1a2e" />
          {eyes}
          {smile}
        </g>
      );
    case "cat":
      return (
        <g>
          {/* Ears - triangular */}
          <polygon points="20,6 8,34 32,26" fill={color.light} />
          <polygon points="80,6 92,34 68,26" fill={color.light} />
          <polygon points="20,12 14,30 28,25" fill="pink" opacity="0.4" />
          <polygon points="80,12 86,30 72,25" fill="pink" opacity="0.4" />
          {/* Whiskers */}
          <line x1="15" y1="55" x2="35" y2="58" stroke="white" strokeWidth="1.5" opacity="0.6" />
          <line x1="15" y1="60" x2="35" y2="60" stroke="white" strokeWidth="1.5" opacity="0.6" />
          <line x1="65" y1="58" x2="85" y2="55" stroke="white" strokeWidth="1.5" opacity="0.6" />
          <line x1="65" y1="60" x2="85" y2="60" stroke="white" strokeWidth="1.5" opacity="0.6" />
          {/* Nose */}
          <polygon points="47,56 53,56 50,60" fill="pink" />
          {eyes}
          {smile}
        </g>
      );
    case "rabbit":
      return (
        <g>
          {/* Long ears */}
          <ellipse cx="34" cy="10" rx="8" ry="22" fill={color.light} />
          <ellipse cx="66" cy="10" rx="8" ry="22" fill={color.light} />
          <ellipse cx="34" cy="10" rx="4" ry="16" fill="pink" opacity="0.3" />
          <ellipse cx="66" cy="10" rx="4" ry="16" fill="pink" opacity="0.3" />
          {/* Snout */}
          <ellipse cx="50" cy="62" rx="12" ry="8" fill={color.light} />
          <ellipse cx="50" cy="57" rx="3.5" ry="2.5" fill="pink" />
          {/* Teeth */}
          <rect x="47" y="62" width="3" height="4" rx="1" fill="white" />
          <rect x="51" y="62" width="3" height="4" rx="1" fill="white" />
          {eyes}
        </g>
      );
    case "owl":
      return (
        <g>
          {/* Ear tufts */}
          <polygon points="24,12 16,30 32,26" fill={color.light} />
          <polygon points="76,12 84,30 68,26" fill={color.light} />
          {/* Big eye circles */}
          <circle cx={eyeL} cy={eyeY} r="12" fill="white" />
          <circle cx={eyeR} cy={eyeY} r="12" fill="white" />
          <circle cx={eyeL} cy={eyeY} r="6" fill="#1a1a2e" />
          <circle cx={eyeR} cy={eyeY} r="6" fill="#1a1a2e" />
          <circle cx={eyeL + 2} cy={eyeY - 2} r="2" fill="white" />
          <circle cx={eyeR + 2} cy={eyeY - 2} r="2" fill="white" />
          {/* Beak */}
          <polygon points="47,58 53,58 50,64" fill="#f0932b" />
        </g>
      );
    case "penguin":
      return (
        <g>
          {/* White belly */}
          <ellipse cx="50" cy="58" rx="22" ry="26" fill="white" opacity="0.9" />
          {/* Beak */}
          <polygon points="45,55 55,55 50,61" fill="#f0932b" />
          {eyes}
        </g>
      );
    case "dog":
      return (
        <g>
          {/* Floppy ears */}
          <ellipse cx="20" cy="38" rx="14" ry="20" fill={color.light} transform="rotate(-15, 20, 38)" />
          <ellipse cx="80" cy="38" rx="14" ry="20" fill={color.light} transform="rotate(15, 80, 38)" />
          {/* Snout */}
          <ellipse cx="50" cy="62" rx="16" ry="12" fill={color.light} />
          <ellipse cx="50" cy="57" rx="5" ry="3.5" fill="#1a1a2e" />
          {/* Tongue */}
          <ellipse cx="53" cy="66" rx="4" ry="5" fill="#ff6b81" />
          {eyes}
        </g>
      );
    case "frog":
      return (
        <g>
          {/* Big bulging eyes */}
          <circle cx="34" cy="30" r="14" fill={color.light} />
          <circle cx="66" cy="30" r="14" fill={color.light} />
          <circle cx="34" cy="30" r="8" fill="white" />
          <circle cx="66" cy="30" r="8" fill="white" />
          <circle cx="35" cy="29" r="4" fill="#1a1a2e" />
          <circle cx="67" cy="29" r="4" fill="#1a1a2e" />
          <circle cx="36" cy="28" r="1.5" fill="white" />
          <circle cx="68" cy="28" r="1.5" fill="white" />
          {/* Wide smile */}
          <path d="M 30 58 Q 50 72 70 58" fill="none" stroke="#1a1a2e" strokeWidth="2.5" strokeLinecap="round" />
        </g>
      );
    default:
      return <>{eyes}{smile}</>;
  }
}

function HatLayer({ hat, color }: { hat: string; color: { fill: string; light: string } }) {
  switch (hat) {
    case "crown":
      return (
        <g>
          <polygon points="28,20 32,6 38,16 44,2 50,16 56,2 62,16 68,6 72,20" fill="#ffd700" />
          <rect x="28" y="18" width="44" height="6" rx="2" fill="#ffd700" />
          <circle cx="38" cy="10" r="2" fill="#e21b3c" />
          <circle cx="50" cy="6" r="2" fill="#1368ce" />
          <circle cx="62" cy="10" r="2" fill="#26890c" />
        </g>
      );
    case "tophat":
      return (
        <g>
          <rect x="32" y="-2" width="36" height="26" rx="4" fill="#1a1a2e" />
          <rect x="24" y="20" width="52" height="6" rx="3" fill="#1a1a2e" />
          <rect x="32" y="18" width="36" height="3" fill="#e21b3c" />
        </g>
      );
    case "beanie":
      return (
        <g>
          <ellipse cx="50" cy="20" rx="28" ry="16" fill="#e21b3c" />
          <rect x="22" y="18" width="56" height="10" rx="5" fill="white" opacity="0.3" />
          <circle cx="50" cy="4" r="5" fill="#e21b3c" />
        </g>
      );
    case "cap":
      return (
        <g>
          <ellipse cx="50" cy="22" rx="26" ry="12" fill={color.light} />
          <ellipse cx="72" cy="24" rx="18" ry="6" fill={color.light} />
        </g>
      );
    case "wizard":
      return (
        <g>
          <polygon points="50,-10 28,24 72,24" fill="#7b2ff2" />
          <rect x="26" y="20" width="48" height="6" rx="3" fill="#7b2ff2" />
          <circle cx="50" cy="0" r="4" fill="#ffd700" />
          <circle cx="42" cy="14" r="2" fill="#ffd700" opacity="0.7" />
          <circle cx="56" cy="10" r="1.5" fill="#ffd700" opacity="0.5" />
        </g>
      );
    case "party":
      return (
        <g>
          <polygon points="50,-4 34,24 66,24" fill="#ff6348" />
          <circle cx="50" cy="-4" r="4" fill="#ffd700" />
          <circle cx="44" cy="12" r="2" fill="#1368ce" />
          <circle cx="54" cy="8" r="2" fill="#26890c" />
          <circle cx="48" cy="18" r="1.5" fill="#ffd700" />
          <rect x="32" y="22" width="36" height="4" rx="2" fill="#ff6348" />
        </g>
      );
    default:
      return null;
  }
}

function AccessoryLayer({ accessory }: { accessory: string }) {
  switch (accessory) {
    case "glasses":
      return (
        <g>
          <rect x="28" y="43" width="16" height="12" rx="3" fill="none" stroke="#1a1a2e" strokeWidth="2.5" />
          <rect x="56" y="43" width="16" height="12" rx="3" fill="none" stroke="#1a1a2e" strokeWidth="2.5" />
          <line x1="44" y1="48" x2="56" y2="48" stroke="#1a1a2e" strokeWidth="2.5" />
          <line x1="28" y1="48" x2="20" y2="46" stroke="#1a1a2e" strokeWidth="2" />
          <line x1="72" y1="48" x2="80" y2="46" stroke="#1a1a2e" strokeWidth="2" />
        </g>
      );
    case "sunglasses":
      return (
        <g>
          <rect x="26" y="42" width="18" height="13" rx="4" fill="#1a1a2e" />
          <rect x="56" y="42" width="18" height="13" rx="4" fill="#1a1a2e" />
          <line x1="44" y1="48" x2="56" y2="48" stroke="#1a1a2e" strokeWidth="3" />
          <line x1="26" y1="47" x2="16" y2="44" stroke="#1a1a2e" strokeWidth="2.5" />
          <line x1="74" y1="47" x2="84" y2="44" stroke="#1a1a2e" strokeWidth="2.5" />
          {/* Lens shine */}
          <line x1="30" y1="45" x2="34" y2="45" stroke="white" strokeWidth="1.5" opacity="0.4" strokeLinecap="round" />
          <line x1="60" y1="45" x2="64" y2="45" stroke="white" strokeWidth="1.5" opacity="0.4" strokeLinecap="round" />
        </g>
      );
    case "bowtie":
      return (
        <g>
          <polygon points="38,76 50,72 50,80" fill="#e21b3c" />
          <polygon points="62,76 50,72 50,80" fill="#e21b3c" />
          <circle cx="50" cy="76" r="3" fill="#c0392b" />
        </g>
      );
    case "scarf":
      return (
        <g>
          <path d="M 20,72 Q 50,82 80,72 Q 80,80 50,86 Q 20,80 20,72" fill="#e21b3c" />
          <path d="M 54,82 L 58,94 L 48,94 L 52,82" fill="#e21b3c" />
          <line x1="20" y1="74" x2="80" y2="74" stroke="#c0392b" strokeWidth="1" opacity="0.5" />
        </g>
      );
    case "star":
      return (
        <g>
          <polygon
            points="82,32 85,38 92,38 86,42 88,48 82,44 76,48 78,42 72,38 79,38"
            fill="#ffd700"
          />
        </g>
      );
    default:
      return null;
  }
}
