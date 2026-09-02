export const SITE_URL = "https://nimmaashwini.com";

export const SITE_NAME = "Nimma Ashwini";

export const DEFAULT_TITLE = "Nimma Ashwini | Traditional Natural Hair & Wellness Care";

export const DEFAULT_DESCRIPTION =
  "Nimma Ashwini crafts traditional, small-batch natural hair oils, herbal shampoos, and ragi malt using temple-grade herbs and time-honoured recipes. Natural, cruelty-free, made in India.";

export const DEFAULT_OG_IMAGE = `${SITE_URL}/anp_logo.webp`;

export function absoluteUrl(path = "/") {
  if (/^https?:\/\//i.test(path)) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${normalized}`;
}
