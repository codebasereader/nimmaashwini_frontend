/**
 * Client-side coupon helpers. Server validate + order re-check are authoritative.
 */

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function round2(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

/** Generate a shareable code like ASHW7K2M9P */
export function generateCouponCode(prefix = "ASHW", length = 6) {
  let suffix = "";
  const cryptoObj = typeof globalThis !== "undefined" ? globalThis.crypto : null;
  if (cryptoObj?.getRandomValues) {
    const bytes = new Uint8Array(length);
    cryptoObj.getRandomValues(bytes);
    for (let i = 0; i < length; i += 1) {
      suffix += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
    }
  } else {
    for (let i = 0; i < length; i += 1) {
      suffix += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
    }
  }
  return `${prefix}${suffix}`.toUpperCase();
}

export function normalizeCouponCode(code) {
  return String(code || "")
    .trim()
    .toUpperCase();
}

/**
 * @param {Array<{ productId: string, quantity?: number, price?: number, unitPrice?: number }>} items
 * @param {{ appliesTo?: string, productIds?: string[] }} coupon
 */
export function calcEligibleSubtotal(items, coupon) {
  const list = Array.isArray(items) ? items : [];
  const appliesTo = coupon?.appliesTo || "all";
  const productIds = new Set(
    (coupon?.productIds || []).map((id) => String(id)),
  );

  return round2(
    list.reduce((sum, item) => {
      const productId = String(item.productId || "");
      if (appliesTo === "products" && !productIds.has(productId)) {
        return sum;
      }
      const qty = Number(item.quantity) || 0;
      const unit = Number(item.unitPrice ?? item.price) || 0;
      return sum + unit * qty;
    }, 0),
  );
}

/**
 * @param {number} eligibleSubtotal
 * @param {"amount"|"percent"} discountType
 * @param {number} discountValue
 * @param {number} [orderSubtotal] cap against full cart
 */
export function calcDiscountAmount(
  eligibleSubtotal,
  discountType,
  discountValue,
  orderSubtotal = eligibleSubtotal,
) {
  const eligible = Math.max(0, Number(eligibleSubtotal) || 0);
  const orderCap = Math.max(0, Number(orderSubtotal) || 0);
  const value = Math.max(0, Number(discountValue) || 0);

  if (eligible <= 0 || value <= 0) return 0;

  let amount = 0;
  if (discountType === "percent") {
    const pct = Math.min(100, value);
    amount = round2(eligible * (pct / 100));
  } else {
    amount = round2(Math.min(value, eligible));
  }

  return round2(Math.min(amount, orderCap, eligible));
}

/** Add `validDays` to a start date (local calendar days). */
export function computeEndsAt(startsAt, validDays) {
  const start = startsAt instanceof Date ? new Date(startsAt) : new Date(startsAt);
  if (Number.isNaN(start.getTime())) return null;
  const days = Math.max(1, Math.floor(Number(validDays) || 1));
  const end = new Date(start);
  end.setDate(end.getDate() + days);
  return end;
}

export function formatCouponDiscountPreview(discountType, discountValue) {
  const value = Number(discountValue) || 0;
  if (discountType === "percent") {
    return `${value}% off eligible products`;
  }
  return `₹${value.toLocaleString("en-IN")} off eligible products`;
}

export function formatINR(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);
}

/** Cart items → validate API payload lines */
export function cartItemsToValidatePayload(items) {
  return (items || []).map((item) => ({
    productId: item.productId,
    quantity: Number(item.quantity) || 0,
    unitPrice: Number(item.price ?? item.unitPrice) || 0,
  }));
}
