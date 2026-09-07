"use client";

import { useState } from "react";
import { KeyRound } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { setEditorSecret } from "@/lib/editor-auth";

/**
 * Password prompt for editor writes.
 *
 * Creating, editing and deleting quizzes — and uploading media into the public
 * web root — used to be open to anyone who found the URL. The server now
 * requires a shared secret; this collects it once per tab.
 */
interface EditorUnlockProps {
  open: boolean;
  /** Message from the server, e.g. "Wrong editor password". */
  reason?: string;
  onUnlocked: () => void;
  onCancel: () => void;
}

export default function EditorUnlock({ open, reason, onUnlocked, onCancel }: EditorUnlockProps) {
  const [value, setValue] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;
    setEditorSecret(value.trim());
    setValue("");
    onUnlocked();
  };

  return (
    <Modal open={open} onClose={onCancel} title="Editor password">
      <form onSubmit={submit}>
        <p className="mb-5 flex items-start gap-2.5 text-sm leading-relaxed text-white/60">
          <KeyRound size={16} className="mt-0.5 shrink-0 text-primary" />
          <span>
            {reason && reason !== "Editor password required"
              ? reason
              : "Editing quizzes needs the editor password."}
          </span>
        </p>

        <input
          type="password"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Password"
          autoComplete="current-password"
          enterKeyHint="go"
          aria-label="Editor password"
          className="mb-4 min-h-[48px] w-full rounded-2xl border-[1.5px] border-white/10 bg-white/5 px-4 text-base text-white placeholder:text-white/45 focus:border-primary/50 focus:outline-none"
        />

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="min-h-[44px] flex-1 rounded-full border-[1.5px] border-white/20 px-4 font-bold text-white transition-colors hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!value.trim()}
            className="btn-primary min-h-[44px] flex-1 !px-4 !py-0 !text-base disabled:opacity-40"
          >
            Unlock
          </button>
        </div>
      </form>
    </Modal>
  );
}
