import Image from "next/image";
import Link from "next/link";

/**
 * Footer for pages outside the landing page.
 *
 * The landing page closes with the Contact section, which carries its own
 * sign-off; the journal needs the same furniture without the form, so the
 * links live here and the two stay visually consistent.
 */
const socials = [
  { label: "Email", value: "mudassarg@gmail.com", href: "mailto:mudassarg@gmail.com" },
  { label: "Instagram", value: "@ateliermudassar", href: "https://instagram.com/ateliermudassar" },
  { label: "LinkedIn", value: "mudassar-ghaffar", href: "https://linkedin.com/in/mudassar-ghaffar" },
  { label: "YouTube", value: "@Mudassar81", href: "https://youtube.com/@Mudassar81" },
  { label: "Behance", value: "mudassarghaffar", href: "https://behance.net/mudassarghaffar" },
];

export default function SiteFooter() {
  return (
    <footer className="relative bg-ink border-t border-gold/10 px-6 py-16">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-10">
          <div className="flex items-center gap-4">
            <Image
              src="/art/logo.png"
              alt="Atelier Mudassar crest"
              width={40}
              height={40}
              className="rounded-full opacity-80"
            />
            <div>
              <p className="font-display text-porcelain text-lg">Mudassar Ghaffar</p>
              <p className="font-accent italic text-gold-bright/80 text-sm">
                Founder · Atelier Mudassar
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-x-8 gap-y-3">
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target={s.label !== "Email" ? "_blank" : undefined}
                rel="noopener noreferrer"
                className="group flex flex-col"
              >
                <span className="text-cream-dim/70 tracking-[0.2em] uppercase text-[11px]">
                  {s.label}
                </span>
                <span className="text-porcelain/90 text-sm group-hover:text-gold-bright transition-colors">
                  {s.value}
                </span>
              </a>
            ))}
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-gold/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-cream-dim/60 text-xs tracking-[0.15em] uppercase">
            © {new Date().getFullYear()} Atelier Mudassar. All rights reserved.
          </p>
          <Link
            href="/#contact"
            className="text-xs tracking-[0.25em] uppercase text-gold hover:text-gold-bright transition-colors"
          >
            Get in touch →
          </Link>
        </div>
      </div>
    </footer>
  );
}
