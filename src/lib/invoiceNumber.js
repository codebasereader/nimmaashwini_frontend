/**
 * Shared invoice / order number helpers.
 * Format: MON-YY-NNNN, e.g. OCT-26-9176 (see docs/INVOICE_NUMBER_SCHEMA.md)
 * MON-YY is the issuing month/year; admins only edit the trailing number.
 */

const MONTHS = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
];

export const MAX_SEQUENCE_DIGITS = 9;

export const INVOICE_NUMBER_REGEX = new RegExp(
  `^(${MONTHS.join("|")})-[0-9]{2}-[0-9]{1,${MAX_SEQUENCE_DIGITS}}$`,
);

export const INVOICE_NUMBER_FORMAT_HINT = "MON-YY-NNNN (e.g. OCT-26-9176)";

/** "OCT-26-" for the given date (defaults to now). */
export function getInvoicePrefix(date = new Date()) {
  const year = String(date.getFullYear()).slice(-2);
  return `${MONTHS[date.getMonth()]}-${year}-`;
}

export function isValidInvoiceNumber(value) {
  return INVOICE_NUMBER_REGEX.test(String(value || "").trim());
}

export function normalizeInvoiceNumberInput(value) {
  return String(value || "")
    .trim()
    .toUpperCase();
}

/**
 * Split a valid invoice number into its parts.
 * @returns {{ month: string, year: number, sequence: number, prefix: string } | null}
 */
export function parseInvoiceNumber(value) {
  const normalized = normalizeInvoiceNumberInput(value);
  if (!INVOICE_NUMBER_REGEX.test(normalized)) return null;
  const [month, yearStr, seqStr] = normalized.split("-");
  return {
    month,
    year: 2000 + Number(yearStr),
    sequence: Number(seqStr),
    prefix: `${month}-${yearStr}-`,
  };
}

export function formatInvoiceNumber(sequence, date = new Date()) {
  const seq = Number(sequence);
  if (!Number.isInteger(seq) || seq < 1) return null;
  if (String(seq).length > MAX_SEQUENCE_DIGITS) return null;
  return `${getInvoicePrefix(date)}${seq}`;
}

/** Validate the digits the admin typed after the fixed MON-YY- prefix. */
export function validateNextInvoiceSequence(value, date = new Date()) {
  const digits = String(value || "").trim();
  if (!digits) {
    return { ok: false, message: "Invoice number is required." };
  }
  if (!/^\d+$/.test(digits) || Number(digits) < 1) {
    return { ok: false, message: "Enter a whole number greater than 0." };
  }
  if (digits.length > MAX_SEQUENCE_DIGITS) {
    return {
      ok: false,
      message: `Invoice number can have at most ${MAX_SEQUENCE_DIGITS} digits.`,
    };
  }
  return { ok: true, value: `${getInvoicePrefix(date)}${Number(digits)}` };
}
