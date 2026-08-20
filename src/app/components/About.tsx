"use client";

import { useCallback, useRef, useState } from "react";
import { motion } from "framer-motion";

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 translate-x-px">
      <path d="M8 5.5v13l11-6.5-11-6.5z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M7 5h4v14H7V5zm6 0h4v14h-4V5z" />
    </svg>
  );
}

function VolumeOnIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-4 h-4">
      <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" stroke="none" />
      <path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" strokeLinecap="round" />
    </svg>
  );
}

function VolumeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-4 h-4">
      <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" stroke="none" />
      <path d="M16 9l5 6M21 9l-5 6" strokeLinecap="round" />
    </svg>
  );
}

export default function About() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playPromiseRef = useRef<Promise<void> | null>(null);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(true);
  const [progress, setProgress] = useState(0);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      playPromiseRef.current = video.play().catch(() => {});
    } else {
      // Wait out any in-flight play() so pause() doesn't interrupt it (avoids the
      // "play() request was interrupted by a call to pause()" console warning).
      Promise.resolve(playPromiseRef.current).then(() => video.pause());
    }
  }, []);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
  }, []);

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    setProgress((video.currentTime / video.duration) * 100);
  }, []);

  return (
    <section id="about" className="relative bg-ink py-20 sm:py-40 px-6 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_20%,rgba(205,163,95,0.08),transparent_55%)]" />
      <div className="absolute -left-32 top-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-copper/5 blur-3xl" />

      <div className="relative max-w-6xl mx-auto grid lg:grid-cols-2 gap-14 lg:gap-20 items-center">
        {/* Text */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="inline-block text-copper text-xs tracking-[0.4em] uppercase mb-6">Introduction</span>
          <h2 className="font-display text-3xl sm:text-4xl text-porcelain mb-6 sm:mb-8">Meet the Artist</h2>
          <p className="font-accent italic text-xl sm:text-2xl leading-relaxed text-porcelain/95 text-balance">
            Mudassar Ghaffar is a digital fine artist and the founder of{" "}
            <span className="text-gold-bright not-italic font-display">Atelier Mudassar</span>. His work explores
            the relationship between light, atmosphere, symbolism, and the human experience through digitally
            painted portraits, landscapes, wildlife, and conceptual compositions.
          </p>
          <p className="mt-6 text-cream-dim/80 text-base sm:text-lg leading-relaxed">
            Guided by classical artistic principles and contemporary digital practice, he creates work that
            invites contemplation while celebrating craftsmanship, authenticity, and the expressive potential
            of digital fine art.
          </p>

          <div className="mt-10 flex items-center gap-4">
            <span className="w-1.5 h-1.5 rotate-45 bg-gold" />
            <span className="h-px w-16 bg-linear-to-r from-gold/60 to-transparent" />
          </div>
        </motion.div>

        {/* Video */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-lg mx-auto lg:max-w-none"
        >
          <div className="absolute -inset-3 border border-gold/25 rounded-sm pointer-events-none" />

          <div className="group relative aspect-video rounded-sm overflow-hidden shadow-[0_30px_60px_-15px_rgba(0,0,0,0.55)] bg-espresso">
            <video
              ref={videoRef}
              src="/about-video/videoabout.mp4"
              autoPlay
              loop
              muted={muted}
              playsInline
              preload="metadata"
              aria-label="Behind the scenes with Mudassar Ghaffar"
              onTimeUpdate={handleTimeUpdate}
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              onClick={togglePlay}
              className="w-full h-full object-cover cursor-pointer"
            />

            {/* Legibility gradient for controls */}
            <div className="absolute inset-x-0 bottom-0 h-28 bg-linear-to-t from-ink/85 via-ink/25 to-transparent pointer-events-none" />

            {/* Center play affordance, shown when paused */}
            {!playing && (
              <button
                onClick={togglePlay}
                aria-label="Play video"
                className="absolute inset-0 flex items-center justify-center"
              >
                <span className="w-16 h-16 flex items-center justify-center rounded-full border border-gold/60 bg-ink/50 backdrop-blur-sm text-porcelain hover:text-gold hover:border-gold transition-colors">
                  <PlayIcon />
                </span>
              </button>
            )}

            {/* Control bar */}
            <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4 flex items-center gap-3 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100 transition-opacity duration-300">
              <button
                onClick={togglePlay}
                aria-label={playing ? "Pause video" : "Play video"}
                className="w-9 h-9 shrink-0 flex items-center justify-center rounded-full border border-porcelain/40 text-porcelain bg-ink/40 backdrop-blur-sm hover:border-gold hover:text-gold transition-colors"
              >
                {playing ? <PauseIcon /> : <PlayIcon />}
              </button>

              <div className="flex-1 h-1 bg-porcelain/20 rounded-full overflow-hidden">
                <div className="h-full bg-gold transition-[width] duration-150" style={{ width: `${progress}%` }} />
              </div>

              <button
                onClick={toggleMute}
                aria-label={muted ? "Unmute video" : "Mute video"}
                className="w-9 h-9 shrink-0 flex items-center justify-center rounded-full border border-porcelain/40 text-porcelain bg-ink/40 backdrop-blur-sm hover:border-gold hover:text-gold transition-colors"
              >
                {muted ? <VolumeOffIcon /> : <VolumeOnIcon />}
              </button>
            </div>
          </div>

          <p className="mt-4 text-center text-[0.68rem] tracking-[0.3em] uppercase text-cream-dim/60">
            Inside the Atelier
          </p>
        </motion.div>
      </div>
    </section>
  );
}
