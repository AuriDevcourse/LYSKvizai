const TEAM_COLORS = [
  "bg-blue-500/20 text-blue-300 border-blue-400/30",
  "bg-red-500/20 text-red-300 border-red-400/30",
  "bg-emerald-500/20 text-emerald-300 border-emerald-400/30",
  "bg-purple-500/20 text-purple-300 border-purple-400/30",
];

interface TeamBadgeProps {
  teamIndex: number;
  teamName: string;
  size?: "sm" | "md";
}

export default function TeamBadge({ teamIndex, teamName, size = "sm" }: TeamBadgeProps) {
  const color = TEAM_COLORS[teamIndex % TEAM_COLORS.length];
  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm";

  return (
    <span className={`inline-flex items-center rounded-full border font-medium ${color} ${sizeClasses}`}>
      {teamName}
    </span>
  );
}
