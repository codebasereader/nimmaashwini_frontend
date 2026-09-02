/**
 * Generate public/sitemap.xml: static storefront pages + every active
 * product fetched from the live API. Runs automatically before each build.
 *
 * Usage:
 *   node scripts/generate-sitemap.mjs
 */

import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { API_URL } from "../config.js";
import { SITE_URL } from "../src/lib/seoConfig.js";

const BASE = API_URL.replace(/\/$/, "");
const OUTPUT_PATH = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "public",
  "sitemap.xml",
);

const STATIC_PAGES = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/terms", changefreq: "yearly", priority: "0.3" },
  { path: "/privacy", changefreq: "yearly", priority: "0.3" },
  { path: "/refund-policy", changefreq: "yearly", priority: "0.3" },
  { path: "/shipping-policy", changefreq: "yearly", priority: "0.3" },
];

async function fetchActiveProductSlugs() {
  const res = await fetch(`${BASE}/products?limit=100`);
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.success === false) {
    console.warn(
      `Warning: could not fetch products (${res.status}). Sitemap will only include static pages.`,
    );
    return [];
  }
  const items = json.data?.items || [];
  return items
    .filter((item) => item.isActive !== false && item.slug)
    .map((item) => item.slug);
}

function urlEntry({ path: urlPath, changefreq, priority }) {
  return [
    "  <url>",
    `    <loc>${SITE_URL}${urlPath}</loc>`,
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority}</priority>`,
    "  </url>",
  ].join("\n");
}

async function main() {
  const productSlugs = await fetchActiveProductSlugs();
  const productEntries = productSlugs.map((slug) =>
    urlEntry({ path: `/products/${slug}`, changefreq: "weekly", priority: "0.8" }),
  );

  const entries = [...STATIC_PAGES.map(urlEntry), ...productEntries];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join("\n")}
</urlset>
`;

  await writeFile(OUTPUT_PATH, xml, "utf-8");
  console.log(`Wrote ${entries.length} URLs to ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
