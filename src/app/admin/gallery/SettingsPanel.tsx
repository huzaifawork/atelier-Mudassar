"use client";

import { useState } from "react";
import { useGallery } from "../../lib/galleryStore";

/** The section eyebrow and heading that used to be hardcoded in Gallery.tsx. */
export default function SettingsPanel() {
  const { settings, updateSettings } = useGallery();
  const [open, setOpen] = useState(false);
  const [eyebrow, setEyebrow] = useState(settings.eyebrow);
  const [heading, setHeading] = useState(settings.heading);
  const [state, setState] = useState<"idle" | "saving" | "saved">("idle");

  // Re-seed the inputs when the stored settings change (first load, or a save
  // elsewhere). Adjusting during render rather than in an effect keeps React
  // from doing a second pass with stale values on screen.
  const [lastSaved, setLastSaved] = useState(settings);
  if (settings !== lastSaved) {
    setLastSaved(settings);
    setEyebrow(settings.eyebrow);
    setHeading(settings.heading);
  }

  const dirty = eyebrow !== settings.eyebrow || heading !== settings.heading;
  const field =
    "w-full bg-espresso border border-gold/20 px-3.5 py-2.5 text-sm text-porcelain " +
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-bright";

  async function save() {
    setState("saving");
    try {
      await updateSettings({ eyebrow, heading });
      setState("saved");
      setTimeout(() => setState("idle"), 2000);
    } catch {
      setState("idle");
    }
  }

  return (
    <div className="mb-8 border border-gold/15 bg-espresso/30">
      <button
        onClick={() => setOpen((value) => !value)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-bright"
      >
        <span className="text-[0.65rem] tracking-[0.25em] uppercase text-copper">
          Section heading
        </span>
        <span className="text-xs text-cream-dim/60">
          {settings.eyebrow} · {settings.heading} {open ? "▲" : "▼"}
        </span>
      </button>

      {open && (
        <div className="px-4 pb-4 grid sm:grid-cols-[1fr_1fr_auto] gap-3 items-end border-t border-gold/10 pt-4">
          <div>
            <label
              htmlFor="eyebrow"
              className="block text-[0.62rem] tracking-[0.2em] uppercase text-cream-dim/60 mb-1.5"
            >
              Eyebrow
            </label>
            <input
              id="eyebrow"
              className={field}
              value={eyebrow}
              onChange={(event) => setEyebrow(event.target.value)}
            />
          </div>
          <div>
            <label
              htmlFor="heading"
              className="block text-[0.62rem] tracking-[0.2em] uppercase text-cream-dim/60 mb-1.5"
            >
              Heading
            </label>
            <input
              id="heading"
              className={field}
              value={heading}
              onChange={(event) => setHeading(event.target.value)}
            />
          </div>
          <button
            onClick={save}
            disabled={!dirty || state === "saving"}
            className="px-5 py-2.5 text-xs tracking-[0.2em] uppercase border border-gold/40 text-gold-bright hover:bg-gold hover:text-ink transition-colors disabled:opacity-35 disabled:cursor-not-allowed"
          >
            {state === "saving" ? "Saving…" : state === "saved" ? "Saved" : "Save"}
          </button>
        </div>
      )}
    </div>
  );
}
