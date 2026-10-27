import {
  DEFAULT_TAX_RATE,
  calcInclusiveGstBreakdown,
  splitGstByPlaceOfSupply,
  TAX_TYPE_CGST_SGST,
  TAX_TYPE_IGST,
} from "./gst";

/**
 * Build checkout / public order payload with GST place-of-supply split.
 * Catalog prices are GST-inclusive (5%) — tax is extracted, never added.
 */
export function buildOrderPayload(cartItems, customer, subtotal) {
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
  const orderSubtotal = linesSubtotal || round2(subtotal);

  const taxableAmount = round2(
    items.reduce((sum, line) => sum + (Number(line.taxable) || 0), 0),
  );
  const taxAmount = round2(
    items.reduce((sum, line) => sum + (Number(line.taxAmount) || 0), 0),
  );
  const cgstAmount = round2(
    items.reduce((sum, line) => sum + (Number(line.cgstAmount) || 0), 0),
  );
  const sgstAmount = round2(
    items.reduce((sum, line) => sum + (Number(line.sgstAmount) || 0), 0),
  );
  const igstAmount = round2(
    items.reduce((sum, line) => sum + (Number(line.igstAmount) || 0), 0),
  );
  const taxType =
    igstAmount > 0 && cgstAmount === 0 && sgstAmount === 0
      ? TAX_TYPE_IGST
      : TAX_TYPE_CGST_SGST;
  const sample =
    items[0] || splitGstByPlaceOfSupply(0, DEFAULT_TAX_RATE, { state });
  const { cgstRate, sgstRate, igstRate } = sample;

  return {
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
    subtotal: orderSubtotal,
    totalAmount: orderSubtotal,
    currency: "INR",
    orderType: "domestic",
  };
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
