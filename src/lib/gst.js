/**
 * Place-of-supply GST helpers for Ashwini (company registered in Karnataka).
 *
 * Intra-state (Karnataka): CGST + SGST (half of taxRate each)
 * Inter-state (other states): IGST (full taxRate)
 *
 * Prices for catalog products are GST-inclusive; callers extract tax first,
 * then use splitGstByPlaceOfSupply to allocate the included tax.
 */

function roundMoney(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

/** Default product GST rate (inclusive catalog prices). */
export const DEFAULT_TAX_RATE = 5;

/** Seller / recipient company state for place-of-supply checks. */
export const COMPANY_STATE = "Karnataka";

/** GSTIN state code for Karnataka (first 2 digits). */
export const COMPANY_GSTIN_STATE_CODE = "29";

export const TAX_TYPE_CGST_SGST = "cgst_sgst";
export const TAX_TYPE_IGST = "igst";

const STATE_ALIASES = {
  karnataka: "Karnataka",
  ka: "Karnataka",
  "29": "Karnataka",
};

/**
 * Normalize free-text Indian state names for comparison.
 */
export function normalizeState(state) {
  if (state == null) return "";
  const raw = String(state).trim().toLowerCase().replace(/\s+/g, " ");
  if (!raw) return "";
  if (STATE_ALIASES[raw]) return STATE_ALIASES[raw];
  return raw.replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * True when counterparty is in the same state as the company (Karnataka).
 * Prefers explicit `state`; falls back to GSTIN prefix `29`.
 */
export function isIntraStateKarnataka(state, { gstin } = {}) {
  const normalized = normalizeState(state);
  if (normalized) {
    return normalized === COMPANY_STATE;
  }
  const code = String(gstin || "")
    .trim()
    .slice(0, 2);
  if (/^\d{2}$/.test(code)) {
    return code === COMPANY_GSTIN_STATE_CODE;
  }
  // Default to intra-state when state unknown (legacy / incomplete data).
  return true;
}

/**
 * Split a tax amount into CGST+SGST or IGST based on place of supply.
 *
 * @param {number} taxAmount - Total GST amount already computed
 * @param {number} taxRate - Total GST % (e.g. 5 or 18)
 * @param {{ state?: string, gstin?: string, isIntraState?: boolean }} place
 */
export function splitGstByPlaceOfSupply(taxAmount, taxRate = 5, place = {}) {
  const totalTax = roundMoney(taxAmount);
  const rate = Number(taxRate) || 0;
  const intra =
    typeof place.isIntraState === "boolean"
      ? place.isIntraState
      : isIntraStateKarnataka(place.state, { gstin: place.gstin });

  if (intra) {
    const halfRate = roundMoney(rate / 2);
    const cgstAmount = roundMoney(totalTax / 2);
    const sgstAmount = roundMoney(totalTax - cgstAmount);
    return {
      taxType: TAX_TYPE_CGST_SGST,
      cgstRate: halfRate,
      sgstRate: halfRate,
      igstRate: 0,
      cgstAmount,
      sgstAmount,
      igstAmount: 0,
    };
  }

  return {
    taxType: TAX_TYPE_IGST,
    cgstRate: 0,
    sgstRate: 0,
    igstRate: rate,
    cgstAmount: 0,
    sgstAmount: 0,
    igstAmount: totalTax,
  };
}

/**
 * Extract inclusive GST from a paid amount, then split by place of supply.
 * Catalog / order unit prices are GST-inclusive — never add tax on top.
 */
export function calcInclusiveGstBreakdown({
  inclusiveAmount,
  taxRate = 5,
  state,
  gstin,
  isIntraState,
}) {
  const total = roundMoney(inclusiveAmount);
  const rate = Number(taxRate) || 0;
  const taxable =
    rate > 0 ? roundMoney(total / (1 + rate / 100)) : total;
  const taxAmount = roundMoney(total - taxable);
  const split = splitGstByPlaceOfSupply(taxAmount, rate, {
    state,
    gstin,
    isIntraState,
  });

  return {
    taxable,
    taxAmount,
    taxRate: rate,
    total,
    ...split,
  };
}

/** Human-readable GST split label for UI. */
export function gstSplitLabel(taxType, taxRate = 5) {
  const rate = Number(taxRate) || 0;
  if (taxType === TAX_TYPE_IGST) {
    return `IGST ${rate}%`;
  }
  const half = roundMoney(rate / 2);
  return `CGST ${half}% · SGST ${half}%`;
}
