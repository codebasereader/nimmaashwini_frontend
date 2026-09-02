import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import {
  downloadExpensesExport,
  fetchExpenses,
} from "../api/expenses";
import { normalizeListResponse } from "../store/slices/crudHelpers";

const BRAND_FILL = "FF3D6B4F";
const BAND_FILL = "FFF7F3EA";
const TOTAL_FILL = "FFE8F0EA";
const BORDER = { style: "thin", color: { argb: "FFD8CDBB" } };

function cellBorder() {
  return { top: BORDER, left: BORDER, bottom: BORDER, right: BORDER };
}

function yesNo(value) {
  return value ? "Yes" : "No";
}

function vendorName(row) {
  return (
    row.vendorSnapshot?.name ||
    row.vendor?.name ||
    row.vendorName ||
    ""
  );
}

function categoryName(row) {
  if (row.categorySnapshot?.name || row.category?.name || row.categoryName) {
    return (
      row.categorySnapshot?.name ||
      row.category?.name ||
      row.categoryName ||
      ""
    );
  }
  const fromItems = (row.items || [])
    .map((item) => item.categorySnapshot?.name || item.category?.name)
    .filter(Boolean);
  return fromItems.length ? [...new Set(fromItems)].join(", ") : "";
}

function payableAmount(row) {
  const value = row.amount ?? row.totalAmount;
  return typeof value === "number" ? value : Number(value) || 0;
}

function formatDisplayDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function exportFilename(ext, fromDate, toDate) {
  const from = fromDate || "all";
  const to = toDate || "all";
  return `expenses_${from}_${to}.${ext}`;
}

function filterLabel({ fromDate, toDate, search, vendorLabel }) {
  const parts = [
    `From: ${fromDate || "All"}`,
    `To: ${toDate || "All"}`,
    `Vendor: ${vendorLabel || "All"}`,
    `Search: ${search || "—"}`,
  ];
  return parts.join("  ·  ");
}

const EXCEL_COLUMNS = [
  { key: "expenseDate", header: "Date", width: 14 },
  { key: "vendor", header: "Vendor", width: 22 },
  { key: "category", header: "Category", width: 18 },
  { key: "invoiceNo", header: "Invoice No.", width: 16 },
  { key: "notes", header: "Notes", width: 28 },
  { key: "taxable", header: "Taxable", width: 12, currency: true },
  { key: "tax", header: "Tax", width: 10, currency: true },
  { key: "cgst", header: "CGST", width: 10, currency: true },
  { key: "sgst", header: "SGST", width: 10, currency: true },
  { key: "igst", header: "IGST", width: 10, currency: true },
  { key: "amount", header: "Amount", width: 12, currency: true },
  { key: "paid", header: "Paid", width: 8 },
  { key: "paymentType", header: "Payment Type", width: 14 },
  { key: "paymentDate", header: "Payment Date", width: 14 },
  { key: "withTax", header: "With Tax", width: 10 },
  { key: "rcm", header: "RCM", width: 8 },
];

function toExcelRow(row) {
  const taxed = Boolean(row.withTax || row.isTaxable);
  return {
    expenseDate: row.expenseDate || row.date || "",
    vendor: vendorName(row) || "—",
    category: categoryName(row) || "—",
    invoiceNo:
      row.supplierInvoiceSerialNo || row.invoiceId || "—",
    notes: row.notes || "",
    taxable: taxed ? Number(row.taxableAmount ?? row.netAmount) || 0 : null,
    tax: taxed ? Number(row.taxAmount) || 0 : null,
    cgst: taxed ? Number(row.cgstAmount) || 0 : null,
    sgst: taxed ? Number(row.sgstAmount) || 0 : null,
    igst: taxed ? Number(row.igstAmount) || 0 : null,
    amount: payableAmount(row),
    paid: yesNo(row.isPaid),
    paymentType: row.paymentType || row.payment?.paymentType || "",
    paymentDate: row.paymentDate || row.payment?.paymentDate || "",
    withTax: yesNo(taxed),
    rcm: yesNo(row.reverseCharge || row.reverseChargeMechanism),
  };
}

/**
 * Build and download an expenses .xlsx from an in-memory list (client-side).
 */
export async function downloadExpensesExcelClient({
  expenses = [],
  fromDate,
  toDate,
  search,
  vendorLabel,
}) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Nimma Ashwini Admin";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Expenses", {
    views: [{ state: "frozen", ySplit: 4 }],
  });

  sheet.columns = EXCEL_COLUMNS.map((col) => ({
    key: col.key,
    width: col.width,
  }));

  const title = sheet.addRow(["Expense Report"]);
  sheet.mergeCells(1, 1, 1, EXCEL_COLUMNS.length);
  title.getCell(1).font = { bold: true, size: 14, color: { argb: "FF2A2118" } };

  const meta = sheet.addRow([
    filterLabel({ fromDate, toDate, search, vendorLabel }),
  ]);
  sheet.mergeCells(2, 1, 2, EXCEL_COLUMNS.length);
  meta.getCell(1).font = { italic: true, size: 10, color: { argb: "FF6B5D4F" } };

  const generated = sheet.addRow([
    `Generated on: ${new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date())}`,
  ]);
  sheet.mergeCells(3, 1, 3, EXCEL_COLUMNS.length);
  generated.getCell(1).font = { size: 9, color: { argb: "FF6B5D4F" } };

  const header = sheet.addRow(EXCEL_COLUMNS.map((col) => col.header));
  header.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: BRAND_FILL },
    };
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
    cell.border = cellBorder();
    cell.alignment = { vertical: "middle" };
  });

  const rows = expenses.map(toExcelRow);
  rows.forEach((row, index) => {
    const excelRow = sheet.addRow(EXCEL_COLUMNS.map((col) => row[col.key]));
    excelRow.eachCell((cell, colNumber) => {
      const col = EXCEL_COLUMNS[colNumber - 1];
      cell.border = cellBorder();
      if (index % 2 === 1) {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: BAND_FILL },
        };
      }
      if (col.currency && cell.value != null && cell.value !== "") {
        cell.numFmt = "#,##0.00";
      }
    });
  });

  const totalAmount = rows.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);
  const footer = sheet.addRow([
    `Count: ${rows.length}`,
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "Total",
    totalAmount,
  ]);
  footer.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: TOTAL_FILL },
    };
    cell.font = { bold: true };
    cell.border = cellBorder();
  });
  footer.getCell(11).numFmt = "#,##0.00";

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  saveAs(blob, exportFilename("xlsx", fromDate, toDate));
}

/**
 * Open a print-friendly expense report (user can Save as PDF from the dialog).
 */
export function printExpensesPdf({
  expenses = [],
  fromDate,
  toDate,
  search,
  vendorLabel,
}) {
  const rowsHtml = expenses
    .map((row) => {
      const taxed = Boolean(row.withTax || row.isTaxable);
      return `<tr>
        <td>${escapeHtml(formatDisplayDate(row.expenseDate || row.date))}</td>
        <td>${escapeHtml(vendorName(row) || "—")}</td>
        <td>${escapeHtml(categoryName(row) || "—")}</td>
        <td>${escapeHtml(row.supplierInvoiceSerialNo || row.invoiceId || "—")}</td>
        <td style="text-align:right">${formatInr(payableAmount(row))}</td>
        <td>${yesNo(row.isPaid)}</td>
        <td>${escapeHtml(row.paymentType || row.payment?.paymentType || "—")}</td>
        <td>${yesNo(taxed)}</td>
      </tr>`;
    })
    .join("");

  const total = expenses.reduce((sum, row) => sum + payableAmount(row), 0);
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Expense Report</title>
  <style>
    body { font-family: Georgia, "Times New Roman", serif; color: #2a2118; margin: 24px; }
    h1 { font-size: 20px; margin: 0 0 6px; }
    .meta { font-size: 12px; color: #6b5d4f; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th, td { border: 1px solid #d8cdbb; padding: 6px 8px; text-align: left; }
    th { background: #3d6b4f; color: #fff; text-transform: uppercase; letter-spacing: 0.04em; font-size: 10px; }
    tfoot td { font-weight: bold; background: #e8f0ea; }
    @media print { body { margin: 12px; } }
  </style>
</head>
<body>
  <h1>Expense Report</h1>
  <p class="meta">${escapeHtml(filterLabel({ fromDate, toDate, search, vendorLabel }))}</p>
  <p class="meta">Generated on: ${escapeHtml(
    new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date()),
  )}</p>
  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Vendor</th>
        <th>Category</th>
        <th>Invoice</th>
        <th>Amount</th>
        <th>Paid</th>
        <th>Payment</th>
        <th>Tax</th>
      </tr>
    </thead>
    <tbody>${rowsHtml || `<tr><td colspan="8">No expenses found</td></tr>`}</tbody>
    <tfoot>
      <tr>
        <td colspan="4">Count: ${expenses.length}</td>
        <td style="text-align:right">${formatInr(total)}</td>
        <td colspan="3"></td>
      </tr>
    </tfoot>
  </table>
  <script>window.onload = function () { window.focus(); window.print(); };</script>
</body>
</html>`;

  const win = window.open("", "_blank");
  if (!win) {
    throw new Error("Pop-up blocked. Allow pop-ups to export PDF.");
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatInr(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

async function loadExportRows(filters, token) {
  const data = await fetchExpenses(
    {
      ...filters,
      all: true,
      limit: 10000,
    },
    token,
  );
  return normalizeListResponse(data);
}

/**
 * Prefer server `/export` when available; otherwise build client-side.
 */
export async function exportExpenses({
  format,
  filters,
  token,
  vendorLabel,
}) {
  const query = {
    fromDate: filters.fromDate || undefined,
    toDate: filters.toDate || undefined,
    search: filters.search || undefined,
    vendorId: filters.vendorId || undefined,
  };

  try {
    const { blob, filename } = await downloadExpensesExport(
      { format, ...query },
      token,
    );
    saveAs(blob, filename || exportFilename(format === "pdf" ? "pdf" : "xlsx", query.fromDate, query.toDate));
    return { mode: "server" };
  } catch (error) {
    // Backend export may not be live yet — fall back to client generation.
    if (error?.status && error.status !== 404 && error.status !== 501) {
      // still try client fallback for network/other issues after listing
    }

    const expenses = await loadExportRows(query, token);

    if (format === "pdf") {
      printExpensesPdf({
        expenses,
        fromDate: query.fromDate,
        toDate: query.toDate,
        search: query.search,
        vendorLabel,
      });
      return { mode: "client-print" };
    }

    await downloadExpensesExcelClient({
      expenses,
      fromDate: query.fromDate,
      toDate: query.toDate,
      search: query.search,
      vendorLabel,
    });
    return { mode: "client-excel" };
  }
}
