"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin/gallery", label: "Gallery" },
  { href: "/admin/messages", label: "Messages" },
];

export default function AdminNav({ unreadCount }: { unreadCount: number }) {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-4 sm:gap-5">
      {links.map((link) => {
        const active = pathname?.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`text-xs tracking-[0.2em] uppercase transition-colors ${
              active ? "text-gold-bright" : "text-cream-dim hover:text-gold-bright"
            }`}
          >
            {link.label}
            {link.label === "Messages" && unreadCount > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center min-w-[1.1rem] h-[1.1rem] px-1 rounded-full bg-copper text-ink text-[0.6rem] tracking-normal normal-case align-middle">
                {unreadCount}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
