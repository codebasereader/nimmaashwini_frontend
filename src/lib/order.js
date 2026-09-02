import {
  DEFAULT_TAX_RATE,
  calcInclusiveGstBreakdown,
  splitGstByPlaceOfSupply,
  TAX_TYPE_CGST_SGST,
  TAX_TYPE_IGST,
} from "./gst";
import { normalizeCouponCode } from "./coupon";

/**
 * Build checkout / public order payload with GST place-of-supply split.
 * Catalog prices are GST-inclusive (5%) — tax is extracted, never added.
 *
 * @param {object} [coupon] - Applied coupon from validate: { code, discountAmount }
 *   When present, order-level tax is recomputed from payable (post-discount) total.
 */
export function buildOrderPayload(cartItems, customer, subtotal, coupon = null) {
  const state = customer.state?.trim() || "";
  const items = cartItems.map((item) => {
    const quantity = Number(item.quantity) || 0;
    const unitPrice = Number(item.price) || 0;
    const lineTotal = Math.round(unitPrice * quantity * 100) / 100;
    const gst = calcInclusiveGstBreakdown({
      inclusiveAmount: lineTotal,
      taxRate: DEFAULT_TAX_RATE,
      state,
    });

    return {
      productId: item.productId,
      slug: item.slug,
      name: item.name,
      variantId: item.variantId,
      variantLabel: item.variantLabel,
      quantity,
      unitPrice,
      taxRate: DEFAULT_TAX_RATE,
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

  const linesSubtotal = round2(
    items.reduce((sum, line) => sum + (Number(line.lineTotal) || 0), 0),
  );
  const preDiscountSubtotal = linesSubtotal || round2(subtotal);

  const couponCode = normalizeCouponCode(coupon?.code);
  let discountAmount = 0;
  if (couponCode && Number(coupon?.discountAmount) > 0) {
    discountAmount = round2(
      Math.min(Number(coupon.discountAmount), preDiscountSubtotal),
    );
  }

  const payable = round2(Math.max(0, preDiscountSubtotal - discountAmount));

  let taxableAmount;
  let taxAmount;
  let cgstAmount;
  let sgstAmount;
  let igstAmount;
  let taxType;
  let cgstRate;
  let sgstRate;
  let igstRate;

  if (discountAmount > 0) {
    const orderGst = calcInclusiveGstBreakdown({
      inclusiveAmount: payable,
      taxRate: DEFAULT_TAX_RATE,
      state,
    });
    taxableAmount = orderGst.taxable;
    taxAmount = orderGst.taxAmount;
    cgstAmount = orderGst.cgstAmount;
    sgstAmount = orderGst.sgstAmount;
    igstAmount = orderGst.igstAmount;
    taxType = orderGst.taxType;
    cgstRate = orderGst.cgstRate;
    sgstRate = orderGst.sgstRate;
    igstRate = orderGst.igstRate;
  } else {
    taxableAmount = round2(
      items.reduce((sum, line) => sum + (Number(line.taxable) || 0), 0),
    );
    taxAmount = round2(
      items.reduce((sum, line) => sum + (Number(line.taxAmount) || 0), 0),
    );
    cgstAmount = round2(
      items.reduce((sum, line) => sum + (Number(line.cgstAmount) || 0), 0),
    );
    sgstAmount = round2(
      items.reduce((sum, line) => sum + (Number(line.sgstAmount) || 0), 0),
    );
    igstAmount = round2(
      items.reduce((sum, line) => sum + (Number(line.igstAmount) || 0), 0),
    );
    taxType =
      igstAmount > 0 && cgstAmount === 0 && sgstAmount === 0
        ? TAX_TYPE_IGST
        : TAX_TYPE_CGST_SGST;
    const sample =
      items[0] || splitGstByPlaceOfSupply(0, DEFAULT_TAX_RATE, { state });
    cgstRate = sample.cgstRate;
    sgstRate = sample.sgstRate;
    igstRate = sample.igstRate;
  }

  const payload = {
    customer: {
      name: customer.name.trim(),
      contactNumber: customer.contactNumber.trim(),
      alternateNumber: customer.alternateNumber?.trim() || undefined,
      address: customer.address.trim(),
      landmark: customer.landmark?.trim() || undefined,
      pincode: customer.pincode.trim(),
      city: customer.city.trim(),
      district: customer.district?.trim() || undefined,
      state,
      country: customer.country.trim(),
    },
    items,
    taxableAmount,
    taxAmount,
    taxType,
    cgstAmount,
    sgstAmount,
    igstAmount,
    cgstRate,
    sgstRate,
    igstRate,
    taxRate: DEFAULT_TAX_RATE,
    subtotal: preDiscountSubtotal,
    discountAmount,
    totalAmount: payable,
    currency: "INR",
    orderType: "domestic",
  };

  if (couponCode && discountAmount > 0) {
    payload.couponCode = couponCode;
  }

  return payload;
}

function round2(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

export function validateCheckoutForm(form, { isInternational }) {
  const errors = {};

  if (!form.name.trim()) errors.name = "Name is required";
  if (!form.contactNumber.trim()) {
    errors.contactNumber = "Contact number is required";
  } else if (!/^\+?[\d\s-]{10,15}$/.test(form.contactNumber.trim())) {
    errors.contactNumber = "Enter a valid contact number";
  }

  if (
    form.alternateNumber.trim() &&
    !/^\+?[\d\s-]{10,15}$/.test(form.alternateNumber.trim())
  ) {
    errors.alternateNumber = "Enter a valid alternate number";
  }

  if (!isInternational) {
    if (!form.address.trim()) errors.address = "Address is required";
    if (!form.pincode.trim()) {
      errors.pincode = "Pincode is required";
    } else if (!/^[1-9][0-9]{5}$/.test(form.pincode.trim())) {
      errors.pincode = "Enter a valid 6-digit Indian pincode";
    }
    if (!form.city.trim()) errors.city = "City is required";
    if (!(form.district || "").trim()) errors.district = "District is required";
    if (!form.state.trim()) errors.state = "State is required";
  }

  return errors;
}
