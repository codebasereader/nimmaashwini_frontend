/**
 * Update Multigrain Malt Powder with label content (benefits + specifications).
 *
 * Usage:
 *   node scripts/update-multigrain-malt.mjs
 *   node scripts/update-multigrain-malt.mjs --email YOU@example.com --password 'YOUR_PASS'
 *   node scripts/update-multigrain-malt.mjs --token 'JWT...'
 */

import { API_URL } from "../config.js";

const BASE = API_URL.replace(/\/$/, "");
const PRODUCT_ID = "6a47552f736b4338f396dd25";
const PRODUCT_SLUG = "multigrain-malt-powder";

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
    heading: "Helps Manage PCOS",
    description:
      "A nutrient-dense multigrain blend that supports hormonal balance as part of a wholesome daily diet.",
  },
  {
    heading: "Regulates Irregular Periods",
    description:
      "Rich in minerals and plant nutrition that help support a more regular menstrual cycle.",
  },
  {
    heading: "Helps Manage Thyroid Function",
    description:
      "Packed with essential nutrients that support healthy thyroid function when taken regularly.",
  },
  {
    heading: "Controls Blood Pressure",
    description:
      "Natural grains, millets, seeds and nuts that support heart health and healthy blood pressure.",
  },
  {
    heading: "Controls Sugar Level",
    description:
      "High-fibre multigrain malt that helps maintain steadier blood sugar as part of a balanced diet.",
  },
  {
    heading: "Controls Hair Fall",
    description:
      "Iron, protein and micronutrients from grains and seeds that nourish hair from within.",
  },
  {
    heading: "Reduces Skin Problems",
    description:
      "Antioxidant-rich nuts, seeds and millets that support clearer, healthier-looking skin.",
  },
  {
    heading: "Reduces Joint Pain",
    description:
      "Wholesome nutrition that supports joint comfort and everyday mobility.",
  },
  {
    heading: "Helps in Weight Loss",
    description:
      "For weight loss, take with buttermilk. A filling, high-fibre drink that supports mindful eating.",
  },
  {
    heading: "Helps in Weight Gain",
    description:
      "For weight gain, take with jaggery. A calorie-nourishing malt that supports healthy weight goals.",
  },
];

const SPECIFICATIONS = [
  {
    heading: "Net Weight",
    description: "500 g / 1 kg",
  },
  {
    heading: "Grains",
    description:
      "Methi, Ground nuts, Jawari, Desi Kabuli Chana, Matki, Batana white, Chana Small, Soyabean, Masoor Dal, Moong whole, Bajri, Sabudana, Barli Rice, Makai, 3 Type Rajma, Kulith, 3 Type Udid, Chana Green, 3 Type Chowli, Vatana Green & Elaichi",
  },
  {
    heading: "Millets",
    description:
      "Ragi, Barnyard Millet, Little Millet, Proso Millet, Kodo Millet, Foxtail Millet",
  },
  {
    heading: "Seeds and Nuts",
    description:
      "Watermelon Seeds, Pumpkin Seeds, Sunflower Seeds, Muskmelon Seeds, Walnut & Badam, Poppy & Flax Seeds",
  },
  {
    heading: "Calcium (per 100g)",
    description: "488.34 mg",
  },
  {
    heading: "Carbohydrates (per 100g)",
    description: "73.39 g",
  },
  {
    heading: "Dietary Fiber (per 100g)",
    description: "14.8 g",
  },
  {
    heading: "Energy (per 100g)",
    description: "399.46 Kcal",
  },
  {
    heading: "Iron (per 100g)",
    description: "17.56 mg",
  },
  {
    heading: "Protein (per 100g)",
    description: "11.85 g",
  },
  {
    heading: "Total Fat (per 100g)",
    description: "6.5 g",
  },
  {
    heading: "Who Can Take",
    description:
      "Recommended after the 4th month of pregnancy · Suitable for both men and women · Recommended for above 1 year of age",
  },
  {
    heading: "Preparation",
    description:
      "Mix with warm milk, water, or buttermilk. For weight gain, take with jaggery; for weight loss, take with buttermilk.",
  },
  {
    heading: "Shelf Life",
    description: "12 months in airtight container",
  },
  {
    heading: "Storage",
    description: "Cool, dry place away from sunlight",
  },
  {
    heading: "Allergens",
    description: "Contains nuts and seeds (ground nuts, walnut, badam, soyabean)",
  },
];

async function main() {
  const args = parseArgs(process.argv);
  const email =
    args.email ||
    process.env.ASHWINI_ADMIN_EMAIL ||
    "admin@nimmaaishwini.com";
  const password =
    args.password ||
    process.env.ASHWINI_ADMIN_PASSWORD ||
    "Admin@123456";
  let token = args.token || process.env.ASHWINI_TOKEN;

  if (!token) {
    console.log(`Logging in as ${email}...`);
    const auth = await api("/auth/login", {
      method: "POST",
      body: { email, password },
    });
    token = auth.token;
    console.log("Login OK");
  }

  const list = await api("/admin/products?limit=100", { token });
  const items = list.items || list || [];
  const existing =
    items.find((p) => p.id === PRODUCT_ID || p.slug === PRODUCT_SLUG) ||
    (await api(`/admin/products/${PRODUCT_ID}`, { token }).catch(() => null));

  if (!existing) {
    throw new Error("Multigrain Malt Powder not found");
  }

  const id = existing.id || PRODUCT_ID;
  console.log(`Updating product ${id} (${existing.name})...`);

  const payload = {
    name: existing.name || "Multigrain Malt Powder",
    tagline: "Be Natural. Be Healthy.",
    description:
      "Nimma Ashwini Multigrain Malt — a traditional blend of grains, millets, seeds and nuts. Helps manage PCOS, irregular periods, thyroid, BP, sugar, hair fall, skin problems and joint pain. Supports weight loss (with buttermilk) or weight gain (with jaggery).",
    highlights: [
      "Grains, millets, seeds & nuts in one malt",
      "Supports PCOS, thyroid, BP & sugar balance",
      "Rich in calcium, iron, protein & fibre",
      "For the whole family — above 1 year",
    ],
    category: existing.category?.id || existing.category,
    coverImage: existing.coverImage ?? null,
    images: existing.images || [],
    quantities: existing.quantities || [],
    price: existing.price,
    stock: existing.stock,
    maxQuantityPerOrder: existing.maxQuantityPerOrder,
    benefits: BENEFITS.map((item, sortOrder) => ({ ...item, sortOrder })),
    specifications: SPECIFICATIONS.map((item, sortOrder) => ({
      ...item,
      sortOrder,
    })),
    isActive: existing.isActive ?? true,
  };

  const updated = await api(`/admin/products/${id}`, {
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
