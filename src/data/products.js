export const PRODUCTS = [
  {
    id: "herbal-hair-oil",
    slug: "herbal-hair-oil",
    name: "Herbal Hair Oil",
    price: 349,
    priceDisplay: "₹349",
    tagline: "Nourish roots. Strengthen strands. Naturally.",
    description:
      "A slow-infused blend of bhringraj, amla, coconut, and temple-grade herbs — prepared in small batches the way our grandmothers did. Lightweight enough for daily use, rich enough to revive tired, thinning hair.",
    images: ["/hairoil/o1.webp", "/hairoil/o2.webp", "/hairoil/o3.webp"],
    variants: [
      { id: "100ml", label: "100 ml", price: 349, priceDisplay: "₹349" },
      { id: "200ml", label: "200 ml", price: 549, priceDisplay: "₹549" },
    ],
    highlights: [
      "Cold-pressed coconut & sesame base",
      "No mineral oil or artificial fragrance",
      "Suitable for all hair types",
    ],
    whoCanConsume:
      "Adults and children with dry, damaged, or thinning hair. Suitable for men and women of all hair textures — straight, wavy, curly, or coily.",
    ageFactors:
      "Safe for ages 5 and above when used under adult guidance. Ideal for adults and teens seeking Natural hair nourishment.",
    benefits: [
      {
        title: "Strengthens Roots",
        description:
          "Bhringraj and amla help reduce hair fall and support stronger roots from within.",
      },
      {
        title: "Deep Nourishment",
        description:
          "Cold-pressed oils penetrate the scalp to revive dry, brittle, and lifeless strands.",
      },
      {
        title: "Scalp Wellness",
        description:
          "Herbal infusion soothes the scalp and helps maintain a healthy, balanced environment.",
      },
      {
        title: "Natural Shine",
        description:
          "Regular use restores natural lustre without synthetic coatings or heavy residue.",
      },
    ],
    purityPledge: {
      noChemical: "No harmful chemicals or mineral oils",
      noAddedSugar: "No added sugar",
      noPreservatives: "No artificial preservatives",
    },
    specifications: [
      { label: "Net Volume", value: "100 ml / 200 ml" },
      { label: "Key Herbs", value: "Bhringraj, Amla, Brahmi, Hibiscus" },
      { label: "Base Oils", value: "Coconut, Sesame" },
      { label: "Shelf Life", value: "18 months from manufacture" },
      { label: "Usage", value: "2–3 times per week, warm massage" },
      { label: "Certification", value: "Cruelty-free, paraben-free" },
    ],
    faqs: [
      {
        question: "How often should I use the hair oil?",
        answer:
          "For best results, massage into scalp and hair 2–3 times a week. Leave on for at least 45 minutes before washing, or overnight for deeper nourishment.",
      },
      {
        question: "Will it make my hair greasy?",
        answer:
          "Our formula is lightweight and absorbs well when used in the recommended amount. Start with a few drops and adjust based on your hair length and texture.",
      },
      {
        question: "Is it safe for coloured or treated hair?",
        answer:
          "Yes. The oil is free from harsh chemicals and works gently on colour-treated and chemically processed hair.",
      },
    ],
    reviews: [
      {
        name: "Lakshmi D.",
        location: "Mysuru",
        rating: 5,
        text: "Hair fall reduced within a month. The herbal scent is calming, not overpowering.",
      },
      {
        name: "Priya N.",
        location: "Bengaluru",
        rating: 5,
        text: "Finally an oil that doesn't feel sticky. My scalp feels healthier.",
      },
      {
        name: "Meera K.",
        location: "Belagavi",
        rating: 5,
        text: "Visible shine after the third wash. Worth every rupee.",
      },
    ],
  },
  {
    id: "ragi-malt-powder",
    slug: "ragi-malt-powder",
    name: "Ragi Malt Powder",
    price: 299,
    priceDisplay: "₹299",
    tagline: "Wholesome mornings, rooted in tradition.",
    description:
      "Stone-ground finger millet malt with cardamom and jaggery notes — a nourishing drink that fuels your day without artificial sweeteners or preservatives. Perfect for children and adults alike.",
    images: ["/ragimalt/r1.webp", "/ragimalt/r2.webp", "/ragimalt/r3.webp"],
    variants: [
      { id: "250g", label: "250 g", price: 299, priceDisplay: "₹299" },
      { id: "500g", label: "500 g", price: 499, priceDisplay: "₹499" },
    ],
    highlights: [
      "100% natural finger millet (ragi)",
      "No refined sugar or preservatives",
      "Rich in calcium & dietary fibre",
    ],
    whoCanConsume:
      "Children, adults, elderly, and anyone seeking a wholesome natural drink. Perfect for busy mornings, growing kids, and health-conscious families.",
    ageFactors:
      "Gentle enough from 1 year onward when prepared with milk. Especially beneficial for school-age children, teens, and adults needing sustained energy.",
    benefits: [
      {
        title: "Rich in Calcium",
        description:
          "Finger millet naturally supports bone health and growth — a traditional staple for growing children.",
      },
      {
        title: "Sustained Energy",
        description:
          "Complex carbohydrates provide steady fuel through the morning without artificial stimulants.",
      },
      {
        title: "Easy Digestion",
        description:
          "Light, malted preparation is gentle on the stomach and easy to absorb.",
      },
      {
        title: "Wholesome Nutrition",
        description:
          "Packed with dietary fibre, iron, and essential minerals from pure ragi.",
      },
    ],
    purityPledge: {
      noChemical: "No harmful chemicals",
      noAddedSugar: "No added sugar",
      noPreservatives: "No artificial preservatives",
    },
    specifications: [
      { label: "Net Weight", value: "250 g / 500 g" },
      { label: "Ingredients", value: "Ragi, Cardamom, Natural sweeteners" },
      { label: "Preparation", value: "Mix with warm milk or water" },
      { label: "Shelf Life", value: "12 months in airtight container" },
      { label: "Storage", value: "Cool, dry place away from sunlight" },
      { label: "Allergens", value: "May contain traces of nuts" },
    ],
    faqs: [
      {
        question: "How do I prepare ragi malt?",
        answer:
          "Add 2 tablespoons to a cup of warm milk or water, stir well, and sweeten to taste if needed. Can also be blended into smoothies or porridge.",
      },
      {
        question: "Is it suitable for children?",
        answer:
          "Yes, it is a traditional weaning food in South India and is gentle enough for children above 1 year when prepared with milk.",
      },
      {
        question: "Does it contain added sugar?",
        answer:
          "No refined sugar. Any sweetness comes from natural ingredients in the blend.",
      },
    ],
    reviews: [
      {
        name: "Shwetha B.",
        location: "Mangaluru",
        rating: 5,
        text: "Keeps me full till lunch. My kids love it with warm milk.",
      },
      {
        name: "Sowmya H.",
        location: "Hubballi",
        rating: 5,
        text: "Earthy, honest taste — like homemade malt powder.",
      },
      {
        name: "Aparna J.",
        location: "Bengaluru",
        rating: 5,
        text: "Third reorder. A staple in our morning routine now.",
      },
    ],
  },
  {
    id: "herbal-shampoo",
    slug: "herbal-shampoo",
    name: "Herbal Shampoo",
    price: 279,
    priceDisplay: "₹279",
    tagline: "Cleanse gently. Balance naturally.",
    description:
      "A sulphate-free shampoo infused with shikakai, reetha, and aloe — cleansing without stripping your scalp's natural oils. Leaves hair soft, manageable, and lightly scented with herbs.",
    images: [
      "/hairshampoo/s1.webp",
      "/hairshampoo/s2.webp",
      "/hairshampoo/s3.webp",
    ],
    variants: [
      { id: "200ml", label: "200 ml", price: 279, priceDisplay: "₹279" },
      { id: "400ml", label: "400 ml", price: 449, priceDisplay: "₹449" },
    ],
    highlights: [
      "Sulphate & paraben free",
      "pH-balanced herbal formula",
      "Safe for daily use",
    ],
    whoCanConsume:
      "Men, women, and children with all hair types — oily, dry, normal, or combination scalp. Safe for the whole family.",
    ageFactors:
      "Gentle enough for ages 3 and above. Suitable for daily use by teens and adults; ideal for children when used in small amounts.",
    benefits: [
      {
        title: "Gentle Cleansing",
        description:
          "Shikakai and reetha cleanse without stripping the scalp's natural protective oils.",
      },
      {
        title: "Scalp Balance",
        description:
          "pH-balanced herbs help regulate oil production and reduce itchiness or flakiness.",
      },
      {
        title: "Soft, Manageable Hair",
        description:
          "Aloe and neem leave hair smooth, detangled, and naturally fragrant.",
      },
      {
        title: "Colour-Safe Care",
        description:
          "Mild formula protects treated or coloured hair while keeping strands healthy.",
      },
    ],
    purityPledge: {
      noChemical: "No sulphates, parabens, or harsh chemicals",
      noAddedSugar: "No added sugar",
      noPreservatives: "No artificial preservatives",
    },
    specifications: [
      { label: "Net Volume", value: "200 ml / 400 ml" },
      { label: "Key Herbs", value: "Shikakai, Reetha, Aloe Vera, Neem" },
      { label: "Hair Type", value: "All hair types" },
      { label: "Shelf Life", value: "24 months from manufacture" },
      { label: "Usage", value: "Apply to wet hair, lather, rinse" },
      { label: "Certification", value: "Cruelty-free, vegan-friendly" },
    ],
    faqs: [
      {
        question: "Will it lather like regular shampoo?",
        answer:
          "It produces a gentle, creamy lather without sulphates. Your hair may take a short transition period if switching from chemical shampoos.",
      },
      {
        question: "Can I use it on oily scalp?",
        answer:
          "Yes. The herbal cleansers help balance oil production without over-drying the scalp.",
      },
      {
        question: "Is it safe for colour-treated hair?",
        answer:
          "Absolutely. The mild formula helps preserve colour while keeping hair healthy.",
      },
    ],
    reviews: [
      {
        name: "Ananya R.",
        location: "Bengaluru",
        rating: 5,
        text: "Doesn't strip my curls. Scalp feels calm and clean.",
      },
      {
        name: "Divya S.",
        location: "Shivamogga",
        rating: 5,
        text: "Gentle herbal scent. Hair stays soft for days.",
      },
      {
        name: "Nandini V.",
        location: "Tumakuru",
        rating: 5,
        text: "No sulphates, no regrets. Best switch I've made.",
      },
    ],
  },
];

export function getProductBySlug(slug) {
  return PRODUCTS.find((product) => product.slug === slug) ?? null;
}

export { getProductPath } from "../lib/product";
