export function formatPrice(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount ?? 0);
}

export function getProductPath(slug) {
  return `/products/${slug}`;
}

/** Prefer Herbal Hair Oil first on storefront product lists. */
export function sortStorefrontProducts(products = []) {
  return [...products].sort((a, b) => {
    const aHair = a.slug === "herbal-hair-oil" ? 0 : 1;
    const bHair = b.slug === "herbal-hair-oil" ? 0 : 1;
    return aHair - bHair;
  });
}

/** 1 kg, 500 g, and any future size of Multigrain Malt share the same detail extras. */
export function isMultigrainMaltSlug(slug = "") {
  return (
    slug === "multigrain-malt-powder" ||
    slug.startsWith("multigrain-malt-powder-")
  );
}

function sortByOrder(items = []) {
  return [...items].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}

export function getProductVariants(product) {
  if (product.quantities?.length > 0) return sortByOrder(product.quantities);
  if (product.sizes?.length > 0) return sortByOrder(product.sizes);
  return [];
}

export function getProductImageUrls(images = []) {
  return sortByOrder(images).map((image) =>
    typeof image === "string" ? image : image.url,
  );
}

export function getProductCoverUrl(product) {
  if (product.coverImage?.url) return product.coverImage.url;
  const gallery = getProductImageUrls(product.images);
  return gallery[0] || null;
}

export function splitTitleLines(name) {
  const words = name.trim().split(/\s+/);
  if (words.length <= 1) return [name];
  const mid = Math.ceil(words.length / 2);
  return [words.slice(0, mid).join(" "), words.slice(mid).join(" ")];
}

const DEFAULT_PURITY_PLEDGE = {
  noChemical: "No harmful chemicals or synthetic additives",
  noAddedSugar: "No added sugar",
  noPreservatives: "No artificial preservatives",
};

const DEFAULT_WHO_CAN_CONSUME =
  "Thoughtfully made for everyday family use across ages and lifestyles.";

const DEFAULT_AGE_FACTORS =
  "Gentle enough for daily use when used as directed. Please consult a healthcare provider for specific age-related concerns.";

export function normalizeProduct(apiProduct) {
  const variants = getProductVariants(apiProduct).map((variant) => ({
    id: variant.value || variant.label,
    label: variant.label,
    price: variant.price,
    priceDisplay: formatPrice(variant.price),
    maxQuantityPerOrder:
      variant.maxQuantityPerOrder ?? apiProduct.maxQuantityPerOrder ?? 1,
  }));

  const sortedBenefits = sortByOrder(apiProduct.benefits || []);
  const sortedSpecs = sortByOrder(apiProduct.specifications || []);
  const sortedSuitability = sortByOrder(apiProduct.suitability || []);

  const images = getProductImageUrls(apiProduct.images);
  const basePrice = variants[0]?.price ?? apiProduct.price ?? 0;

  const whoCanConsume =
    sortedSuitability.find((item) => /who|consume/i.test(item.heading))
      ?.description ||
    sortedSuitability[0]?.description ||
    DEFAULT_WHO_CAN_CONSUME;

  const ageFactors =
    sortedSuitability.find((item) => /age/i.test(item.heading))?.description ||
    sortedSuitability[1]?.description ||
    DEFAULT_AGE_FACTORS;

  return {
    id: apiProduct.id,
    slug: apiProduct.slug,
    name: apiProduct.name,
    tagline: apiProduct.tagline || "",
    description: apiProduct.description || "",
    price: basePrice,
    priceDisplay: formatPrice(basePrice),
    images,
    variants:
      variants.length > 0
        ? variants
        : [
            {
              id: "default",
              label: "Standard",
              price: apiProduct.price ?? 0,
              priceDisplay: formatPrice(apiProduct.price ?? 0),
              maxQuantityPerOrder: apiProduct.maxQuantityPerOrder ?? 1,
            },
          ],
    highlights: apiProduct.highlights || [],
    whoCanConsume,
    ageFactors,
    benefits: sortedBenefits.map((benefit) => ({
      title: benefit.heading,
      description: benefit.description,
    })),
    purityPledge: DEFAULT_PURITY_PLEDGE,
    specifications: sortedSpecs.map((spec) => ({
      label: spec.heading,
      value: spec.description,
    })),
    faqs: [],
    reviews: [],
    category: apiProduct.category,
    maxQuantityPerOrder: apiProduct.maxQuantityPerOrder ?? 1,
  };
}

export function toLandingProduct(apiProduct) {
  const normalized = normalizeProduct(apiProduct);
  const description =
    apiProduct.tagline ||
    apiProduct.description ||
    normalized.description;

  return {
    slug: apiProduct.slug,
    name: apiProduct.name,
    titleLines: splitTitleLines(apiProduct.name),
    image: getProductCoverUrl(apiProduct) || "/landingproducts/herbaloil_land.png",
    description,
  };
}
