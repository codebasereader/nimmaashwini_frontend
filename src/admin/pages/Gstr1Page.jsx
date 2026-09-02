import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  AlertTriangle,
  Download,
  FileSpreadsheet,
  IndianRupee,
  Percent,
  Receipt,
} from "lucide-react";
import {
  fetchGstr1B2cs,
  fetchGstr1Consolidated,
  fetchGstr1HsnSummary,
} from "../../api/gstr1";
import {
  loadGstr1B2cs,
  loadGstr1Consolidated,
  loadGstr1HsnSummary,
} from "../../store/slices/gstr1Slice";
import { iconProps } from "../../lib/icons";
import {
  B2CS_COLUMNS,
  CONSOLIDATED_COLUMNS,
  HSN_COLUMNS,
  buildGrandTotal,
  formatINR,
  toB2csRow,
  toConsolidatedRow,
  toDisplayColumns,
  toHsnRow,
} from "../../lib/gstr1";
import { downloadGstr1Excel } from "../../lib/gstr1Excel";
import AdminDataTable from "../components/AdminDataTable";
import AdminPagination from "../components/AdminPagination";
import AdminTabs from "../components/AdminTabs";
import DateRangeFilter, { defaultMonthRange } from "../components/DateRangeFilter";

const TABS = [
  { id: "consolidated", label: "Consolidated" },
  { id: "b2cs", label: "B2CS" },
  { id: "hsn", label: "HSN (B2C)" },
];

const REPORT_LIMIT = 25;

function KpiCard({ icon: Icon, label, value, accent = "text-olive-700" }) {
  return (
    <div className="rounded-lg border border-cream-300 bg-white px-4 py-4 shadow-[var(--shadow-card)]">
      <div className="mb-3 flex items-center gap-2">
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-md bg-cream-100 ${accent}`}
        >
          <Icon {...iconProps(16)} />
        </span>
        <p className="text-caption font-semibold tracking-[0.1em] text-brown-500 uppercase">
          {label}
        </p>
      </div>
      <p className="font-display text-xl text-brown-900 sm:text-2xl">{value}</p>
    </div>
  );
}

function GrandTotalBar({ rawColumns, totalRow }) {
  const chips = rawColumns.filter(
    (col) => col.type === "currency" || col.type === "integer",
  );
  if (!chips.length) return null;

  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg border border-cream-300 bg-cream-100 px-4 py-3 text-body-sm">
      <span className="text-[0.65rem] font-semibold tracking-wider text-olive-800 uppercase">
        Grand Total
      </span>
      {chips.map((col) => (
        <span key={col.key} className="text-brown-800">
          <span className="text-brown-500">{col.label}: </span>
          <span className="font-semibold">
            {col.type === "currency"
              ? formatINR(totalRow[col.key])
              : Number(totalRow[col.key] || 0).toLocaleString("en-IN")}
          </span>
        </span>
      ))}
    </div>
  );
}

function ReportTab({
  columns,
  mapRow,
  report,
  page,
  onPrev,
  onNext,
  emptyMessage,
}) {
  const rows = useMemo(
    () => (report.items || []).map(mapRow),
    [report.items, mapRow],
  );
  const displayColumns = useMemo(() => toDisplayColumns(columns), [columns]);
  const grandTotal = useMemo(
    () => buildGrandTotal(columns, rows, report.summary),
    [columns, rows, report.summary],
  );

  if (report.status === "loading" && !rows.length) {
    return (
      <div className="card flex items-center justify-center py-16">
        <p className="text-body-sm text-brown-500">Loading report...</p>
      </div>
    );
  }

  if (report.status === "failed") {
    return (
      <div className="rounded-lg border border-terracotta-400/40 bg-terracotta-500/10 px-4 py-3 text-body-sm text-terracotta-600">
        {report.error}
      </div>
    );
  }

  return (
    <>
      <AdminDataTable
        columns={displayColumns}
        rows={rows}
        emptyMessage={emptyMessage}
      />
      <AdminPagination
        pagination={report.pagination}
        onPrev={() => onPrev(Math.max(1, page - 1))}
        onNext={() => onNext(page + 1)}
      />
      <GrandTotalBar rawColumns={columns} totalRow={grandTotal} />
    </>
  );
}

export default function Gstr1Page() {
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.token);
  const { consolidated, b2cs, hsnSummary } = useSelector((state) => state.gstr1);

  const initialRange = useMemo(() => defaultMonthRange(), []);
  const [fromDate, setFromDate] = useState(initialRange.fromDate);
  const [toDate, setToDate] = useState(initialRange.toDate);
  const [appliedRange, setAppliedRange] = useState(initialRange);
  const [activeTab, setActiveTab] = useState("consolidated");
  const [consolidatedPage, setConsolidatedPage] = useState(1);
  const [b2csPage, setB2csPage] = useState(1);
  const [hsnPage, setHsnPage] = useState(1);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState(null);

  const applying =
    consolidated.status === "loading" ||
    b2cs.status === "loading" ||
    hsnSummary.status === "loading";

  useEffect(() => {
    dispatch(
      loadGstr1Consolidated({
        fromDate: appliedRange.fromDate,
        toDate: appliedRange.toDate,
        page: consolidatedPage,
        limit: REPORT_LIMIT,
      }),
    );
  }, [dispatch, appliedRange, consolidatedPage]);

  useEffect(() => {
    dispatch(
      loadGstr1B2cs({
        fromDate: appliedRange.fromDate,
        toDate: appliedRange.toDate,
        page: b2csPage,
        limit: REPORT_LIMIT,
      }),
    );
  }, [dispatch, appliedRange, b2csPage]);

  useEffect(() => {
    dispatch(
      loadGstr1HsnSummary({
        fromDate: appliedRange.fromDate,
        toDate: appliedRange.toDate,
        page: hsnPage,
        limit: REPORT_LIMIT,
      }),
    );
  }, [dispatch, appliedRange, hsnPage]);

  const applyDateRange = () => {
    if (!fromDate || !toDate || fromDate > toDate) return;
    setAppliedRange({ fromDate, toDate });
    setConsolidatedPage(1);
    setB2csPage(1);
    setHsnPage(1);
  };

  const summary = consolidated.summary;
  const incompleteOrders = Number(summary?.incompleteOrders) || 0;

  const handleDownloadExcel = async () => {
    if (!appliedRange.fromDate || !appliedRange.toDate) return;
    setDownloading(true);
    setDownloadError(null);
    try {
      const params = {
        fromDate: appliedRange.fromDate,
        toDate: appliedRange.toDate,
        all: true,
      };
      const [allConsolidated, allB2cs, allHsn] = await Promise.all([
        fetchGstr1Consolidated(params, token),
        fetchGstr1B2cs(params, token),
        fetchGstr1HsnSummary(params, token),
      ]);

      await downloadGstr1Excel({
        fromDate: appliedRange.fromDate,
        toDate: appliedRange.toDate,
        consolidatedRows: (allConsolidated?.items || []).map(toConsolidatedRow),
        consolidatedSummary: allConsolidated?.summary,
        b2csRows: (allB2cs?.items || []).map(toB2csRow),
        b2csSummary: allB2cs?.summary,
        hsnRows: (allHsn?.items || []).map(toHsnRow),
        hsnSummary: allHsn?.summary,
      });
    } catch (error) {
      setDownloadError(error.message || "Failed to generate the Excel file");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="section-label mb-2">Compliance</p>
          <h1 className="font-display text-display-sm text-brown-900">
            GSTR-1 Filing
          </h1>
          <p className="mt-1 text-body-sm text-brown-500">
            Consolidated sales report for GST return filing
          </p>
        </div>
        <button
          type="button"
          onClick={handleDownloadExcel}
          disabled={downloading || applying || !appliedRange.fromDate || !appliedRange.toDate}
          className="btn btn-primary shrink-0 px-4 py-2.5 text-[0.68rem] disabled:opacity-60"
        >
          <Download {...iconProps(14)} />
          {downloading ? "Preparing Excel..." : "Download Excel"}
        </button>
      </div>

      <DateRangeFilter
        fromDate={fromDate}
        toDate={toDate}
        onFromChange={setFromDate}
        onToChange={setToDate}
        onApply={applyDateRange}
        applying={applying}
      />

      {downloadError && (
        <div className="rounded-lg border border-terracotta-400/40 bg-terracotta-500/10 px-4 py-3 text-body-sm text-terracotta-600">
          {downloadError}
        </div>
      )}

      {incompleteOrders > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-400/40 bg-amber-100/60 px-4 py-3 text-body-sm text-amber-800">
          <AlertTriangle {...iconProps(16)} className="mt-0.5 shrink-0" />
          <p>
            {incompleteOrders} order{incompleteOrders === 1 ? "" : "s"} in this
            period {incompleteOrders === 1 ? "is" : "are"} missing a GST tax
            breakdown and {incompleteOrders === 1 ? "was" : "were"} excluded
            from this report. Fix {incompleteOrders === 1 ? "it" : "them"}{" "}
            before filing.
          </p>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={Receipt}
          label="Total Invoices"
          value={Number(summary?.totalOrders || 0).toLocaleString("en-IN")}
        />
        <KpiCard
          icon={IndianRupee}
          label="Total Taxable Value"
          value={formatINR(summary?.totalTaxableValue)}
        />
        <KpiCard
          icon={Percent}
          label="Total CGST + SGST"
          value={formatINR(
            (Number(summary?.totalCgstAmount) || 0) +
              (Number(summary?.totalSgstAmount) || 0),
          )}
        />
        <KpiCard
          icon={FileSpreadsheet}
          label="Total IGST"
          value={formatINR(summary?.totalIgstAmount)}
        />
      </div>

      <div className="space-y-4">
        <AdminTabs tabs={TABS} activeId={activeTab} onChange={setActiveTab} />

        {activeTab === "consolidated" && (
          <ReportTab
            columns={CONSOLIDATED_COLUMNS}
            mapRow={toConsolidatedRow}
            report={consolidated}
            page={consolidatedPage}
            onPrev={setConsolidatedPage}
            onNext={setConsolidatedPage}
            emptyMessage="No dispatched orders in this period."
          />
        )}

        {activeTab === "b2cs" && (
          <ReportTab
            columns={B2CS_COLUMNS}
            mapRow={toB2csRow}
            report={b2cs}
            page={b2csPage}
            onPrev={setB2csPage}
            onNext={setB2csPage}
            emptyMessage="No B2CS data for this period."
          />
        )}

        {activeTab === "hsn" && (
          <ReportTab
            columns={HSN_COLUMNS}
            mapRow={toHsnRow}
            report={hsnSummary}
            page={hsnPage}
            onPrev={setHsnPage}
            onNext={setHsnPage}
            emptyMessage="No products sold in this period."
          />
        )}
      </div>
    </div>
  );
}
