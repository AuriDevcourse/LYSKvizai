"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { MessageSquare, X, Loader2, Check, AlertTriangle } from "lucide-react";

type SendState = "idle" | "sending" | "sent" | "error";

export default function FeedbackButton() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [from, setFrom] = useState("");
  const [send, setSend] = useState<SendState>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Hide on an active game page (e.g. /play/ABCD) so the button doesn't
  // distract mid-countdown. Lobby/create flows at /play keep the button.
  const isActiveGame = /^\/play\/[^/]+/.test(pathname || "");
  const hidden = isActiveGame;

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const submit = useCallback(async () => {
    const trimmed = message.trim();
    if (!trimmed || send === "sending") return;
    setSend("sending");
    setErrorMsg(null);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          from: from.trim() || undefined,
          pageUrl: typeof window !== "undefined" ? window.location.href : undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErrorMsg(data?.error ?? "Failed to send");
        setSend("error");
        return;
      }
      setSend("sent");
      setMessage("");
      setFrom("");
      setTimeout(() => {
        setOpen(false);
        setSend("idle");
      }, 1600);
    } catch {
      setErrorMsg("Network error");
      setSend("error");
    }
  }, [message, from, send]);

  if (hidden) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Send feedback"
        onClick={() => setOpen(true)}
        className="glass fixed bottom-5 right-5 z-40 flex h-12 w-12 items-center justify-center rounded-full text-white/80 shadow-lg hover:text-white sm:bottom-6 sm:right-6"
      >
        <MessageSquare className="h-5 w-5" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 px-4 pb-4 backdrop-blur-sm sm:items-center sm:p-6"
          onClick={() => setOpen(false)}
        >
          <div
            className="glass w-full max-w-md rounded-2xl p-5 animate-fade-in-up sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-[var(--font-headline)] text-xl font-extrabold tracking-tight text-white">
                Send feedback
              </h2>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <label className="mb-3 block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-white/50">
                What&apos;s on your mind?
              </span>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, 2000))}
                placeholder="Bug, idea, anything…"
                rows={5}
                className="w-full resize-none rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white placeholder-white/30 outline-none focus:border-white/25"
                disabled={send === "sending" || send === "sent"}
              />
              <span className="mt-1 block text-right text-[10px] text-white/30">
                {message.length}/2000
              </span>
            </label>

            <label className="mb-4 block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-white/50">
                Name or email <span className="text-white/30">(optional)</span>
              </span>
              <input
                type="text"
                value={from}
                onChange={(e) => setFrom(e.target.value.slice(0, 200))}
                placeholder="So I can reply"
                className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white placeholder-white/30 outline-none focus:border-white/25"
                disabled={send === "sending" || send === "sent"}
              />
            </label>

            {errorMsg && send === "error" && (
              <div className="mb-3 flex items-center gap-2 rounded-lg bg-[#ff716c]/15 px-3 py-2 text-xs text-[#ff716c]">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="button"
              onClick={submit}
              disabled={!message.trim() || send === "sending" || send === "sent"}
              className="btn-primary flex w-full items-center justify-center gap-2 !py-3 !text-base disabled:cursor-not-allowed disabled:opacity-40"
            >
              {send === "sending" && <Loader2 className="h-4 w-4 animate-spin" />}
              {send === "sent" && <Check className="h-4 w-4" />}
              {send === "sending"
                ? "Sending…"
                : send === "sent"
                ? "Sent, thanks!"
                : "Send"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
