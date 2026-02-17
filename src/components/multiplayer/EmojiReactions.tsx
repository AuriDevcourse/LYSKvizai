"use client";

import type { EmojiReactionWithId } from "@/hooks/useRoom";

function isSingleEmoji(str: string) {
  return [...str].length <= 2;
}

interface EmojiReactionsProps {
  reactions: EmojiReactionWithId[];
}

export default function EmojiReactions({ reactions }: EmojiReactionsProps) {
  if (reactions.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {reactions.map((r) => (
        <FloatingItem key={r.id} content={r.emoji} />
      ))}
    </div>
  );
}

function FloatingItem({ content }: { content: string }) {
  const left = Math.random() * 80 + 10;

  if (isSingleEmoji(content)) {
    return (
      <div
        className="absolute bottom-0 animate-float-up text-4xl"
        style={{ left: `${left}%` }}
      >
        {content}
      </div>
    );
  }

  return (
    <div
      className="absolute bottom-0 animate-float-up"
      style={{ left: `${left}%`, transform: "translateX(-50%)" }}
    >
      <div className="max-w-[280px] rounded-full bg-white/15 px-4 py-2 backdrop-blur-sm">
        <span className="truncate text-sm font-medium text-amber-50">{content}</span>
      </div>
    </div>
  );
}
