interface RoomCodeDisplayProps {
  code: string;
}

export default function RoomCodeDisplay({ code }: RoomCodeDisplayProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-sm uppercase tracking-wider text-amber-200/50">
        Kambario kodas
      </span>
      <div className="flex gap-2">
        {code.split("").map((char, i) => (
          <span
            key={i}
            className="flex h-14 w-14 items-center justify-center rounded-xl border-2 border-amber-400/30 bg-amber-400/10 text-3xl font-bold text-amber-50"
          >
            {char}
          </span>
        ))}
      </div>
    </div>
  );
}
