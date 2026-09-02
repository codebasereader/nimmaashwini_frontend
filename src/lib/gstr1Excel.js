import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import {
  B2CS_COLUMNS,
  CONSOLIDATED_COLUMNS,
  HSN_COLUMNS,
  buildGrandTotal,
  formatGstr1Date,
  formatTaxRate,
} from "./gstr1";

const BRAND_FILL = "FF3D6B4F"; // olive-800, matches app chart/brand color
const BAND_FILL = "FFF7F3EA"; // cream-100 zebra stripe
const TOTAL_FILL = "FFE8F0EA"; // light olive tint for grand total row
const BORDER = { style: "thin", color: { argb: "FFD8CDBB" } }; // cream-300

function cellBorder() {
  return { top: BORDER, left: BORDER, bottom: BORDER, right: BORDER };
}

function numFmtFor(type) {
  if (type === "currency") return "#,##0.00";
  if (type === "integer") return "#,##0";
  return undefined;
}

function cellValue(col, row) {
  if (col.type === "percent") {
    return row.__isTotal ? row[col.key] : formatTaxRate(row[col.key]);
  }
  return row[col.key];
}

function addTitleBlock(sheet, columnCount, title, fromDate, toDate) {
  const titleRow = sheet.addRow([title]);
  sheet.mergeCells(titleRow.number, 1, titleRow.number, columnCount);
  titleRow.getCell(1).font = { bold: true, size: 14, color: { argb: "FF2A2118" } };
  titleRow.getCell(1).alignment = { horizontal: "left" };

  const periodRow = sheet.addRow([
    `Period: ${formatGstr1Date(fromDate)} to ${formatGstr1Date(toDate)}`,
  ]);
  sheet.mergeCells(periodRow.number, 1, periodRow.number, columnCount);
  periodRow.getCell(1).font = { italic: true, size: 10, color: { argb: "FF6B5D4F" } };

  const generatedRow = sheet.addRow([
    `Generated on: ${new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date())}`,
  ]);
  sheet.mergeCells(generatedRow.number, 1, generatedRow.number, columnCount);
  generatedRow.getCell(1).font = { italic: true, size: 10, color: { argb: "FF6B5D4F" } };

  sheet.addRow([]);
}

function addHeaderRow(sheet, columns) {
  const headerRow = sheet.addRow(columns.map((col) => col.label));
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND_FILL } };
    cell.border = cellBorder();
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
  });
  headerRow.height = 22;
  return headerRow;
}

function addDataRows(sheet, columns, rows) {
  rows.forEach((row, index) => {
    const values = columns.map((col) => cellValue(col, row));
    const excelRow = sheet.addRow(values);
    const isBanded = index % 2 === 1;
    excelRow.eachCell((cell, colNumber) => {
      const col = columns[colNumber - 1];
      cell.border = cellBorder();
      if (col.type === "currency" || col.type === "integer") {
        cell.numFmt = numFmtFor(col.type);
        cell.alignment = { horizontal: "right" };
      } else if (col.type === "percent") {
        cell.alignment = { horizontal: "center" };
      } else {
        cell.alignment = { horizontal: "left" };
      }
      if (isBanded) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BAND_FILL } };
      }
    });
  });
}

function addGrandTotalRow(sheet, columns, rows, summary) {
  const total = buildGrandTotal(columns, rows, summary);
  const values = columns.map((col) => cellValue(col, total));
  const totalRow = sheet.addRow(values);
  totalRow.eachCell((cell, colNumber) => {
    const col = columns[colNumber - 1];
    cell.font = { bold: true };
    cell.border = {
      top: { style: "double", color: { argb: "FF3D6B4F" } },
      left: BORDER,
      bottom: BORDER,
      right: BORDER,
    };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: TOTAL_FILL } };
    if (col.type === "currency" || col.type === "integer") {
      cell.numFmt = numFmtFor(col.type);
      cell.alignment = { horizontal: "right" };
    } else {
      cell.alignment = { horizontal: "left" };
    }
  });
  return totalRow;
}

function buildSheet(workbook, { name, title, columns, rows, summary, fromDate, toDate }) {
  const sheet = workbook.addWorksheet(name, {
    views: [{ state: "frozen", ySplit: 0 }],
  });

  sheet.columns = columns.map((col) => ({ width: col.width || 16 }));

  addTitleBlock(sheet, columns.length, title, fromDate, toDate);
  const headerRow = addHeaderRow(sheet, columns);
  addDataRows(sheet, columns, rows);
  addGrandTotalRow(sheet, columns, rows, summary);

  sheet.views = [{ state: "frozen", ySplit: headerRow.number }];
  sheet.autoFilter = {
    from: { row: headerRow.number, column: 1 },
    to: { row: headerRow.number, column: columns.length },
  };

  return sheet;
}

/**
 * Build and download a single .xlsx workbook with 3 sheets:
 * Consolidated, B2CS, HSN (B2C). All rows must already be normalized via
 * toConsolidatedRow / toB2csRow / toHsnRow (src/lib/gstr1.js) and represent
 * the FULL (unpaginated) dataset for the selected date range.
 */
export async function downloadGstr1Excel({
  fromDate,
  toDate,
  consolidatedRows = [],
  consolidatedSummary,
  b2csRows = [],
  b2csSummary,
  hsnRows = [],
  hsnSummary,
}) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Nimma Ashwini Admin";
  workbook.created = new Date();

  buildSheet(workbook, {
    name: "Consolidated",
    title: "Nimma Ashwini — GSTR-1 Report — Consolidated",
    columns: CONSOLIDATED_COLUMNS,
    rows: consolidatedRows,
    summary: consolidatedSummary,
    fromDate,
    toDate,
  });

  buildSheet(workbook, {
    name: "B2CS",
    title: "Nimma Ashwini — GSTR-1 Report — B2CS",
    columns: B2CS_COLUMNS,
    rows: b2csRows,
    summary: b2csSummary,
    fromDate,
    toDate,
  });

  buildSheet(workbook, {
    name: "HSN (B2C)",
    title: "Nimma Ashwini — GSTR-1 Report — HSN (B2C)",
    columns: HSN_COLUMNS,
    rows: hsnRows,
    summary: hsnSummary,
    fromDate,
    toDate,
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  saveAs(blob, `GSTR1_${fromDate}_to_${toDate}.xlsx`);
}
