import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { GalleryProvider } from "../lib/galleryStore";
import { getAdminUser } from "../lib/authServer";
import { getServiceClient } from "../lib/supabase";
import SignOutButton from "./SignOutButton";
import AdminNav from "./AdminNav";

export const metadata: Metadata = {
  title: "Gallery Admin — Atelier Mudassar",
  robots: { index: false, follow: false, nocache: true },
};

// Never cache an authenticated shell.
export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // The authoritative check. The proxy redirect is only for a tidy UX; this
  // runs on the server for every admin render and is what actually protects
  // the pages.
  const user = await getAdminUser();
  if (!user) redirect("/login");

  let unreadCount = 0;
  const supabase = getServiceClient();
  if (supabase) {
    const { count } = await supabase
      .from("contact_messages")
      .select("id", { count: "exact", head: true })
      .eq("read", false);
    unreadCount = count ?? 0;
  }

  return (
    <GalleryProvider>
      <div className="min-h-screen bg-ink">
        <header className="sticky top-0 z-40 border-b border-gold/15 bg-ink/95 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:h-16 sm:py-0 flex flex-wrap sm:flex-nowrap items-center justify-between gap-x-4 gap-y-2">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 sm:gap-6">
              <div className="flex items-baseline gap-3">
                <Link
                  href="/admin/gallery"
                  className="font-display text-lg text-porcelain hover:text-gold-bright transition-colors"
                >
                  Atelier Mudassar
                </Link>
                <span className="hidden lg:inline text-[0.6rem] tracking-[0.25em] uppercase text-copper">
                  Admin
                </span>
              </div>
              <AdminNav unreadCount={unreadCount} />
            </div>
            <div className="flex items-center gap-3 sm:gap-4">
              <span className="hidden md:inline text-xs text-cream-dim/70 truncate max-w-[16rem]">
                {user.email}
              </span>
              <Link
                href="/#gallery"
                className="text-xs tracking-[0.2em] uppercase text-cream-dim hover:text-gold-bright transition-colors"
              >
                View site
              </Link>
              <SignOutButton />
            </div>
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">{children}</main>
      </div>
    </GalleryProvider>
  );
}
