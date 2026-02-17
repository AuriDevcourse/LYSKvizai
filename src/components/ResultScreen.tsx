"use client";

interface ResultScreenProps {
  score: number;
  total: number;
  onRestart: () => void;
}

function getMessage(score: number, total: number): { title: string; subtitle: string } {
  const pct = score / total;
  if (pct === 1) return { title: "Tobula! 🔥", subtitle: "Tu tikras žinovas!" };
  if (pct >= 0.9) return { title: "Puikiai! 🎭", subtitle: "Beveik tobula — žinai labai daug!" };
  if (pct >= 0.7) return { title: "Labai gerai! 🥞", subtitle: "Stiprios žinios!" };
  if (pct >= 0.5) return { title: "Neblogai! 🎪", subtitle: "Pagrindus žinai, bet dar yra kur tobulėti." };
  if (pct >= 0.3) return { title: "Galėtų būti geriau 😅", subtitle: "Pabandyk dar kartą!" };
  return { title: "Oi oi... 🥶", subtitle: "Nieko tokio — pabandyk dar kartą!" };
}

export default function ResultScreen({ score, total, onRestart }: ResultScreenProps) {
  const { title, subtitle } = getMessage(score, total);
  const pct = Math.round((score / total) * 100);

  return (
    <div className="animate-fade-in flex w-full flex-col items-center text-center">
      <div className="mb-6 text-6xl font-bold text-amber-400 sm:text-7xl">
        {score}/{total}
      </div>

      <div className="mb-2 h-4 w-full max-w-xs overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all duration-1000"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mb-6 text-sm text-amber-200/60">{pct}% teisingų</p>

      <h2 className="mb-2 text-2xl font-bold text-amber-50 sm:text-3xl">{title}</h2>
      <p className="mb-8 text-amber-200/70">{subtitle}</p>

      <div className="flex w-full max-w-xs flex-col gap-3">
        <button
          onClick={onRestart}
          className="w-full rounded-xl bg-amber-500 px-6 py-3 font-semibold text-amber-950 transition-colors hover:bg-amber-400"
        >
          Bandyti dar kartą
        </button>
      </div>
    </div>
  );
}
