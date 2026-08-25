import Image from "next/image";
import { coverSrcFor } from "../../lib/blogMap";

/**
 * A post's cover — or a typographic stand-in when there isn't one.
 *
 * Covers are optional by design, so every card and header has to look
 * deliberate without an image rather than collapsing into an empty box.
 */
export default function CoverArt({
  cover,
  title,
  sizes,
  priority = false,
  className = "",
}: {
  cover?: string;
  title: string;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  if (cover) {
    return (
      <Image
        src={coverSrcFor(cover)}
        alt={title}
        fill
        sizes={sizes}
        priority={priority}
        className={`object-cover ${className}`}
      />
    );
  }

  const initial = title.trim().charAt(0).toUpperCase() || "A";

  return (
    <div
      aria-hidden
      className="absolute inset-0 bg-espresso overflow-hidden flex items-center justify-center"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(205,163,95,0.16),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_75%_85%,rgba(195,128,90,0.14),transparent_60%)]" />
      <div className="absolute inset-4 border border-gold/15" />
      <span className="relative font-display text-7xl sm:text-8xl text-gold/25 select-none">
        {initial}
      </span>
      <span className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3">
        <span className="w-1.5 h-1.5 rotate-45 bg-gold/50" />
        <span className="h-px w-12 bg-linear-to-r from-gold/40 to-transparent" />
      </span>
    </div>
  );
}
