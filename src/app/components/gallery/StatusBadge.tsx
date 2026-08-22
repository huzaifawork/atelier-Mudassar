import type { ArtworkStatus } from "../../data/artworks";
import { statusLabels } from "../../data/artworks";

const statusStyles: Record<ArtworkStatus, string> = {
  "in-progress": "border-copper/60 bg-ink/70 text-copper",
};

const dotStyles: Record<ArtworkStatus, string> = {
  "in-progress": "bg-copper animate-pulse",
};

export default function StatusBadge({
  status,
  className = "",
}: {
  status: ArtworkStatus;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 text-[0.62rem] tracking-[0.2em] uppercase border rounded-full backdrop-blur-sm ${statusStyles[status]} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotStyles[status]}`} />
      {statusLabels[status]}
    </span>
  );
}
