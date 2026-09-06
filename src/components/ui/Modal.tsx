"use client";

import { useEffect, useRef, useCallback } from "react";
import { X } from "lucide-react";

/**
 * Glass modal with a focus trap.
 *
 * Replaces the native `confirm()` / `alert()` calls the editor used to make.
 * Those blocked the whole browser, could not be styled, and read as a different
 * application than the rest of the app.
 */
interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  /** Hide the X. Use for modals that must be answered. */
  dismissible?: boolean;
  labelledBy?: string;
}

export default function Modal({
  open,
  onClose,
  title,
  children,
  dismissible = true,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && dismissible) {
        onClose();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;

      // Focus trap — Tab must not escape into the page behind the overlay.
      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    },
    [onClose, dismissible]
  );

  useEffect(() => {
    if (!open) return;

    previouslyFocused.current = document.activeElement as HTMLElement | null;
    document.addEventListener("keydown", handleKeyDown);

    // Stop the page behind from scrolling under the overlay.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Move focus into the dialog.
    const t = setTimeout(() => {
      const target = panelRef.current?.querySelector<HTMLElement>(
        'input, button:not([data-close]), [tabindex]:not([tabindex="-1"])'
      );
      (target ?? panelRef.current)?.focus();
    }, 30);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = prevOverflow;
      clearTimeout(t);
      previouslyFocused.current?.focus?.();
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="glass animate-fade-in-up safe-bottom w-full max-w-md rounded-3xl p-6 outline-none"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="text-xl font-extrabold tracking-tight text-white">{title}</h2>
          {dismissible && (
            <button
              type="button"
              data-close
              onClick={onClose}
              aria-label="Close"
              className="tap-target -m-2 shrink-0 rounded-full text-white/50 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X size={20} />
            </button>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}
