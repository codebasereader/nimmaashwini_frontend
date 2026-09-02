import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { downloadAdminOrdersExport, fetchAdminOrders } from "../api/adminOrders";
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

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function itemsSummary(items = []) {
  return items
    .map((item) => {
      const variant = item.variantLabel || item.variantId;
      const label = variant ? `${item.name} (${variant})` : item.name;
      return `${label} x${item.quantity ?? 1}`;
    })
    .join("; ");
}

function customerAddress(customer = {}) {
  return [customer.address, customer.landmark].filter(Boolean).join(", ");
}

function exportFilename(fromDate, toDate) {
  const from = fromDate || "all";
  const to = toDate || "all";
  return `orders_${from}_${to}.xlsx`;
}

function filterLabel({ fromDate, toDate, status, paymentStatus, search }) {
  const parts = [
    `From: ${fromDate || "All"}`,
    `To: ${toDate || "All"}`,
    `Status: ${status || "All"}`,
    `Payment: ${paymentStatus || "All"}`,
    `Search: ${search || "—"}`,
  ];
  return parts.join("  ·  ");
}

const EXCEL_COLUMNS = [
  { key: "orderNumber", header: "Order #", width: 18 },
  { key: "orderDate", header: "Order Date", width: 14 },
  { key: "status", header: "Status", width: 12 },
  { key: "paymentStatus", header: "Payment Status", width: 14 },
  { key: "orderType", header: "Order Type", width: 12 },
  { key: "manual", header: "Manual Entry", width: 12 },
  { key: "customerName", header: "Customer Name", width: 20 },
  { key: "phone", header: "Phone", width: 16 },
  { key: "alternatePhone", header: "Alternate Phone", width: 16 },
  { key: "address", header: "Address", width: 32 },
  { key: "city", header: "City", width: 16 },
  { key: "state", header: "State", width: 16 },
  { key: "pincode", header: "Pincode", width: 10 },
  { key: "country", header: "Country", width: 12 },
  { key: "items", header: "Items", width: 40 },
  { key: "itemCount", header: "Item Count", width: 10 },
  { key: "subtotal", header: "Subtotal", width: 12, currency: true },
  { key: "discountAmount", header: "Discount", width: 12, currency: true },
  { key: "couponCode", header: "Coupon Code", width: 16 },
  { key: "taxableAmount", header: "Taxable", width: 12, currency: true },
  { key: "cgstAmount", header: "CGST", width: 10, currency: true },
  { key: "sgstAmount", header: "SGST", width: 10, currency: true },
  { key: "igstAmount", header: "IGST", width: 10, currency: true },
  { key: "taxAmount", header: "Tax Total", width: 10, currency: true },
  { key: "totalAmount", header: "Total Amount", width: 14, currency: true },
  { key: "currency", header: "Currency", width: 10 },
  { key: "gatewayStatus", header: "Gateway Status", width: 14 },
  { key: "paymentDate", header: "Payment Date", width: 16 },
  { key: "createdAt", header: "Created", width: 16 },
  { key: "updatedAt", header: "Updated", width: 16 },
];

function toExcelRow(order) {
  const customer = order.customer || {};
  const items = order.items || [];
  const paymentResult = order.paymentResult || {};
  const hasTax =
    order.taxAmount != null ||
    order.igstAmount != null ||
    order.cgstAmount != null;

  return {
    orderNumber: order.orderNumber || "",
    orderDate: formatDate(order.orderDate || order.createdAt),
    status: order.status || "",
    paymentStatus: order.paymentStatus || "",
    orderType: order.orderType || "",
    manual: yesNo(order.manual_entry ?? order.manualEntry),
    customerName: customer.name || "",
    phone: customer.contactNumber || "",
    alternatePhone: customer.alternateNumber || "",
    address: customerAddress(customer),
    city: customer.city || "",
    state: customer.state || "",
    pincode: customer.pincode || "",
    country: customer.country || "",
    items: itemsSummary(items),
    itemCount: items.length,
    subtotal: Number(order.subtotal ?? order.totalAmount) || 0,
    discountAmount: Number(order.discountAmount) || 0,
    couponCode: order.couponCode || "",
    taxableAmount: hasTax ? Number(order.taxableAmount) || 0 : null,
    cgstAmount: hasTax ? Number(order.cgstAmount) || 0 : null,
    sgstAmount: hasTax ? Number(order.sgstAmount) || 0 : null,
    igstAmount: hasTax ? Number(order.igstAmount) || 0 : null,
    taxAmount: hasTax ? Number(order.taxAmount) || 0 : null,
    totalAmount: Number(order.totalAmount ?? order.subtotal) || 0,
    currency: order.currency || "INR",
    gatewayStatus: paymentResult.status || "",
    paymentDate: formatDateTime(paymentResult.paymentDate),
    createdAt: formatDateTime(order.createdAt),
    updatedAt: formatDateTime(order.updatedAt),
  };
}

/**
 * Build and download an orders .xlsx from an in-memory list (client-side).
 * One row per order; the Items column summarizes product/qty per line.
 */
export async function downloadOrdersExcelClient({
  orders = [],
  fromDate,
  toDate,
  status,
  paymentStatus,
  search,
}) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Nimma Ashwini Admin";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Orders", {
    views: [{ state: "frozen", ySplit: 4 }],
  });

  sheet.columns = EXCEL_COLUMNS.map((col) => ({ key: col.key, width: col.width }));

  const title = sheet.addRow(["Orders Report"]);
  sheet.mergeCells(1, 1, 1, EXCEL_COLUMNS.length);
  title.getCell(1).font = { bold: true, size: 14, color: { argb: "FF2A2118" } };

  const meta = sheet.addRow([filterLabel({ fromDate, toDate, status, paymentStatus, search })]);
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
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND_FILL } };
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
    cell.border = cellBorder();
    cell.alignment = { vertical: "middle" };
  });

  // Cancelled orders stay in the export as full records but are excluded
  // from the Total Amount footer below, matching revenue-reporting rules.
  const rows = orders.map(toExcelRow);
  rows.forEach((row, index) => {
    const excelRow = sheet.addRow(EXCEL_COLUMNS.map((col) => row[col.key]));
    excelRow.eachCell((cell, colNumber) => {
      const col = EXCEL_COLUMNS[colNumber - 1];
      cell.border = cellBorder();
      if (index % 2 === 1) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BAND_FILL } };
      }
      if (col.currency && cell.value != null && cell.value !== "") {
        cell.numFmt = "#,##0.00";
      }
    });
  });

  const totalAmount = orders
    .filter((order) => String(order.status || "").toLowerCase() !== "cancelled")
    .reduce((sum, order) => sum + (Number(order.totalAmount ?? order.subtotal) || 0), 0);

  const totalColIndex = EXCEL_COLUMNS.findIndex((col) => col.key === "totalAmount") + 1;
  const footerCells = new Array(EXCEL_COLUMNS.length).fill("");
  footerCells[0] = `Count: ${rows.length}`;
  footerCells[totalColIndex - 2] = "Total (excl. cancelled)";
  footerCells[totalColIndex - 1] = totalAmount;
  const footer = sheet.addRow(footerCells);
  footer.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: TOTAL_FILL } };
    cell.font = { bold: true };
    cell.border = cellBorder();
  });
  footer.getCell(totalColIndex).numFmt = "#,##0.00";

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  saveAs(blob, exportFilename(fromDate, toDate));
}

async function loadAllOrders(filters, token) {
  const limit = 100;
  let page = 1;
  let totalPages;
  const all = [];

  do {
    const data = await fetchAdminOrders({ ...filters, page, limit }, token);
    all.push(...normalizeListResponse(data));
    totalPages = data?.pagination?.totalPages || 1;
    page += 1;
  } while (page <= totalPages);

  return all;
}

/**
 * Prefer server `/admin/orders/export` when available; otherwise fetch every
 * page for the filtered range and build the workbook client-side.
 * @see docs/ADMIN_ORDERS_EXPORT_SCHEMA.md
 */
export async function exportAdminOrders({ filters = {}, token }) {
  const query = {
    fromDate: filters.fromDate || undefined,
    toDate: filters.toDate || undefined,
    status: filters.status || undefined,
    paymentStatus: filters.paymentStatus || undefined,
    search: filters.search || undefined,
  };

  try {
    const { blob, filename } = await downloadAdminOrdersExport(
      { format: "xlsx", ...query },
      token,
    );
    saveAs(blob, filename || exportFilename(query.fromDate, query.toDate));
    return { mode: "server" };
  } catch {
    // Backend export endpoint may not exist yet — fall back to client build.
    const orders = await loadAllOrders(query, token);
    await downloadOrdersExcelClient({
      orders,
      fromDate: query.fromDate,
      toDate: query.toDate,
      status: query.status,
      paymentStatus: query.paymentStatus,
      search: query.search,
    });
    return { mode: "client-excel", count: orders.length };
  }
}
