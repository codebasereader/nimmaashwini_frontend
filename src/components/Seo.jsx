import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_OG_IMAGE,
  SITE_NAME,
  absoluteUrl,
} from "../lib/seoConfig";

/**
 * index.html ships static title/description/OG tags as a fallback for
 * non-JS crawlers and the pre-hydration paint. React doesn't manage those
 * (they weren't rendered by it), so once a real <Seo> mounts we remove them
 * — otherwise both sets coexist and a crawler may read the stale static one.
 */
function useRemoveStaticSeoDefaults() {
  useEffect(() => {
    document
      .querySelectorAll("[data-seo-default]")
      .forEach((node) => node.remove());
  }, []);
}

/**
 * Per-page <head> tags: title, description, canonical, Open Graph/Twitter
 * cards, and optional JSON-LD structured data. Drop into any route.
 */
export default function Seo({
  title,
  description = DEFAULT_DESCRIPTION,
  path,
  image = DEFAULT_OG_IMAGE,
  type = "website",
  noindex = false,
  jsonLd,
}) {
  useRemoveStaticSeoDefaults();

  const location = useLocation();
  const canonicalPath = path ?? `${location.pathname}${location.search}`;
  const canonicalUrl = absoluteUrl(canonicalPath);
  const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
  const jsonLdEntries = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />
      <meta name="robots" content={noindex ? "noindex, nofollow" : "index, follow"} />

      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={image} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {jsonLdEntries.map((entry, index) => (
        <script key={index} type="application/ld+json">
          {JSON.stringify(entry)}
        </script>
      ))}
    </Helmet>
  );
}
