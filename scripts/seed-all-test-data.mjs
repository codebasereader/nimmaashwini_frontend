/**
 * Comprehensive seed for GSTR-1, expenses/GST POS, and Customer Data testing.
 * Covers July 2026 (previous month) + August 2026 (current), multi-state,
 * repeat customers (same phone), phone format variants, and IGST vs CGST+SGST.
 *
 * Usage:
 *   node scripts/seed-all-test-data.mjs --token 'JWT...'
 *   node scripts/seed-all-test-data.mjs --email YOU@example.com --password 'YOUR_PASS'
 */

import { API_URL } from "../config.js";

const BASE = API_URL.replace(/\/$/, "");

function round2(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

function isIntraState(state, gstin = "") {
  const raw = String(state || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
  if (raw === "karnataka" || raw === "ka" || raw === "29") return true;
  const code = String(gstin || "").trim().slice(0, 2);
  if (/^\d{2}$/.test(code)) return code === "29";
  return !raw;
}

function splitGst(taxAmount, taxRate, { state, gstin } = {}) {
  const totalTax = round2(taxAmount);
  const rate = Number(taxRate) || 0;
  if (isIntraState(state, gstin)) {
    const half = round2(rate / 2);
    const cgstAmount = round2(totalTax / 2);
    return {
      taxType: "cgst_sgst",
      cgstRate: half,
      sgstRate: half,
      igstRate: 0,
      cgstAmount,
      sgstAmount: round2(totalTax - cgstAmount),
      igstAmount: 0,
    };
  }
  return {
    taxType: "igst",
    cgstRate: 0,
    sgstRate: 0,
    igstRate: rate,
    cgstAmount: 0,
    sgstAmount: 0,
    igstAmount: totalTax,
  };
}

function inclusiveBreakdown(inclusiveAmount, taxRate, place) {
  const total = round2(inclusiveAmount);
  const rate = Number(taxRate) || 0;
  const taxable = rate > 0 ? round2(total / (1 + rate / 100)) : total;
  const taxAmount = round2(total - taxable);
  return { taxable, taxAmount, taxRate: rate, total, ...splitGst(taxAmount, rate, place) };
}

function exclusiveBreakdown(taxableAmount, taxRate, place) {
  const taxable = round2(taxableAmount);
  const rate = Number(taxRate) || 0;
  const taxAmount = round2(taxable * (rate / 100));
  return {
    taxableAmount: taxable,
    netAmount: taxable,
    taxAmount,
    totalAmount: round2(taxable + taxAmount),
    taxPercent: rate,
    taxRate: rate,
    ...splitGst(taxAmount, rate, place),
  };
}

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
  const headers = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path.startsWith("/") ? path : `/${path}`}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  let payload = null;
  try {
    payload = await res.json();
  } catch {
    payload = { success: false, message: "Invalid JSON" };
  }
  if (!res.ok || payload.success === false) {
    const err = new Error(payload.message || `HTTP ${res.status}`);
    err.status = res.status;
    err.errors = payload.errors;
    err.payload = payload;
    throw err;
  }
  return payload.data;
}

function entityId(entity) {
  return entity?.id || entity?._id || entity?.vendorId || null;
}

const PRODUCTS = [
  {
    productId: "6a475c66b203bc97e100aaa1",
    slug: "herbal-hair-oil",
    name: "Herbal Hair Oil",
    variantId: "250ml",
    variantLabel: "250 ml",
    unitPrice: 750,
  },
  {
    productId: "6a47552f736b4338f396dd25",
    slug: "multigrain-malt-powder",
    name: "Multigrain Malt Powder",
    variantId: "500g",
    variantLabel: "500 g",
    unitPrice: 450,
  },
  {
    productId: "6a47552f736b4338f396dd25",
    slug: "multigrain-malt-powder",
    name: "Multigrain Malt Powder",
    variantId: "1kg",
    variantLabel: "1 kg",
    unitPrice: 850,
  },
];

/** Shared people — same phone reused across months to exercise Customer CRM. */
const PEOPLE = {
  // Repeat KA customer (3+ orders, name change on last)
  priya: {
    basePhone: "9876511001",
    address: {
      address: "42, Temple Road, Jayanagar",
      pincode: "560041",
      city: "Bengaluru",
      state: "Karnataka",
      country: "India",
    },
  },
  // Repeat MH customer
  amit: {
    basePhone: "9876511002",
    address: {
      address: "12, Linking Road, Bandra",
      pincode: "400050",
      city: "Mumbai",
      state: "Maharashtra",
      country: "India",
    },
  },
  ravi: {
    basePhone: "9876511003",
    address: {
      address: "18, MG Road",
      pincode: "560001",
      city: "Bengaluru",
      state: "Karnataka",
      country: "India",
    },
  },
  divya: {
    basePhone: "9876511004",
    address: {
      address: "7, Anna Salai",
      pincode: "600002",
      city: "Chennai",
      state: "Tamil Nadu",
      country: "India",
    },
  },
  neha: {
    basePhone: "9876511005",
    address: {
      address: "22, Connaught Place",
      pincode: "110001",
      city: "New Delhi",
      state: "Delhi",
      country: "India",
    },
  },
  karan: {
    basePhone: "9876511006",
    address: {
      address: "5, CG Road",
      pincode: "380009",
      city: "Ahmedabad",
      state: "Gujarat",
      country: "India",
    },
  },
  sneha: {
    basePhone: "9876511007",
    address: {
      address: "3, Baner Road",
      pincode: "411045",
      city: "Pune",
      state: "Maharashtra",
      country: "India",
    },
  },
  arjun: {
    basePhone: "9876511008",
    address: {
      address: "11, Sector 18",
      pincode: "201301",
      city: "Noida",
      state: "Uttar Pradesh",
      country: "India",
    },
  },
  meera: {
    basePhone: "9876511009",
    address: {
      address: "9, Park Street",
      pincode: "700016",
      city: "Kolkata",
      state: "West Bengal",
      country: "India",
    },
  },
  vikram: {
    basePhone: "9876511010",
    address: {
      address: "14, Banjara Hills",
      pincode: "500034",
      city: "Hyderabad",
      state: "Telangana",
      country: "India",
    },
  },
};

function person(key, { name, phoneFormat = "plain" } = {}) {
  const p = PEOPLE[key];
  let contactNumber = p.basePhone;
  if (phoneFormat === "plus91") contactNumber = `+91 ${p.basePhone.slice(0, 5)} ${p.basePhone.slice(5)}`;
  if (phoneFormat === "zero") contactNumber = `0${p.basePhone}`;
  if (phoneFormat === "91prefix") contactNumber = `91${p.basePhone}`;
  return {
    name,
    contactNumber,
    ...p.address,
  };
}

/**
 * orderDate + person + products for July & August coverage.
 * Includes repeat phones for Customer Data testing.
 */
const ORDER_SCENARIOS = [
  // ——— July 2026 (previous month) ———
  {
    label: "JUL-KA-PRIYA-1",
    orderDate: "2026-07-05",
    customer: person("priya", { name: "Priya Sharma" }),
    lines: [{ productIndex: 0, quantity: 1 }],
  },
  {
    label: "JUL-KA-PRIYA-2",
    orderDate: "2026-07-18",
    customer: person("priya", { name: "Priya Sharma", phoneFormat: "plus91" }),
    lines: [
      { productIndex: 0, quantity: 1 },
      { productIndex: 1, quantity: 1 },
    ],
  },
  {
    label: "JUL-MH-AMIT-1",
    orderDate: "2026-07-08",
    customer: person("amit", { name: "Amit Verma" }),
    lines: [{ productIndex: 0, quantity: 2 }],
  },
  {
    label: "JUL-TN-DIVYA",
    orderDate: "2026-07-12",
    customer: person("divya", { name: "Divya Krishnan" }),
    lines: [{ productIndex: 1, quantity: 2 }],
  },
  {
    label: "JUL-DL-NEHA",
    orderDate: "2026-07-15",
    customer: person("neha", { name: "Neha Kapoor" }),
    lines: [{ productIndex: 2, quantity: 1 }],
  },
  {
    label: "JUL-GJ-KARAN",
    orderDate: "2026-07-20",
    customer: person("karan", { name: "Karan Patel" }),
    lines: [{ productIndex: 0, quantity: 1 }],
  },
  {
    label: "JUL-KA-RAVI",
    orderDate: "2026-07-22",
    customer: person("ravi", { name: "Ravi Gowda" }),
    lines: [{ productIndex: 1, quantity: 3 }],
  },
  {
    label: "JUL-MH-SNEHA",
    orderDate: "2026-07-25",
    customer: person("sneha", { name: "Sneha Joshi" }),
    lines: [
      { productIndex: 0, quantity: 1 },
      { productIndex: 1, quantity: 1 },
    ],
  },
  {
    label: "JUL-UP-ARJUN",
    orderDate: "2026-07-28",
    customer: person("arjun", { name: "Arjun Singh" }),
    lines: [{ productIndex: 0, quantity: 2 }],
  },
  {
    label: "JUL-WB-MEERA",
    orderDate: "2026-07-30",
    customer: person("meera", { name: "Meera Banerjee" }),
    lines: [{ productIndex: 1, quantity: 2 }],
  },

  // ——— August 2026 (current month) ———
  {
    label: "AUG-KA-PRIYA-3-NAME-CHANGE",
    orderDate: "2026-08-03",
    // Same phone as July Priya, different name → one CRM customer
    customer: person("priya", { name: "Priya S.", phoneFormat: "zero" }),
    lines: [{ productIndex: 0, quantity: 2 }],
  },
  {
    label: "AUG-MH-AMIT-2",
    orderDate: "2026-08-04",
    customer: person("amit", { name: "Amit Verma", phoneFormat: "91prefix" }),
    lines: [{ productIndex: 2, quantity: 1 }],
  },
  {
    label: "AUG-KA-RAVI-2",
    orderDate: "2026-08-05",
    customer: person("ravi", { name: "Ravi Gowda" }),
    lines: [
      { productIndex: 0, quantity: 1 },
      { productIndex: 1, quantity: 2 },
    ],
  },
  {
    label: "AUG-TN-DIVYA-2",
    orderDate: "2026-08-06",
    customer: person("divya", { name: "Divya Krishnan" }),
    lines: [{ productIndex: 0, quantity: 1 }],
  },
  {
    label: "AUG-DL-NEHA-2",
    orderDate: "2026-08-07",
    customer: person("neha", { name: "Neha Kapoor" }),
    lines: [
      { productIndex: 0, quantity: 1 },
      { productIndex: 1, quantity: 1 },
    ],
  },
  {
    label: "AUG-GJ-KARAN-2",
    orderDate: "2026-08-08",
    customer: person("karan", { name: "Karan Patel" }),
    lines: [{ productIndex: 0, quantity: 3 }],
  },
  {
    label: "AUG-TS-VIKRAM",
    orderDate: "2026-08-08",
    customer: person("vikram", { name: "Vikram Reddy" }),
    lines: [{ productIndex: 1, quantity: 2 }],
  },
  {
    label: "AUG-MH-SNEHA-2",
    orderDate: "2026-08-09",
    customer: person("sneha", { name: "Sneha Joshi" }),
    lines: [{ productIndex: 0, quantity: 2 }],
  },
  {
    label: "AUG-UP-ARJUN-2",
    orderDate: "2026-08-09",
    customer: person("arjun", { name: "Arjun Singh" }),
    lines: [{ productIndex: 2, quantity: 1 }],
  },
  {
    label: "AUG-WB-MEERA-2",
    orderDate: "2026-08-10",
    customer: person("meera", { name: "Meera Banerjee" }),
    lines: [
      { productIndex: 0, quantity: 1 },
      { productIndex: 2, quantity: 1 },
    ],
  },
  {
    label: "AUG-KA-ONEOFF",
    orderDate: "2026-08-10",
    customer: {
      name: "One-off Walkin",
      contactNumber: "+91 9876511999",
      address: "Walk-in counter",
      pincode: "560001",
      city: "Bengaluru",
      state: "Karnataka",
      country: "India",
    },
    lines: [{ productIndex: 1, quantity: 1 }],
  },
];

const VENDOR_SCENARIOS = [
  {
    key: "ka",
    name: "FullSeed Vendor KA Supplies",
    phone: "+91 9800011001",
    email: "fullseed-ka@example.com",
    company: "KA Supplies Pvt Ltd",
    gstin: "29AAAAA0000A1Z5",
    billingAddress: {
      line1: "100 Industrial Area",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560058",
      country: "India",
    },
    tags: ["full-seed", "intra"],
  },
  {
    key: "mh",
    name: "FullSeed Vendor MH Traders",
    phone: "+91 9800011002",
    email: "fullseed-mh@example.com",
    company: "MH Traders LLP",
    gstin: "27BBBBB1111B1Z5",
    billingAddress: {
      line1: "44 Andheri East",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400069",
      country: "India",
    },
    tags: ["full-seed", "inter"],
  },
  {
    key: "tn",
    name: "FullSeed Vendor TN Packers",
    phone: "+91 9800011003",
    email: "fullseed-tn@example.com",
    company: "TN Packers",
    gstin: "33CCCCC2222C1Z5",
    billingAddress: {
      line1: "9 Guindy Industrial Estate",
      city: "Chennai",
      state: "Tamil Nadu",
      pincode: "600032",
      country: "India",
    },
    tags: ["full-seed", "inter"],
  },
  {
    key: "dl",
    name: "FullSeed Vendor DL Logistics",
    phone: "+91 9800011004",
    email: "fullseed-dl@example.com",
    company: "DL Logistics",
    gstin: "07DDDDD3333D1Z5",
    billingAddress: {
      line1: "Okhla Phase 2",
      city: "New Delhi",
      state: "Delhi",
      pincode: "110020",
      country: "India",
    },
    tags: ["full-seed", "inter"],
  },
];

const EXPENSE_PLANS = [
  // July
  { key: "ka", expenseDate: "2026-07-06", taxable: 2500, taxPercent: 18 },
  { key: "ka", expenseDate: "2026-07-14", taxable: 1200, taxPercent: 5 },
  { key: "mh", expenseDate: "2026-07-16", taxable: 3000, taxPercent: 18 },
  { key: "tn", expenseDate: "2026-07-22", taxable: 900, taxPercent: 5 },
  { key: "dl", expenseDate: "2026-07-28", taxable: 1800, taxPercent: 18 },
  // August
  { key: "ka", expenseDate: "2026-08-02", taxable: 1000, taxPercent: 18 },
  { key: "ka", expenseDate: "2026-08-05", taxable: 2000, taxPercent: 5 },
  { key: "mh", expenseDate: "2026-08-06", taxable: 1500, taxPercent: 18 },
  { key: "tn", expenseDate: "2026-08-07", taxable: 800, taxPercent: 5 },
  { key: "dl", expenseDate: "2026-08-09", taxable: 2200, taxPercent: 18 },
  { key: "mh", expenseDate: "2026-08-10", taxable: 500, taxPercent: 5 },
];

function buildOrderPayload(scenario) {
  const place = { state: scenario.customer.state };
  const items = scenario.lines.map((line) => {
    const product = PRODUCTS[line.productIndex];
    const quantity = line.quantity;
    const unitPrice = product.unitPrice;
    const lineTotal = round2(unitPrice * quantity);
    const gst = inclusiveBreakdown(lineTotal, 5, place);
    return {
      productId: product.productId,
      slug: product.slug,
      name: product.name,
      variantId: product.variantId,
      variantLabel: product.variantLabel,
      quantity,
      unitPrice,
      taxRate: 5,
      taxType: gst.taxType,
      taxable: gst.taxable,
      taxAmount: gst.taxAmount,
      cgstRate: gst.cgstRate,
      sgstRate: gst.sgstRate,
      igstRate: gst.igstRate,
      cgstAmount: gst.cgstAmount,
      sgstAmount: gst.sgstAmount,
      igstAmount: gst.igstAmount,
      lineTotal,
    };
  });

  const sum = (key) => round2(items.reduce((s, i) => s + (Number(i[key]) || 0), 0));
  const taxType = items[0]?.taxType || "cgst_sgst";

  return {
    orderDate: scenario.orderDate,
    customer: scenario.customer,
    items,
    taxableAmount: sum("taxable"),
    taxAmount: sum("taxAmount"),
    taxType,
    cgstAmount: sum("cgstAmount"),
    sgstAmount: sum("sgstAmount"),
    igstAmount: sum("igstAmount"),
    cgstRate: items[0]?.cgstRate ?? 0,
    sgstRate: items[0]?.sgstRate ?? 0,
    igstRate: items[0]?.igstRate ?? 0,
    taxRate: 5,
    subtotal: sum("lineTotal"),
    totalAmount: sum("lineTotal"),
    currency: "INR",
    orderType: "domestic",
    status: "completed",
    paymentStatus: "COMPLETED",
    manual_entry: true,
    notes: `FullSeed · ${scenario.label}`,
  };
}

function buildExpensePayload({ vendor, category, expenseDate, serial, taxable, taxPercent }) {
  const place = {
    state: vendor.billingAddress?.state,
    gstin: vendor.gstin,
  };
  const line = {
    itemName: `FullSeed purchase ${taxPercent}%`,
    categoryId: entityId(category),
    categorySnapshot: { id: entityId(category), name: category.name },
    ...exclusiveBreakdown(taxable, taxPercent, place),
  };

  return {
    amount: line.totalAmount,
    currency: "INR",
    expenseDate,
    notes: `FullSeed expense · ${vendor.name} · ${place.state}`,
    withTax: true,
    isTaxable: true,
    vendorId: entityId(vendor),
    vendorSnapshot: {
      id: entityId(vendor),
      name: vendor.name,
      gstin: vendor.gstin,
      state: vendor.billingAddress?.state,
    },
    amountType: "taxable",
    supplierInvoiceDate: expenseDate,
    supplierInvoiceSerialNo: serial,
    invoiceId: serial,
    items: [line],
    taxableAmount: line.taxableAmount,
    netAmount: line.taxableAmount,
    taxAmount: line.taxAmount,
    taxType: line.taxType,
    cgstAmount: line.cgstAmount,
    sgstAmount: line.sgstAmount,
    igstAmount: line.igstAmount,
    cgstRate: line.cgstRate,
    sgstRate: line.sgstRate,
    igstRate: line.igstRate,
    totalAmount: line.totalAmount,
    reverseCharge: false,
    reverseChargeMechanism: false,
    tdsApplicable: false,
    isPaid: true,
    paymentDate: expenseDate,
    paymentType: "UPI",
    payment: {
      paymentDate: expenseDate,
      paymentType: "UPI",
      bankDetails: "FullSeed UTR",
      transactionDetails: "FullSeed UTR",
    },
  };
}

async function ensureCategory(token) {
  const list = await api("/admin/expense-categories?limit=100&search=FullSeed", { token });
  const items = Array.isArray(list) ? list : list?.items || [];
  const existing = items.find((c) => c.name === "FullSeed Purchases");
  if (existing) return existing;
  return api("/admin/expense-categories", {
    method: "POST",
    token,
    body: {
      name: "FullSeed Purchases",
      description: "Auto-seeded for multi-month GST / expense testing",
      isActive: true,
    },
  });
}

async function ensureVendor(token, scenario) {
  const list = await api(`/admin/vendors?limit=50&search=${encodeURIComponent(scenario.name)}`, {
    token,
  });
  const items = Array.isArray(list) ? list : list?.items || [];
  const existing = items.find((v) => v.name === scenario.name);
  if (existing) return existing;
  return api("/admin/vendors", {
    method: "POST",
    token,
    body: scenario,
  });
}

function summarizeGstr1(label, data) {
  const states = [...new Set((data.items || []).map((i) => i.placeOfSupply).filter(Boolean))];
  return {
    label,
    itemCount: data.items?.length ?? 0,
    summary: data.summary,
    states,
    sampleOrders: (data.items || []).slice(0, 3).map((i) => ({
      orderNumber: i.orderNumber,
      placeOfSupply: i.placeOfSupply,
      invoiceValue: i.invoiceValue,
      cgst: i.cgstAmount,
      sgst: i.sgstAmount,
      igst: i.igstAmount,
    })),
  };
}

async function main() {
  const args = parseArgs(process.argv);
  const email = args.email || process.env.ASHWINI_ADMIN_EMAIL;
  const password = args.password || process.env.ASHWINI_ADMIN_PASSWORD;
  let token = args.token || process.env.ASHWINI_TOKEN;

  console.log(`API: ${BASE}`);

  if (!token) {
    if (!email || !password) {
      console.error("Provide --email/--password or --token");
      process.exit(1);
    }
    const auth = await api("/auth/login", {
      method: "POST",
      body: { email, password },
    });
    token = auth.token;
    console.log(`Logged in as ${auth.user?.email || email}`);
  } else {
    console.log("Using provided token");
  }

  const stamp = Date.now().toString().slice(-6);
  const results = {
    vendors: [],
    expenses: [],
    orders: [],
    gstr1: {},
    customers: {},
    expenseList: {},
  };

  console.log("\n=== Vendors (KA + inter-state) ===");
  const vendorsByKey = {};
  for (const scenario of VENDOR_SCENARIOS) {
    const vendor = await ensureVendor(token, scenario);
    vendorsByKey[scenario.key] = {
      ...vendor,
      billingAddress: vendor.billingAddress || scenario.billingAddress,
      gstin: vendor.gstin || scenario.gstin,
    };
    results.vendors.push({
      id: entityId(vendor),
      name: scenario.name,
      state: scenario.billingAddress.state,
    });
    console.log(
      `  ✓ ${scenario.name} · ${scenario.billingAddress.state} · ${isIntraState(scenario.billingAddress.state, scenario.gstin) ? "CGST+SGST" : "IGST"}`,
    );
  }

  console.log("\n=== Expense category ===");
  const category = await ensureCategory(token);
  console.log(`  ✓ ${category.name}`);

  console.log("\n=== Expenses (July + August) ===");
  for (const plan of EXPENSE_PLANS) {
    const vendor = vendorsByKey[plan.key];
    const payload = buildExpensePayload({
      vendor,
      category,
      expenseDate: plan.expenseDate,
      serial: `FS-${plan.key.toUpperCase()}-${stamp}-${plan.expenseDate.replace(/-/g, "")}-${plan.taxPercent}`,
      taxable: plan.taxable,
      taxPercent: plan.taxPercent,
    });
    const created = await api("/admin/expenses", { method: "POST", token, body: payload });
    results.expenses.push({
      id: entityId(created),
      date: plan.expenseDate,
      state: payload.vendorSnapshot.state,
      taxType: payload.taxType,
      totalAmount: payload.totalAmount,
    });
    console.log(
      `  ✓ ${plan.expenseDate} · ${payload.vendorSnapshot.state} · ${payload.taxType} · ₹${payload.totalAmount}`,
    );
  }

  console.log(`\n=== Orders (${ORDER_SCENARIOS.length} across July + August) ===`);
  for (const scenario of ORDER_SCENARIOS) {
    const payload = buildOrderPayload(scenario);
    const created = await api("/admin/orders", { method: "POST", token, body: payload });
    results.orders.push({
      id: entityId(created),
      orderNumber: created.orderNumber,
      label: scenario.label,
      orderDate: scenario.orderDate,
      phone: scenario.customer.contactNumber,
      name: scenario.customer.name,
      state: scenario.customer.state,
      taxType: payload.taxType,
      totalAmount: payload.totalAmount,
    });
    console.log(
      `  ✓ ${created.orderNumber || "?"} · ${scenario.orderDate} · ${scenario.customer.state} · ${payload.taxType} · ${scenario.customer.name} · ₹${payload.totalAmount}`,
    );
  }

  // ——— Verification ———
  const ranges = [
    ["july", "2026-07-01", "2026-07-31"],
    ["august", "2026-08-01", "2026-08-10"],
    ["both", "2026-07-01", "2026-08-10"],
  ];

  console.log("\n=== GSTR-1 verification ===");
  for (const [key, from, to] of ranges) {
    results.gstr1[key] = {};
    for (const [report, path] of [
      ["consolidated", `/admin/gstr1/consolidated?fromDate=${from}&toDate=${to}&all=true`],
      ["b2cs", `/admin/gstr1/b2cs?fromDate=${from}&toDate=${to}&all=true`],
      ["hsn", `/admin/gstr1/hsn-summary?fromDate=${from}&toDate=${to}&all=true`],
    ]) {
      try {
        const data = await api(path, { token });
        if (report === "consolidated") {
          results.gstr1[key].consolidated = summarizeGstr1(`${key} consolidated`, data);
        } else {
          results.gstr1[key][report] = {
            itemCount: data.items?.length ?? 0,
            summary: data.summary,
            sample: (data.items || []).slice(0, 5),
          };
        }
        console.log(
          `  ✓ ${key}/${report}: ${data.items?.length ?? 0} rows · orders=${data.summary?.totalOrders ?? "?"} · taxable=${data.summary?.totalTaxableValue ?? "?"}`,
        );
      } catch (err) {
        results.gstr1[key][report] = { error: err.message, status: err.status };
        console.log(`  ✗ ${key}/${report}: ${err.message} (HTTP ${err.status || "?"})`);
      }
    }
  }

  console.log("\n=== Expenses list (July + August filter) ===");
  try {
    const july = await api("/admin/expenses?fromDate=2026-07-01&toDate=2026-07-31&limit=50", {
      token,
    });
    const aug = await api("/admin/expenses?fromDate=2026-08-01&toDate=2026-08-10&limit=50", {
      token,
    });
    results.expenseList = {
      julyCount: (Array.isArray(july) ? july : july?.items || []).length,
      augustCount: (Array.isArray(aug) ? aug : aug?.items || []).length,
    };
    console.log(
      `  ✓ July expenses listed: ${results.expenseList.julyCount} · August: ${results.expenseList.augustCount}`,
    );
  } catch (err) {
    results.expenseList = { error: err.message };
    console.log(`  ✗ expenses list: ${err.message}`);
  }

  console.log("\n=== Customer Data API ===");
  try {
    const backfill = await api("/admin/customers/backfill", { method: "POST", token });
    results.customers.backfill = backfill;
    console.log(
      `  ✓ backfill: processed=${backfill?.ordersProcessed ?? "?"} created=${backfill?.customersCreated ?? "?"} linked=${backfill?.ordersLinked ?? "?"}`,
    );
  } catch (err) {
    results.customers.backfill = { error: err.message, status: err.status };
    console.log(`  ✗ backfill: ${err.message} (HTTP ${err.status || "?"}) — backend may not be ready yet`);
  }

  try {
    const list = await api("/admin/customers?limit=50&search=9876511001", { token });
    const items = list?.items || [];
    results.customers.searchPriya = items.map((c) => ({
      id: entityId(c),
      name: c.name,
      phone: c.phone || c.phoneDisplay,
      orderCount: c.orderCount,
      completedOrderCount: c.completedOrderCount,
      totalSpent: c.totalSpent,
    }));
    console.log(
      `  ✓ search Priya phone → ${items.length} customer(s)`,
      items[0]
        ? `· name=${items[0].name} · orders=${items[0].orderCount} · spent=${items[0].totalSpent}`
        : "",
    );
    if (items[0]) {
      const detail = await api(`/admin/customers/${entityId(items[0])}`, { token });
      results.customers.priyaDetail = {
        name: detail.name,
        phone: detail.phone,
        orderCount: detail.orderCount,
        orders: (detail.orders || []).map((o) => o.orderNumber),
        products: detail.products,
      };
      console.log(
        `  ✓ Priya detail: ${detail.orderCount} orders · ${(detail.products || []).length} products · invoices=${(detail.orders || []).map((o) => o.orderNumber).join(", ")}`,
      );
    }
  } catch (err) {
    results.customers.list = { error: err.message, status: err.status };
    console.log(`  ✗ customers list/detail: ${err.message} (HTTP ${err.status || "?"})`);
  }

  // Expected repeat phones for manual CRM checks once API is live
  const phoneOrderCounts = {};
  for (const o of results.orders) {
    const digits = String(o.phone).replace(/\D/g, "");
    const phone = digits.length > 10 ? digits.slice(-10) : digits;
    phoneOrderCounts[phone] = (phoneOrderCounts[phone] || 0) + 1;
  }
  results.customers.expectedByPhone = phoneOrderCounts;

  console.log("\n=== Expected customer order counts (by normalized phone) ===");
  for (const [phone, count] of Object.entries(phoneOrderCounts).sort(
    (a, b) => b[1] - a[1],
  )) {
    console.log(`  ${phone}: ${count} order(s)`);
  }

  console.log("\n=== DONE — compact summary ===");
  console.log(
    JSON.stringify(
      {
        seeded: {
          vendors: results.vendors.length,
          expenses: results.expenses.length,
          orders: results.orders.length,
        },
        gstr1: {
          julyOrders: results.gstr1.july?.consolidated?.summary?.totalOrders,
          augustOrders: results.gstr1.august?.consolidated?.summary?.totalOrders,
          bothOrders: results.gstr1.both?.consolidated?.summary?.totalOrders,
          julyStates: results.gstr1.july?.consolidated?.states,
          augustStates: results.gstr1.august?.consolidated?.states,
        },
        customers: results.customers,
        expenseList: results.expenseList,
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error("\nSeed failed:", err.message);
  if (err.errors) console.error(JSON.stringify(err.errors, null, 2));
  if (err.payload) console.error(JSON.stringify(err.payload, null, 2));
  process.exit(1);
});
