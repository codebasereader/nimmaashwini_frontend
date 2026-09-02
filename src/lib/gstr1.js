/**
 * Shared column definitions + row formatters for the GSTR-1 Filing report.
 *
 * Single source of truth used by BOTH the on-screen tables (Gstr1Page.jsx)
 * and the Excel export (gstr1Excel.js) so the two never drift apart.
 *
 * The frontend does NOT recompute GST math — all taxable/CGST/SGST/IGST
 * values come pre-aggregated from the backend (see docs/GSTR1_FILING_SCHEMA.md),
 * derived from the same persisted order fields shown on the order itself
 * (see docs/GST_PLACE_OF_SUPPLY_SCHEMA.md). This file only formats values
 * for display/export.
 */

function round2(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

export function formatINR(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(Number(value) || 0);
}

export function formatGstr1Date(value) {
  if (!value) return "—";
  try {
    const iso = String(value).length <= 10 ? `${value}T00:00:00` : value;
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return String(value);
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  } catch {
    return String(value);
  }
}

export function formatTaxRate(rate) {
  const value = Number(rate);
  if (!Number.isFinite(value)) return "—";
  return `${value % 1 === 0 ? value : value.toFixed(1)}%`;
}

/**
 * Column type drives both the on-screen table's number formatting and the
 * Excel cell's numFmt / alignment.
 * type: "text" | "currency" | "integer" | "percent"
 */
export const CONSOLIDATED_COLUMNS = [
  { key: "receiverName", label: "Receiver / Customer Name", type: "text", width: 26 },
  { key: "invoiceNumber", label: "Invoice Number", type: "text", width: 18 },
  { key: "invoiceDate", label: "Invoice Date", type: "text", width: 14 },
  { key: "invoiceValue", label: "Invoice Value", type: "currency", width: 16 },
  { key: "placeOfSupply", label: "Place of Supply (State)", type: "text", width: 22 },
  { key: "taxRate", label: "Tax %", type: "percent", width: 10 },
  { key: "taxableValue", label: "Taxable Value", type: "currency", width: 16 },
  { key: "cgstAmount", label: "CGST", type: "currency", width: 14 },
  { key: "sgstAmount", label: "SGST", type: "currency", width: 14 },
  { key: "igstAmount", label: "IGST", type: "currency", width: 14 },
];

export const B2CS_COLUMNS = [
  { key: "numberOfOrders", label: "Number of Orders", type: "integer", width: 18 },
  { key: "placeOfSupply", label: "Place of Supply (State)", type: "text", width: 24 },
  { key: "taxRate", label: "Tax Rate", type: "percent", width: 12 },
  { key: "taxableValue", label: "Taxable Value", type: "currency", width: 18 },
];

export const HSN_COLUMNS = [
  { key: "productName", label: "Product / Catalogue Name", type: "text", width: 30 },
  { key: "totalQuantity", label: "Total Quantity", type: "integer", width: 15 },
  { key: "totalValue", label: "Total Value", type: "currency", width: 16 },
  { key: "rate", label: "Rate", type: "percent", width: 10 },
  { key: "taxableValue", label: "Taxable Value", type: "currency", width: 16 },
  { key: "igstAmount", label: "Integrated Tax Amount", type: "currency", width: 20 },
  { key: "cgstAmount", label: "Central Tax Amount", type: "currency", width: 18 },
  { key: "sgstAmount", label: "State/UT Tax Amount", type: "currency", width: 18 },
];

/** Normalize one Consolidated API item into a display-ready row. */
export function toConsolidatedRow(item, index) {
  return {
    id: item.orderId || item.id || `consolidated-${index}`,
    receiverName: item.receiverName || item.customerName || "—",
    invoiceNumber: item.invoiceNumber || item.orderNumber || "—",
    invoiceDate: formatGstr1Date(item.invoiceDate || item.orderDate),
    invoiceValue: round2(item.invoiceValue),
    placeOfSupply: item.placeOfSupply || item.state || "—",
    taxRate: Number(item.taxRate) || 0,
    taxableValue: round2(item.taxableValue),
    cgstAmount: round2(item.cgstAmount),
    sgstAmount: round2(item.sgstAmount),
    igstAmount: round2(item.igstAmount),
  };
}

/** Normalize one B2CS API item into a display-ready row. */
export function toB2csRow(item, index) {
  return {
    id: `${item.placeOfSupply || item.state || "unknown"}-${item.taxRate ?? 0}-${index}`,
    numberOfOrders: Number(item.numberOfOrders || item.orderCount) || 0,
    placeOfSupply: item.placeOfSupply || item.state || "—",
    taxRate: Number(item.taxRate) || 0,
    taxableValue: round2(item.taxableValue),
  };
}

/** Normalize one HSN(B2C) API item into a display-ready row. */
export function toHsnRow(item, index) {
  return {
    id: `${item.productName || item.name || "unknown"}-${index}`,
    productName: item.productName || item.name || "—",
    totalQuantity: Number(item.totalQuantity || item.quantity) || 0,
    totalValue: round2(item.totalValue),
    rate: Number(item.rate ?? item.taxRate) || 0,
    taxableValue: round2(item.taxableValue),
    igstAmount: round2(item.igstAmount),
    cgstAmount: round2(item.cgstAmount),
    sgstAmount: round2(item.sgstAmount),
  };
}

/** Convert shared column defs into AdminDataTable-compatible column configs. */
export function toDisplayColumns(columns) {
  return columns.map((col) => ({
    key: col.key,
    label: col.label,
    align: col.type === "text" ? undefined : "right",
    render: (row) => {
      const value = row[col.key];
      if (col.type === "currency") return formatINR(value);
      if (col.type === "integer") return Number(value || 0).toLocaleString("en-IN");
      if (col.type === "percent") return formatTaxRate(value);
      return value ?? "—";
    },
  }));
}

function sumBy(rows, key) {
  return round2(rows.reduce((sum, row) => sum + (Number(row[key]) || 0), 0));
}

/**
 * Grand-total row for a set of already-normalized rows. Prefers the
 * backend-provided `summary` (from the full/unpaginated fetch) when given,
 * falling back to a client-side sum of the currently loaded rows so the
 * on-screen footer still works before the full dataset is fetched.
 */
export function buildGrandTotal(columns, rows, summary) {
  const total = { id: "grand-total", __isTotal: true };
  columns.forEach((col, index) => {
    if (col.type === "text" && index !== 0) {
      total[col.key] = "";
      return;
    }
    if (index === 0 && col.type === "text") {
      total[col.key] = "Grand Total";
      return;
    }
    if (col.type === "percent") {
      total[col.key] = "";
      return;
    }
    total[col.key] = sumBy(rows, col.key);
  });

  if (summary) {
    if (columns === CONSOLIDATED_COLUMNS) {
      total.invoiceValue = round2(summary.totalInvoiceValue);
      total.taxableValue = round2(summary.totalTaxableValue);
      total.cgstAmount = round2(summary.totalCgstAmount);
      total.sgstAmount = round2(summary.totalSgstAmount);
      total.igstAmount = round2(summary.totalIgstAmount);
    } else if (columns === B2CS_COLUMNS) {
      total.numberOfOrders = Number(summary.totalOrders) || total.numberOfOrders;
      total.taxableValue = round2(summary.totalTaxableValue);
    } else if (columns === HSN_COLUMNS) {
      total.taxableValue = round2(summary.totalTaxableValue);
      total.igstAmount = round2(summary.totalIgstAmount);
      total.cgstAmount = round2(summary.totalCgstAmount);
      total.sgstAmount = round2(summary.totalSgstAmount);
    }
  }

  return total;
}
