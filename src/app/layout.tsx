import type { Metadata } from "next";
import { Playfair_Display, Cormorant_Garamond, Jost } from "next/font/google";
import "./globals.css";
import SmoothScroll from "./components/SmoothScroll";

const display = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const serifAccent = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-accent",
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

const body = Jost({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Atelier Mudassar — Digital Fine Artist",
  description:
    "Mudassar Ghaffar is a digital fine artist exploring light, atmosphere, symbolism, and the human experience through digitally painted portraits, landscapes, wildlife, and conceptual compositions.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${serifAccent.variable} ${body.variable}`}>
      <body className="bg-ink text-porcelain antialiased font-body">
        <SmoothScroll />
        {children}
      </body>
    </html>
  );
}
