import type { MetadataRoute } from "next";

/**
 * Keeps the admin and auth surfaces out of search results.
 *
 * This is a discoverability measure, not a security one — robots.txt is a
 * request, not a control. The pages are protected by the auth check in the
 * admin layout; this just stops them showing up in a Google search.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/admin/", "/login", "/api/"],
      },
    ],
  };
}
