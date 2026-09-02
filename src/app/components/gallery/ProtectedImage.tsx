"use client";

import { getImageProps } from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { imageSrcFor } from "../../lib/galleryMap";

const MAX_DPR = 2;
const LENS_SIZE = 240;
const ZOOM = 2.3;

interface Placement {
  /** Source pixels -> CSS pixels. containerX = sourceX * scale + offsetX. */
  scale: number;
  offsetX: number;
  offsetY: number;
}

/**
 * Where the image sits on the canvas.
 *
 * "contain" fits the whole image inside the box; "cover" fills it and lets the
 * overflow clip. Both are the same arithmetic with min/max swapped, and both
 * are kept as an explicit mapping rather than a bare drawImage call because
 * the magnifier has to invert it — turning a cursor position back into a
 * coordinate in the source image.
 */
function placementFor(
  fit: "cover" | "contain",
  imgW: number,
  imgH: number,
  cw: number,
  ch: number,
): Placement {
  const scale =
    fit === "contain"
      ? Math.min(cw / imgW, ch / imgH)
      : Math.max(cw / imgW, ch / imgH);
  return {
    scale,
    offsetX: (cw - imgW * scale) / 2,
    offsetY: (ch - imgH * scale) / 2,
  };
}

interface ProtectedImageProps {
  src: string;
  alt: string;
  className?: string;
  /** Enables the cursor-following magnifier lens (desktop hover only). */
  magnify?: boolean;
  /** "cover" crops to fill (grid cards); "contain" shows the full, uncropped original (lightbox). */
  fit?: "cover" | "contain";
  /** Reports the decoded image's real pixel dimensions once known, for callers that size the box to match (avoids letterboxing). */
  onNaturalSize?: (width: number, height: number) => void;
  /**
   * Pixel width to ask the optimizer for, and the quality to encode at.
   *
   * Worth setting per use rather than leaving at one value for everything.
   * The originals here are full-resolution exports — 20 MB and 9000 px across
   * is normal — so what gets requested decides both the bytes on the wire and
   * how much work the optimizer does. A grid card roughly 350 px wide wants a
   * fraction of what the lightbox's magnifier wants, and asking for one size
   * everywhere means either bloated thumbnails or a soft lightbox.
   *
   * `quality` must be one of images.qualities in next.config.ts.
   */
  width?: number;
  quality?: number;
}

export default function ProtectedImage({
  src,
  alt,
  className = "",
  magnify = false,
  fit = "cover",
  onNaturalSize,
  width = 1080,
  quality = 75,
}: ProtectedImageProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lensCanvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const placementRef = useRef<Placement | null>(null);
  const onNaturalSizeRef = useRef(onNaturalSize);
  useEffect(() => {
    onNaturalSizeRef.current = onNaturalSize;
  }, [onNaturalSize]);
  const [ready, setReady] = useState(false);
  const [lensVisible, setLensVisible] = useState(false);
  const [lensPos, setLensPos] = useState({ x: 0, y: 0 });
  const [lensSize, setLensSize] = useState(LENS_SIZE);
  const [showHint, setShowHint] = useState(magnify);
  const [shouldLoad, setShouldLoad] = useState(false);

  // Bucket images resolve to our own /api/gallery/image route, so both bundled
  // assets and admin uploads are local paths the optimizer can handle.
  const optimizedSrc = useMemo(() => {
    const resolved = imageSrcFor(src);
    // A blob:/data: source is the admin previewing a file that hasn't been
    // uploaded yet — the optimizer can't fetch those, so use them as-is.
    if (resolved.startsWith("blob:") || resolved.startsWith("data:")) {
      return resolved;
    }
    const { props } = getImageProps({
      src: resolved,
      alt,
      width,
      // Only the width steers which optimized variant is picked; the height
      // is required by the signature but never constrains the result, so it
      // does not need to match the artwork's real shape.
      height: width,
      quality,
    });
    return props.src;
  }, [src, alt, width, quality]);

  // Defer fetching until the card is actually near the viewport — without
  // this, every grid thumbnail fetches its full-size image the instant the
  // gallery mounts, regardless of scroll position.
  useEffect(() => {
    const container = rootRef.current;
    if (!container) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = rootRef.current;
    const img = imgRef.current;
    if (!canvas || !container || !img || !img.naturalWidth) return;

    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    const cw = container.clientWidth;
    const ch = container.clientHeight;
    if (cw === 0 || ch === 0) return;

    canvas.width = cw * dpr;
    canvas.height = ch * dpr;
    canvas.style.width = `${cw}px`;
    canvas.style.height = `${ch}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cw, ch);
    // The source is several times the size of the box it lands in, and the
    // default resampling gets visibly gritty at that ratio.
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    const placement = placementFor(
      fit,
      img.naturalWidth,
      img.naturalHeight,
      cw,
      ch,
    );
    // Kept for the magnifier, which needs to map the cursor back into the
    // source image. "cover" draws past the edges of the canvas on purpose;
    // the canvas clips it.
    placementRef.current = placement;

    ctx.drawImage(
      img,
      placement.offsetX,
      placement.offsetY,
      img.naturalWidth * placement.scale,
      img.naturalHeight * placement.scale,
    );
  }, [fit]);

  useEffect(() => {
    if (!shouldLoad || !optimizedSrc) return;
    let cancelled = false;
    const image = new window.Image();
    image.decoding = "async";
    image.onload = () => {
      if (cancelled) return;
      imgRef.current = image;
      draw();
      setReady(true);
      onNaturalSizeRef.current?.(image.naturalWidth, image.naturalHeight);
    };
    image.src = optimizedSrc;

    return () => {
      cancelled = true;
    };
  }, [shouldLoad, optimizedSrc, draw]);

  useEffect(() => {
    const container = rootRef.current;
    if (!container) return;
    const observer = new ResizeObserver(() => draw());
    observer.observe(container);
    return () => observer.disconnect();
  }, [draw]);

  /**
   * Paints the magnifier.
   *
   * Samples the decoded image, not the on-screen canvas. Cropping the canvas
   * was the whole problem with detail: that canvas only ever holds the image
   * at the size it is displayed at, so enlarging a piece of it is enlarging
   * pixels the browser had already thrown away — the lens could not show
   * anything the naked eye couldn't already see, only a blurrier version of
   * it. Going back to the source means the zoom reveals real detail, up to
   * the full resolution of the image that was loaded.
   */
  const updateLens = useCallback((clientX: number, clientY: number) => {
    const container = rootRef.current;
    const lensCanvas = lensCanvasRef.current;
    const img = imgRef.current;
    const placement = placementRef.current;
    if (!container || !lensCanvas || !img || !placement) return;

    const rect = container.getBoundingClientRect();
    const cx = clientX - rect.left;
    const cy = clientY - rect.top;
    if (cx < 0 || cy < 0 || cx > rect.width || cy > rect.height) {
      setLensVisible(false);
      return;
    }
    setLensVisible(true);
    setLensPos({ x: cx, y: cy });
    setShowHint(false);

    // Cap the lens to a fraction of the image's own on-screen size so it
    // doesn't dominate a small phone screen.
    const size = Math.round(
      Math.max(
        140,
        Math.min(LENS_SIZE, Math.min(rect.width, rect.height) * 0.55),
      ),
    );
    setLensSize(size);

    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    const targetSize = Math.round(size * dpr);
    if (lensCanvas.width !== targetSize) lensCanvas.width = targetSize;
    if (lensCanvas.height !== targetSize) lensCanvas.height = targetSize;
    lensCanvas.style.width = `${size}px`;
    lensCanvas.style.height = `${size}px`;

    // How much of the image the lens covers, converted from CSS pixels into
    // source pixels through the same placement the canvas was drawn with.
    const cropCss = size / ZOOM;
    const crop = cropCss / placement.scale;
    const cropSize = Math.min(crop, img.naturalWidth, img.naturalHeight);

    const centerX = (cx - placement.offsetX) / placement.scale;
    const centerY = (cy - placement.offsetY) / placement.scale;
    const sx = Math.min(
      Math.max(centerX - cropSize / 2, 0),
      Math.max(0, img.naturalWidth - cropSize),
    );
    const sy = Math.min(
      Math.max(centerY - cropSize / 2, 0),
      Math.max(0, img.naturalHeight - cropSize),
    );

    const lctx = lensCanvas.getContext("2d");
    if (!lctx) return;
    lctx.imageSmoothingEnabled = true;
    lctx.imageSmoothingQuality = "high";
    lctx.clearRect(0, 0, targetSize, targetSize);
    lctx.drawImage(
      img,
      sx,
      sy,
      Math.max(1, cropSize),
      Math.max(1, cropSize),
      0,
      0,
      targetSize,
      targetSize,
    );
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!magnify) return;
      updateLens(e.clientX, e.clientY);
    },
    [magnify, updateLens],
  );

  const handleMouseLeave = useCallback(() => setLensVisible(false), []);

  // Touch support (tap-and-drag to inspect): registered as a native, non-passive
  // listener so touchmove's preventDefault actually stops the page/lightbox from
  // scrolling under the finger — React's synthetic touch handlers are passive
  // by default and can't do that.
  useEffect(() => {
    if (!magnify) return;
    const el = rootRef.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      if (t) updateLens(t.clientX, t.clientY);
    };
    const onTouchMove = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      e.preventDefault();
      updateLens(t.clientX, t.clientY);
    };
    const onTouchEnd = () => setLensVisible(false);

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd);
    el.addEventListener("touchcancel", onTouchEnd);

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [magnify, updateLens]);

  return (
    <div
      ref={rootRef}
      role="img"
      aria-label={alt}
      className={`relative w-full h-full select-none ${className}`}
      style={{
        WebkitTouchCallout: "none",
        WebkitUserSelect: "none",
        touchAction: magnify ? "none" : "auto",
        cursor: magnify ? "zoom-in" : undefined,
      }}
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
      onMouseMove={magnify ? handleMouseMove : undefined}
      onMouseLeave={magnify ? handleMouseLeave : undefined}
    >
      <div className="absolute inset-0 overflow-hidden">
        {!ready && (
          <div className="absolute inset-0 bg-espresso-light/60 animate-pulse" />
        )}
        <canvas
          ref={canvasRef}
          className={`block w-full h-full transition-opacity duration-500 ${ready ? "opacity-100" : "opacity-0"}`}
          style={
            {
              WebkitUserDrag: "none",
              pointerEvents: "none",
            } as React.CSSProperties
          }
        />
      </div>

      {magnify && (
        <div
          aria-hidden
          className={`pointer-events-none absolute inset-x-0 bottom-4 flex justify-center transition-opacity duration-500 ${
            ready && showHint ? "opacity-100" : "opacity-0"
          }`}
        >
          <span className="inline-flex items-center gap-2.5 rounded-full border border-gold/30 bg-ink/70 backdrop-blur-sm px-4 py-2 text-xs tracking-[0.15em] uppercase text-cream-dim/90">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="w-5 h-5 shrink-0"
            >
              <circle cx="10.5" cy="10.5" r="6.5" />
              <path d="M20 20l-4.7-4.7" strokeLinecap="round" />
            </svg>
            Hover or touch to inspect
          </span>
        </div>
      )}

      {/* Always mounted so the ref exists before the first hover — only its
          visibility is gated on lensVisible. Conditionally mounting the
          canvas here creates a chicken-and-egg deadlock with updateLens. */}
      {magnify && (
        <div
          aria-hidden
          className={`pointer-events-none absolute z-20 rounded-full border-2 border-gold-bright/80 shadow-[0_10px_40px_rgba(0,0,0,0.6)] overflow-hidden transition-opacity duration-150 ${
            lensVisible ? "opacity-100" : "opacity-0"
          }`}
          style={{
            left: lensPos.x,
            top: lensPos.y,
            width: lensSize,
            height: lensSize,
            transform: "translate(-50%, -50%)",
          }}
        >
          <canvas ref={lensCanvasRef} className="block" />
          <div className="absolute inset-0 rounded-full ring-1 ring-inset ring-porcelain/20" />
        </div>
      )}
    </div>
  );
}
