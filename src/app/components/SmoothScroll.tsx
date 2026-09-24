"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { registerSmoothScroll } from "../lib/smoothScroll";

export default function SmoothScroll() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.1,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });

    // Published so overlays can hold the page still while they're open.
    // Lenis drives the scroll itself, so body overflow can't stop it.
    registerSmoothScroll(lenis);

    let frame = 0;
    function raf(time: number) {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    }
    frame = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(frame);
      registerSmoothScroll(null);
      lenis.destroy();
    };
  }, []);

  return null;
}
