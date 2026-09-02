/**
 * Seed multi-state orders + vendors + expenses for GSTR-1 / GST POS testing.
 *
 * Usage:
 *   node scripts/seed-gstr1-test-data.mjs --email YOU@example.com --password 'YOUR_PASS'
 *   node scripts/seed-gstr1-test-data.mjs --token 'JWT...'
 *
 * Env alternatives: ASHWINI_ADMIN_EMAIL, ASHWINI_ADMIN_PASSWORD, ASHWINI_TOKEN
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
  return !raw; // default intra when unknown
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
    else if (a === "--from") out.fromDate = argv[++i];
    else if (a === "--to") out.toDate = argv[++i];
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

function todayISO() {
  return new Date().toISOString().slice(0, 10);
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
];

const ORDER_SCENARIOS = [
  {
    label: "KA-CGST-SGST-1",
    orderDate: "2026-08-04",
    customer: {
      name: "GSTR1 Test Priya (KA)",
      contactNumber: "+91 9876500001",
      address: "42, Temple Road, Jayanagar",
      pincode: "560041",
      city: "Bengaluru",
      state: "Karnataka",
      country: "India",
    },
    lines: [{ productIndex: 0, quantity: 2 }],
  },
  {
    label: "KA-CGST-SGST-2",
    orderDate: "2026-08-05",
    customer: {
      name: "GSTR1 Test Ravi (KA)",
      contactNumber: "+91 9876500002",
      address: "18, MG Road",
      pincode: "560001",
      city: "Bengaluru",
      state: "Karnataka",
      country: "India",
    },
    lines: [
      { productIndex: 0, quantity: 1 },
      { productIndex: 1, quantity: 2 },
    ],
  },
  {
    label: "MH-IGST",
    orderDate: "2026-08-06",
    customer: {
      name: "GSTR1 Test Amit (MH)",
      contactNumber: "+91 9876500003",
      address: "12, Linking Road, Bandra",
      pincode: "400050",
      city: "Mumbai",
      state: "Maharashtra",
      country: "India",
    },
    lines: [{ productIndex: 0, quantity: 2 }],
  },
  {
    label: "TN-IGST",
    orderDate: "2026-08-07",
    customer: {
      name: "GSTR1 Test Divya (TN)",
      contactNumber: "+91 9876500004",
      address: "7, Anna Salai",
      pincode: "600002",
      city: "Chennai",
      state: "Tamil Nadu",
      country: "India",
    },
    lines: [{ productIndex: 1, quantity: 3 }],
  },
  {
    label: "DL-IGST",
    orderDate: "2026-08-08",
    customer: {
      name: "GSTR1 Test Neha (DL)",
      contactNumber: "+91 9876500005",
      address: "22, Connaught Place",
      pincode: "110001",
      city: "New Delhi",
      state: "Delhi",
      country: "India",
    },
    lines: [
      { productIndex: 0, quantity: 1 },
      { productIndex: 1, quantity: 1 },
    ],
  },
  {
    label: "GJ-IGST",
    orderDate: "2026-08-09",
    customer: {
      name: "GSTR1 Test Karan (GJ)",
      contactNumber: "+91 9876500006",
      address: "5, CG Road",
      pincode: "380009",
      city: "Ahmedabad",
      state: "Gujarat",
      country: "India",
    },
    lines: [{ productIndex: 0, quantity: 3 }],
  },
];

const VENDOR_SCENARIOS = [
  {
    key: "ka",
    name: "GSTR1 Seed Vendor KA Supplies",
    phone: "+91 9800000001",
    email: "seed-ka-vendor@example.com",
    company: "KA Supplies Pvt Ltd",
    gstin: "29AAAAA0000A1Z5",
    billingAddress: {
      line1: "100 Industrial Area",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560058",
      country: "India",
    },
    tags: ["gstr1-seed", "intra"],
  },
  {
    key: "mh",
    name: "GSTR1 Seed Vendor MH Traders",
    phone: "+91 9800000002",
    email: "seed-mh-vendor@example.com",
    company: "MH Traders LLP",
    gstin: "27BBBBB1111B1Z5",
    billingAddress: {
      line1: "44 Andheri East",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400069",
      country: "India",
    },
    tags: ["gstr1-seed", "inter"],
  },
  {
    key: "tn",
    name: "GSTR1 Seed Vendor TN Packers",
    phone: "+91 9800000003",
    email: "seed-tn-vendor@example.com",
    company: "TN Packers",
    gstin: "33CCCCC2222C1Z5",
    billingAddress: {
      line1: "9 Guindy Industrial Estate",
      city: "Chennai",
      state: "Tamil Nadu",
      pincode: "600032",
      country: "India",
    },
    tags: ["gstr1-seed", "inter"],
  },
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
    notes: `GSTR1 seed · ${scenario.label}`,
  };
}

function buildExpensePayload({ vendor, category, expenseDate, serial, taxable, taxPercent }) {
  const place = {
    state: vendor.billingAddress?.state,
    gstin: vendor.gstin,
  };
  const line = {
    itemName: `Seed purchase ${taxPercent}%`,
    categoryId: entityId(category),
    categorySnapshot: { id: entityId(category), name: category.name },
    ...exclusiveBreakdown(taxable, taxPercent, place),
  };

  return {
    amount: line.totalAmount,
    currency: "INR",
    expenseDate,
    notes: `GSTR1 seed expense · ${vendor.name} · ${place.state}`,
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
      bankDetails: "GSTR1 seed UTR",
      transactionDetails: "GSTR1 seed UTR",
    },
  };
}

async function ensureCategory(token) {
  const list = await api("/admin/expense-categories?limit=100&search=GSTR1", { token });
  const items = Array.isArray(list) ? list : list?.items || [];
  const existing = items.find((c) => c.name === "GSTR1 Seed Purchases");
  if (existing) return existing;
  return api("/admin/expense-categories", {
    method: "POST",
    token,
    body: {
      name: "GSTR1 Seed Purchases",
      description: "Auto-seeded for GSTR-1 / place-of-supply testing",
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

async function main() {
  const args = parseArgs(process.argv);
  const email = args.email || process.env.ASHWINI_ADMIN_EMAIL;
  const password = args.password || process.env.ASHWINI_ADMIN_PASSWORD;
  let token = args.token || process.env.ASHWINI_TOKEN;

  console.log(`API: ${BASE}`);

  if (!token) {
    if (!email || !password) {
      console.error(
        "Provide --email/--password or --token (or ASHWINI_ADMIN_EMAIL / ASHWINI_ADMIN_PASSWORD / ASHWINI_TOKEN).",
      );
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
  const results = { vendors: [], expenses: [], orders: [], gstr1: {} };

  console.log("\n=== Vendors ===");
  const vendorsByKey = {};
  for (const scenario of VENDOR_SCENARIOS) {
    const vendor = await ensureVendor(token, scenario);
    vendorsByKey[scenario.key] = vendor;
    results.vendors.push({
      id: entityId(vendor),
      name: vendor.name,
      state: vendor.billingAddress?.state || scenario.billingAddress.state,
      gstin: vendor.gstin || scenario.gstin,
    });
    console.log(
      `  ✓ ${vendor.name} · ${scenario.billingAddress.state} · ${isIntraState(scenario.billingAddress.state, scenario.gstin) ? "CGST+SGST" : "IGST"}`,
    );
  }

  console.log("\n=== Expense category ===");
  const category = await ensureCategory(token);
  console.log(`  ✓ ${category.name} (${entityId(category)})`);

  console.log("\n=== Expenses (same + different state) ===");
  const expensePlans = [
    { key: "ka", expenseDate: "2026-08-05", taxable: 1000, taxPercent: 18 },
    { key: "ka", expenseDate: "2026-08-06", taxable: 2000, taxPercent: 5 },
    { key: "mh", expenseDate: "2026-08-07", taxable: 1500, taxPercent: 18 },
    { key: "tn", expenseDate: "2026-08-08", taxable: 800, taxPercent: 5 },
  ];
  for (const plan of expensePlans) {
    const vendor = vendorsByKey[plan.key];
    const payload = buildExpensePayload({
      vendor: {
        ...vendor,
        billingAddress: vendor.billingAddress || VENDOR_SCENARIOS.find((v) => v.key === plan.key).billingAddress,
        gstin: vendor.gstin || VENDOR_SCENARIOS.find((v) => v.key === plan.key).gstin,
      },
      category,
      expenseDate: plan.expenseDate,
      serial: `SEED-${plan.key.toUpperCase()}-${stamp}-${plan.taxPercent}`,
      taxable: plan.taxable,
      taxPercent: plan.taxPercent,
    });
    const created = await api("/admin/expenses", { method: "POST", token, body: payload });
    results.expenses.push({
      id: entityId(created),
      vendor: payload.vendorSnapshot.name,
      state: payload.vendorSnapshot.state,
      taxType: payload.taxType,
      taxableAmount: payload.taxableAmount,
      taxAmount: payload.taxAmount,
      cgstAmount: payload.cgstAmount,
      sgstAmount: payload.sgstAmount,
      igstAmount: payload.igstAmount,
      totalAmount: payload.totalAmount,
    });
    console.log(
      `  ✓ ${payload.vendorSnapshot.state} · ${payload.taxType} · taxable ₹${payload.taxableAmount} · tax ₹${payload.taxAmount}`,
    );
  }

  console.log("\n=== Orders (multi-state, completed + paid) ===");
  for (const scenario of ORDER_SCENARIOS) {
    const payload = buildOrderPayload(scenario);
    const created = await api("/admin/orders", { method: "POST", token, body: payload });
    results.orders.push({
      id: entityId(created),
      orderNumber: created.orderNumber,
      label: scenario.label,
      state: scenario.customer.state,
      taxType: payload.taxType,
      taxableAmount: payload.taxableAmount,
      cgstAmount: payload.cgstAmount,
      sgstAmount: payload.sgstAmount,
      igstAmount: payload.igstAmount,
      totalAmount: payload.totalAmount,
      orderDate: scenario.orderDate,
    });
    console.log(
      `  ✓ ${created.orderNumber || entityId(created)} · ${scenario.customer.state} · ${payload.taxType} · ₹${payload.totalAmount}`,
    );
  }

  const fromDate = args.fromDate || "2026-08-01";
  const toDate = args.toDate || todayISO();
  console.log(`\n=== GSTR-1 reports (${fromDate} → ${toDate}) ===`);

  for (const [key, path] of [
    ["consolidated", `/admin/gstr1/consolidated?fromDate=${fromDate}&toDate=${toDate}&all=true`],
    ["b2cs", `/admin/gstr1/b2cs?fromDate=${fromDate}&toDate=${toDate}&all=true`],
    ["hsn", `/admin/gstr1/hsn-summary?fromDate=${fromDate}&toDate=${toDate}&all=true`],
  ]) {
    try {
      const data = await api(path, { token });
      results.gstr1[key] = {
        itemCount: data.items?.length ?? 0,
        summary: data.summary,
        sample: (data.items || []).slice(0, 5),
      };
      console.log(
        `  ✓ ${key}: ${results.gstr1[key].itemCount} rows · orders=${data.summary?.totalOrders ?? "?"} · taxable=${data.summary?.totalTaxableValue ?? "?"}`,
      );
    } catch (err) {
      results.gstr1[key] = { error: err.message, status: err.status };
      console.log(`  ✗ ${key}: ${err.message} (HTTP ${err.status || "?"})`);
    }
  }

  console.log("\n=== Summary JSON ===");
  console.log(JSON.stringify(results, null, 2));
}

main().catch((err) => {
  console.error("\nSeed failed:", err.message);
  if (err.errors) console.error(JSON.stringify(err.errors, null, 2));
  if (err.payload) console.error(JSON.stringify(err.payload, null, 2));
  process.exit(1);
});
