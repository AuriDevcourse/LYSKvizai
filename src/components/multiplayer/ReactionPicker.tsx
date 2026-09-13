"use client";

import { useState, useCallback } from "react";
import { Send } from "lucide-react";

const REACTIONS = ["🔥", "😂", "😭", "🎉", "😱", "👏"] as const;

interface ReactionPickerProps {
  onReact: (emoji: string) => void;
}

/**
 * The input half of reactions only. Rendering is `EmojiReactions`, fed by the
 * server broadcast.
 *
 * This component used to spawn its own floating copy the moment you tapped, on
 * top of sending. The server echoes every reaction back to the whole room, the
 * sender included, so the sender alone saw two of everything: two emoji, two
 * comment bubbles, in two slightly different sizes. One render path costs a
 * round trip of latency and is worth it: what you send is now what the room
 * sees, and a reaction that never reached the server no longer looks like it did.
 */
export default function ReactionPicker({ onReact }: ReactionPickerProps) {
  const [text, setText] = useState("");

  const handleSubmitText = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onReact(trimmed);
    setText("");
  }, [text, onReact]);

  return (
    <div className="mx-auto w-full max-w-sm">
      {/* Emoji buttons */}
      <div className="flex items-center justify-center gap-2 py-1 sm:gap-3">
        {REACTIONS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => onReact(emoji)}
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white/5 text-xl transition-transform hover:scale-110 hover:bg-white/10 active:scale-95 sm:h-11 sm:w-11 sm:text-2xl"
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
        className="mt-3 flex items-center gap-2"
      >
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Comment..."
          maxLength={40}
          className="min-w-0 flex-1 rounded-xl border border-white/8 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/45 focus:border-white/10 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="tap-target flex-shrink-0 rounded-xl bg-primary text-black transition-colors hover:bg-primary-container disabled:opacity-30"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
