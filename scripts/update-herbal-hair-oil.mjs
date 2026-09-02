/**
 * Update Herbal Hair Oil with label content (benefits + specifications).
 *
 * Usage:
 *   node scripts/update-herbal-hair-oil.mjs --token 'JWT...'
 */

import { API_URL } from "../config.js";

const BASE = API_URL.replace(/\/$/, "");
const PRODUCT_ID = "6a475c66b203bc97e100aaa1";
const PRODUCT_SLUG = "herbal-hair-oil";

function parseArgs(argv) {
  const out = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--email") out.email = argv[++i];
    else if (a === "--password") out.password = argv[++i];
    else if (a === "--token") out.token = argv[++i];
  }
  return out;
}

async function api(path, { method = "GET", token, body } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path.startsWith("/") ? path : `/${path}`}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.success === false) {
    throw new Error(json.message || `${method} ${path} failed (${res.status})`);
  }
  return json.data;
}

const BENEFITS = [
  {
    heading: "Stronger, Healthier Hair",
    description:
      "Nature's secret for stronger, healthier hair — a traditional herbal blend that nourishes from root to tip.",
  },
  {
    heading: "Nourishes Dry Scalp",
    description:
      "Massage in and leave for 2 hours or overnight for dry scalp, then rinse with a mild shampoo.",
  },
  {
    heading: "Amla & Bhringraj Care",
    description:
      "Classic Ayurvedic herbs Amla and Bhringraj support thicker-feeling strands and natural hair vitality.",
  },
  {
    heading: "18+ Herbal Ingredients",
    description:
      "Coconut, sesame and flax seed oils infused with rosemary, fenugreek, kalonji, curry leaves, onion and more.",
  },
  {
    heading: "Root & Scalp Nourishment",
    description:
      "Massage into scalp and roots to condition hair naturally without harsh chemicals.",
  },
  {
    heading: "Easy Weekly Ritual",
    description:
      "Use 3 times a week. Shake well before use for an even herbal blend every time.",
  },
];

const SPECIFICATIONS = [
  {
    heading: "Net Quantity",
    description: "250 ml",
  },
  {
    heading: "Ingredients",
    description:
      "Coconut oil, Sesame oil, Flax seeds oil, Jatamansi, Ratanjot, Jaipatri, Clove, Khus root, Rose petals, Rosemary, Amla, Bhringraj, Indigo, Henna, Fenugreek seeds, Kalonji seeds, Small onions, Curry leaves",
  },
  {
    heading: "Directions for Use",
    description:
      "Massage a sufficient amount of oil into your scalp and hair. Leave it on for 2 hours or overnight (for dry scalp), then rinse with mild shampoo. Use 3 times a week. Shake well before use.",
  },
  {
    heading: "Shelf Life",
    description: "Best before 12 months",
  },
  {
    heading: "MRP",
    description: "₹750 (incl. of all taxes)",
  },
  {
    heading: "Manufacturer",
    description: "Ashwini Natural Products, Nanda Deepa Layout, RR Nagar, Bangalore - 560098",
  },
  {
    heading: "Customer Support",
    description: "+91 6363 250 586 (Phone / WhatsApp)",
  },
  {
    heading: "Email",
    description: "ashwininaturalproducts@gmail.com",
  },
  {
    heading: "Website",
    description: "www.ashwininaturalproducts.com",
  },
  {
    heading: "Country of Origin",
    description: "Made in India",
  },
];

async function main() {
  const args = parseArgs(process.argv);
  let token = args.token || process.env.ASHWINI_TOKEN;

  if (!token) {
    const email = args.email || process.env.ASHWINI_ADMIN_EMAIL;
    const password = args.password || process.env.ASHWINI_ADMIN_PASSWORD;
    if (!email || !password) {
      throw new Error("Provide --token or --email/--password");
    }
    const auth = await api("/auth/login", {
      method: "POST",
      body: { email, password },
    });
    token = auth.token;
  }

  const existing = await api(`/admin/products/${PRODUCT_ID}`, { token });
  console.log(`Updating product ${existing.id} (${existing.name})...`);

  const payload = {
    name: existing.name || "Herbal Hair Oil",
    tagline: "Nature's Secret for Stronger, Healthier Hair",
    description:
      "Nimma Ashwini Herbal Hair Oil — a natural blend of coconut, sesame and flax seed oils with 18+ herbs including Amla, Bhringraj, rosemary, fenugreek, kalonji, curry leaves and small onion. Massage into scalp and hair; leave 2 hours or overnight for dry scalp, then rinse with mild shampoo. Use 3 times a week.",
    highlights: [
      "18+ herbal ingredients",
      "Nourishes dry scalp overnight",
      "Amla, Bhringraj & rosemary blend",
      "Use 3 times a week",
    ],
    category: existing.category?.id || existing.category,
    coverImage: existing.coverImage ?? null,
    images: existing.images || [],
    quantities: existing.quantities || [],
    price: existing.price ?? 750,
    stock: existing.stock,
    maxQuantityPerOrder: existing.maxQuantityPerOrder,
    benefits: BENEFITS.map((item, sortOrder) => ({ ...item, sortOrder })),
    specifications: SPECIFICATIONS.map((item, sortOrder) => ({
      ...item,
      sortOrder,
    })),
    isActive: existing.isActive ?? true,
  };

  const updated = await api(`/admin/products/${PRODUCT_ID}`, {
    method: "PUT",
    token,
    body: payload,
  });

  console.log("Updated successfully.");
  console.log(`Benefits: ${updated.benefits?.length ?? BENEFITS.length}`);
  console.log(
    `Specifications: ${updated.specifications?.length ?? SPECIFICATIONS.length}`,
  );
  console.log(`Slug: ${updated.slug || PRODUCT_SLUG}`);
  console.log(`Open: /products/${PRODUCT_SLUG}`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
