"use client";

import { useEffect, useRef } from "react";

const action =
  "px-3 py-1.5 text-[0.62rem] tracking-[0.18em] uppercase border transition-colors " +
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-bright";

export default function ConfirmDialog({
  title,
  description,
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    cancelRef.current?.focus();
    return () => {
      previouslyFocused.current?.focus?.();
    };
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-120 bg-ink/90 backdrop-blur-sm flex items-center justify-center p-6"
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="w-full max-w-md border border-gold/25 bg-espresso p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="confirm-dialog-title" className="font-display text-xl text-porcelain">
          {title}
        </h2>
        <p className="text-sm text-cream-dim/70 mt-3 leading-relaxed">{description}</p>
        <div className="mt-6 flex gap-3 justify-end">
          <button
            ref={cancelRef}
            onClick={onCancel}
            className={`${action} border-gold/25 text-cream-dim hover:border-gold/60 hover:text-gold-bright px-5 py-2.5`}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`${action} border-copper bg-copper text-ink hover:bg-copper/80 px-5 py-2.5`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
