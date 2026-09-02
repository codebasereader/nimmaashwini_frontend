/** Default GST rate used across purchase / PO line items. */
export const DEFAULT_TAX_RATE = 5;

export const DEFAULT_UNITS = [
  { id: "pcs", code: "PCS", name: "Pieces" },
  { id: "kgs", code: "KGS", name: "Kilograms" },
  { id: "g", code: "G", name: "Grams" },
  { id: "l", code: "L", name: "Litres" },
  { id: "ml", code: "ML", name: "Millilitres" },
  { id: "box", code: "BOX", name: "Box" },
  { id: "pkt", code: "PKT", name: "Packet" },
];

export function roundMoney(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

/** Selling price excluding tax → including tax at `taxRate`%. */
export function priceIncludingTax(excl, taxRate = DEFAULT_TAX_RATE) {
  return roundMoney((Number(excl) || 0) * (1 + (Number(taxRate) || 0) / 100));
}

/** Selling price including tax → excluding tax at `taxRate`%. */
export function priceExcludingTax(incl, taxRate = DEFAULT_TAX_RATE) {
  const rate = Number(taxRate) || 0;
  if (rate <= 0) return roundMoney(incl);
  return roundMoney((Number(incl) || 0) / (1 + rate / 100));
}

export function calcLineDiscountAmount(unitPrice, quantity, discountValue, discountType) {
  const base = (Number(unitPrice) || 0) * (Number(quantity) || 0);
  if (discountType === "percent") {
    return roundMoney(base * ((Number(discountValue) || 0) / 100));
  }
  return roundMoney(Number(discountValue) || 0);
}

/**
 * Line total from purchase price (excl tax), qty, discount, and tax %.
 * Returns taxable, tax, and grand totals for the row.
 */
export function calcLineTotals({
  unitPrice,
  quantity,
  discountValue = 0,
  discountType = "percent",
  taxRate = DEFAULT_TAX_RATE,
}) {
  const qty = Number(quantity) || 0;
  const price = Number(unitPrice) || 0;
  const gross = roundMoney(price * qty);
  const discountAmount = calcLineDiscountAmount(
    price,
    qty,
    discountValue,
    discountType,
  );
  const taxable = roundMoney(Math.max(0, gross - discountAmount));
  const taxAmount = roundMoney(taxable * ((Number(taxRate) || 0) / 100));
  const total = roundMoney(taxable + taxAmount);

  return {
    gross,
    discountAmount,
    taxable,
    taxAmount,
    total,
    priceExclTax: price,
    priceInclTax: priceIncludingTax(price, taxRate),
  };
}

export function calcDocumentTotals(lineItems = [], extraDiscount = 0, extraDiscountType = "amount") {
  const taxableAmount = roundMoney(
    lineItems.reduce((sum, line) => sum + (Number(line.taxable) || 0), 0),
  );
  const taxAmount = roundMoney(
    lineItems.reduce((sum, line) => sum + (Number(line.taxAmount) || 0), 0),
  );
  const lineDiscountTotal = roundMoney(
    lineItems.reduce((sum, line) => sum + (Number(line.discountAmount) || 0), 0),
  );

  let extraDiscountAmount = 0;
  if (extraDiscountType === "percent") {
    extraDiscountAmount = roundMoney(
      taxableAmount * ((Number(extraDiscount) || 0) / 100),
    );
  } else {
    extraDiscountAmount = roundMoney(Number(extraDiscount) || 0);
  }

  const afterExtra = roundMoney(Math.max(0, taxableAmount - extraDiscountAmount));
  const taxOnAfter =
    taxableAmount > 0
      ? roundMoney(taxAmount * (afterExtra / taxableAmount))
      : 0;
  const totalAmount = roundMoney(afterExtra + taxOnAfter);
  const totalDiscount = roundMoney(lineDiscountTotal + extraDiscountAmount);

  return {
    taxableAmount: afterExtra,
    taxAmount: taxOnAfter,
    totalAmount,
    totalDiscount,
    extraDiscountAmount,
  };
}

export function formatINR(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(Number(value) || 0);
}

export function todayISODate() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function createEmptyLineItem(product, quantity = 1, unitId = "pcs") {
  const unitPrice = Number(product?.purchasePriceExclTax ?? product?.purchasePrice ?? product?.price ?? 0);
  const taxRate = Number(product?.taxRate ?? DEFAULT_TAX_RATE);
  const qty = Number(quantity) || 1;
  const totals = calcLineTotals({
    unitPrice,
    quantity: qty,
    discountValue: 0,
    discountType: "percent",
    taxRate,
  });

  return {
    key: `${product?.id || "new"}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    productId: product?.id || null,
    productName: product?.name || "",
    hsn: product?.hsn || product?.hsnSac || "",
    stock: product?.stock ?? null,
    quantity: qty,
    unitId: product?.primaryUnitId || unitId,
    unitPrice,
    discountValue: 0,
    discountType: "percent",
    taxRate,
    ...totals,
  };
}
