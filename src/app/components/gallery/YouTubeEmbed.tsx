"use client";

import { useState } from "react";
import { extractVideoId, thumbnailFor } from "../../lib/youtube";

function PlayGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 translate-x-0.5">
      <path d="M8 5.5v13l11-6.5-11-6.5z" />
    </svg>
  );
}

export default function YouTubeEmbed({ url, label = "Watch Process Video" }: { url: string; label?: string }) {
  const [playing, setPlaying] = useState(false);
  const videoId = extractVideoId(url);

  if (!videoId) return null;

  return (
    <div>
      <p className="text-copper text-xs tracking-[0.3em] uppercase mb-3">{label}</p>
      <div className="relative aspect-video w-full overflow-hidden rounded-sm border border-gold/25 bg-espresso shadow-[0_20px_45px_-15px_rgba(0,0,0,0.5)]">
        {playing ? (
          <iframe
            className="absolute inset-0 w-full h-full"
            src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`}
            title={label}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            aria-label={label}
            className="group absolute inset-0 w-full h-full cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-bright"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={thumbnailFor(videoId)}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-ink/40 group-hover:bg-ink/25 transition-colors duration-300" />
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="w-14 h-14 flex items-center justify-center rounded-full border border-gold-bright/70 bg-ink/60 backdrop-blur-sm text-porcelain group-hover:text-gold-bright group-hover:border-gold-bright group-hover:scale-110 transition-all duration-300">
                <PlayGlyph />
              </span>
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
