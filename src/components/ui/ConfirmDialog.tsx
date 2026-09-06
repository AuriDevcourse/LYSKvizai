"use client";

import Modal from "./Modal";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  /** Body copy. Keep it to one line — the title carries the question. */
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Styles the confirm button as destructive. */
  destructive?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onCancel} title={title}>
      {message && <p className="mb-6 text-sm leading-relaxed text-white/60">{message}</p>}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className="min-h-[44px] flex-1 rounded-full border-[1.5px] border-white/20 px-4 font-bold text-white transition-colors hover:bg-white/10 disabled:opacity-50"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={busy}
          className={`min-h-[44px] flex-1 rounded-full px-4 font-extrabold transition-transform active:scale-97 disabled:opacity-50 ${
            destructive
              ? "bg-[#ff716c] text-black shadow-[0_12px_30px_rgba(255,113,108,0.25)]"
              : "btn-primary !px-4 !py-0 !text-base"
          }`}
        >
          {busy ? "Working…" : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
