import {
  DEFAULT_TAX_RATE,
  formatINR,
  priceExcludingTax,
  roundMoney,
  todayISODate,
} from "../../lib/purchaseMath";
import {
  COMPANY_STATE,
  TAX_TYPE_CGST_SGST,
  TAX_TYPE_IGST,
  gstSplitLabel,
  isIntraStateKarnataka,
  splitGstByPlaceOfSupply,
} from "../../../lib/gst";

export {
  DEFAULT_TAX_RATE,
  formatINR,
  roundMoney,
  todayISODate,
  COMPANY_STATE,
  TAX_TYPE_CGST_SGST,
  TAX_TYPE_IGST,
  gstSplitLabel,
  isIntraStateKarnataka,
};

/**
 * Split GST by place of supply (customer state vs Karnataka).
 * @deprecated Prefer splitGstByPlaceOfSupply from src/lib/gst.js
 */
export function splitGst(taxAmount, place = {}) {
  return splitGstByPlaceOfSupply(taxAmount, DEFAULT_TAX_RATE, place);
}

/**
 * Split an inclusive line total into taxable + GST (CGST/SGST or IGST).
 * Catalog `unitPrice` is already GST-inclusive — do not add tax on top.
 */
export function calcInclusiveLineTotals({
  unitPrice,
  quantity,
  taxRate = DEFAULT_TAX_RATE,
  customerState,
  isIntraState,
}) {
  const qty = Number(quantity) || 0;
  const priceIncl = Number(unitPrice) || 0;
  const lineTotal = roundMoney(priceIncl * qty);
  const taxable = priceExcludingTax(lineTotal, taxRate);
  const taxAmount = roundMoney(lineTotal - taxable);
  const gst = splitGstByPlaceOfSupply(taxAmount, taxRate, {
    state: customerState,
    isIntraState,
  });

  return {
    gross: lineTotal,
    discountAmount: 0,
    taxable,
    taxAmount,
    total: lineTotal,
    lineTotal,
    priceExclTax: priceExcludingTax(priceIncl, taxRate),
    priceInclTax: priceIncl,
    ...gst,
  };
}

/**
 * Recompute a manual-order line from tax-inclusive unit price and qty.
 * Pass `customerState` (or `isIntraState`) so CGST/SGST vs IGST is correct.
 */
export function recomputeOrderLine(line, patch = {}, place = {}) {
  const next = { ...line, ...patch };
  const taxRate = DEFAULT_TAX_RATE;
  const customerState =
    place.customerState ?? place.state ?? next.customerState ?? undefined;
  const isIntraState =
    typeof place.isIntraState === "boolean"
      ? place.isIntraState
      : typeof next.isIntraState === "boolean"
        ? next.isIntraState
        : undefined;

  const totals = calcInclusiveLineTotals({
    unitPrice: next.unitPrice,
    quantity: next.quantity,
    taxRate,
    customerState,
    isIntraState,
  });
  return {
    ...next,
    taxRate,
    customerState: customerState || next.customerState || "",
    ...totals,
  };
}

export function calcOrderTotals(lines = []) {
  const taxableAmount = roundMoney(
    lines.reduce((sum, line) => sum + (Number(line.taxable) || 0), 0),
  );
  const taxAmount = roundMoney(
    lines.reduce((sum, line) => sum + (Number(line.taxAmount) || 0), 0),
  );
  const cgstAmount = roundMoney(
    lines.reduce((sum, line) => sum + (Number(line.cgstAmount) || 0), 0),
  );
  const sgstAmount = roundMoney(
    lines.reduce((sum, line) => sum + (Number(line.sgstAmount) || 0), 0),
  );
  const igstAmount = roundMoney(
    lines.reduce((sum, line) => sum + (Number(line.igstAmount) || 0), 0),
  );
  const subtotal = roundMoney(
    lines.reduce((sum, line) => sum + (Number(line.lineTotal) || 0), 0),
  );

  const taxType =
    igstAmount > 0 && cgstAmount === 0 && sgstAmount === 0
      ? TAX_TYPE_IGST
      : TAX_TYPE_CGST_SGST;

  const sample = lines[0] || {};

  return {
    taxableAmount,
    taxAmount,
    cgstAmount,
    sgstAmount,
    igstAmount,
    cgstRate: Number(sample.cgstRate) || (taxType === TAX_TYPE_CGST_SGST ? 2.5 : 0),
    sgstRate: Number(sample.sgstRate) || (taxType === TAX_TYPE_CGST_SGST ? 2.5 : 0),
    igstRate: Number(sample.igstRate) || (taxType === TAX_TYPE_IGST ? DEFAULT_TAX_RATE : 0),
    taxType,
    taxRate: DEFAULT_TAX_RATE,
    subtotal,
    totalAmount: subtotal,
  };
}

export function getCatalogVariants(product) {
  const quantities = product?.quantities || product?.sizes || [];
  if (Array.isArray(quantities) && quantities.length > 0) {
    return [...quantities]
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      .map((variant) => ({
        id: variant.value || variant.label || `${variant.amount}${variant.unit}`,
        label:
          variant.label ||
          `${variant.amount ?? ""}${variant.unit ? ` ${variant.unit}` : ""}`.trim(),
        price: Number(variant.price) || 0,
        stock: variant.stock ?? null,
        maxQuantityPerOrder: variant.maxQuantityPerOrder ?? product?.maxQuantityPerOrder ?? 99,
      }));
  }

  return [
    {
      id: "default",
      label: "Standard",
      price: Number(product?.price) || 0,
      stock: product?.stock ?? null,
      maxQuantityPerOrder: product?.maxQuantityPerOrder ?? 99,
    },
  ];
}

export function createOrderLineItem(product, variant, quantity = 1, place = {}) {
  const qty = Number(quantity) || 1;
  const unitPrice = Number(variant?.price ?? product?.price ?? 0);
  const variantOptions = getCatalogVariants(product);
  const base = {
    key: `${product?.id || "new"}-${variant?.id || "v"}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    productId: product?.id || product?._id || null,
    slug: product?.slug || "",
    name: product?.name || "",
    variantId: variant?.id || "default",
    variantLabel: variant?.label || "Standard",
    variantOptions,
    quantity: qty,
    unitPrice,
    stock: variant?.stock ?? product?.stock ?? null,
    maxQuantityPerOrder: variant?.maxQuantityPerOrder ?? 99,
  };
  return recomputeOrderLine(base, {}, place);
}
