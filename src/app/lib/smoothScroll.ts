"use client";

import type Lenis from "lenis";

/**
 * A handle on the page's smooth-scroll instance, so overlays can hold it still.
 *
 * Lenis intercepts wheel and touch events on the window and drives the scroll
 * position itself. That means `document.body.style.overflow = "hidden"` — the
 * usual way to freeze the page behind a modal — has no effect on it: the
 * wheel still reaches Lenis, and the page still moves under the overlay while
 * the visitor is trying to scroll the overlay's own content.
 *
 * Kept as a module-level registry rather than context because SmoothScroll is
 * mounted once in the root layout, well above anything that opens an overlay,
 * and threading a provider down to them would be the only reason for it.
 */
let instance: Lenis | null = null;

/** How many overlays are currently holding the page still. Counted, so two
 *  overlapping ones can't have the first to close release the scroll. */
let holds = 0;

export function registerSmoothScroll(next: Lenis | null): void {
  instance = next;
  // A fresh instance that arrives while something is holding the page (a
  // remount behind an open overlay) must not start out scrollable.
  if (instance && holds > 0) instance.stop();
}

/**
 * Freezes page scrolling until the returned function is called.
 *
 * Safe when smooth scrolling isn't running — the count is still kept, so the
 * pairing stays correct if an instance registers later.
 */
export function holdPageScroll(): () => void {
  holds += 1;
  instance?.stop();

  let released = false;
  return () => {
    if (released) return;
    released = true;
    holds = Math.max(0, holds - 1);
    if (holds === 0) instance?.start();
  };
}
