import Link from "next/link";
import ArtworkForm from "../ArtworkForm";

export default function NewArtworkPage() {
  return (
    <>
      <div className="mb-8">
        <Link
          href="/admin/gallery"
          className="text-xs tracking-[0.2em] uppercase text-cream-dim/60 hover:text-gold-bright transition-colors"
        >
          ← Gallery
        </Link>
        <h1 className="font-display text-3xl text-porcelain mt-3">Add artwork</h1>
      </div>
      <ArtworkForm />
    </>
  );
}
