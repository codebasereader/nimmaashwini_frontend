/**
 * Shared invoice / order number helpers.
 * Format: NA-YYYY-NNNNN (see docs/INVOICE_NUMBER_SCHEMA.md)
 */

export const INVOICE_NUMBER_REGEX = /^NA-\d{4}-\d{5}$/;

export const INVOICE_NUMBER_FORMAT_HINT = "NA-YYYY-NNNNN (e.g. NA-2026-00001)";

export function isValidInvoiceNumber(value) {
  return INVOICE_NUMBER_REGEX.test(String(value || "").trim());
}

export function normalizeInvoiceNumberInput(value) {
  return String(value || "")
    .trim()
    .toUpperCase();
}

/**
 * Parse a valid invoice number into parts.
 * @returns {{ prefix: string, year: number, sequence: number, padded: string } | null}
 */
export function parseInvoiceNumber(value) {
  const normalized = normalizeInvoiceNumberInput(value);
  if (!INVOICE_NUMBER_REGEX.test(normalized)) return null;
  const [, yearStr, seqStr] = normalized.match(/^NA-(\d{4})-(\d{5})$/) || [];
  return {
    prefix: "NA",
    year: Number(yearStr),
    sequence: Number(seqStr),
    padded: seqStr,
  };
}

export function formatInvoiceNumber(year, sequence, padding = 5) {
  const y = Number(year);
  const seq = Number(sequence);
  if (!Number.isInteger(y) || y < 1000 || y > 9999) return null;
  if (!Number.isInteger(seq) || seq < 1 || seq > 99999) return null;
  return `NA-${y}-${String(seq).padStart(padding, "0")}`;
}

export function validateNextInvoiceNumber(value) {
  const normalized = normalizeInvoiceNumberInput(value);
  if (!normalized) {
    return { ok: false, message: "Next invoice number is required." };
  }
  if (!INVOICE_NUMBER_REGEX.test(normalized)) {
    return {
      ok: false,
      message: `Invoice number must match ${INVOICE_NUMBER_FORMAT_HINT}.`,
    };
  }
  return { ok: true, value: normalized };
}
