"use client";

import { useState, useCallback, useRef } from "react";
import { Send } from "lucide-react";

const REACTIONS = ["🔥", "😂", "😭", "🎉", "😱", "👏"] as const;

function isSingleEmoji(str: string) {
  return [...str].length <= 2;
}

interface FloatingItem {
  id: number;
  content: string;
  x: number;
}

interface ReactionPickerProps {
  onReact: (emoji: string) => void;
}

export default function ReactionPicker({ onReact }: ReactionPickerProps) {
  const [floats, setFloats] = useState<FloatingItem[]>([]);
  const [text, setText] = useState("");
  const idRef = useRef(0);

  const spawnFloat = useCallback((content: string) => {
    const id = ++idRef.current;
    const x = 15 + Math.random() * 70;
    setFloats((prev) => [...prev, { id, content, x }]);
    setTimeout(() => {
      setFloats((prev) => prev.filter((f) => f.id !== id));
    }, 3000);
  }, []);

  const handleReact = useCallback(
    (emoji: string) => {
      onReact(emoji);
      spawnFloat(emoji);
    },
    [onReact, spawnFloat]
  );

  const handleSubmitText = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onReact(trimmed);
    spawnFloat(trimmed);
    setText("");
  }, [text, onReact, spawnFloat]);

  return (
    <>
      {/* Floating items — fixed overlay above everything */}
      {floats.length > 0 && (
        <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
          {floats.map((f) =>
            isSingleEmoji(f.content) ? (
              <div
                key={f.id}
                className="absolute bottom-0 animate-float-up text-3xl"
                style={{ left: `${f.x}%` }}
              >
                {f.content}
              </div>
            ) : (
              <div
                key={f.id}
                className="absolute bottom-0 animate-float-up"
                style={{ left: `${f.x}%`, transform: "translateX(-50%)" }}
              >
                <div className="max-w-[200px] rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium text-amber-50 backdrop-blur-sm">
                  {f.content}
                </div>
              </div>
            )
          )}
        </div>
      )}

      {/* Emoji buttons */}
      <div className="flex items-center justify-center gap-2">
        {REACTIONS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => handleReact(emoji)}
            className="rounded-xl bg-white/5 px-3 py-2 text-2xl transition-transform hover:scale-110 hover:bg-white/10 active:scale-95"
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Text comment input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmitText();
        }}
        className="flex items-center gap-2"
      >
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Parašyk komentarą..."
          maxLength={60}
          className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-amber-50 placeholder:text-amber-200/30 focus:border-amber-400/40 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-amber-950 transition-colors hover:bg-amber-400 disabled:opacity-30"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </>
  );
}
