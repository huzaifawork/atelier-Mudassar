import type { NextConfig } from "next";

// Fonts are self-hosted via next/font/google (no runtime request to Google),
// so the only third-party origins the app legitimately talks to are YouTube's
// thumbnail CDN and its no-cookie embed player. script-src needs
// 'unsafe-inline' because Next.js ships its hydration payload in an inline
// <script> tag and this app doesn't run nonce-based middleware — everything
// else is locked to 'self', which still blocks loading any *external*
// script, exfiltration via fetch/XHR to another origin, framing, and
// <object>/<embed> content.
// React's dev-mode debugging (stack-trace reconstruction) uses eval(), which
// a strict script-src blocks — harmless (React never uses eval() in a
// production build), but noisy in the console during `next dev`. Only widen
// the policy for that local case; the deployed app keeps the strict one.
const isDev = process.env.NODE_ENV !== "production";

const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https://i.ytimg.com",
  "font-src 'self'",
  "frame-src 'self' https://www.youtube-nocookie.com",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  // No framing anywhere — the admin has no legitimate embed use, and this
  // shuts the door on clickjacking against the gallery controls.
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-DNS-Prefetch-Control", value: "off" },
  { key: "Content-Security-Policy", value: CONTENT_SECURITY_POLICY },
];

const nextConfig: NextConfig = {
  images: {
    qualities: [75, 90],
  },
  // Don't advertise the framework version to scanners.
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        // Admin and auth responses must never be cached by a CDN or browser.
        source: "/admin/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate, private",
          },
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
        ],
      },
      {
        source: "/api/auth/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
    ];
  },
};

export default nextConfig;
