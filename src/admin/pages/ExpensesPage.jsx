import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FileSpreadsheet, FileText, Plus, Receipt, Search } from "lucide-react";
import {
  clearExpenseCurrent,
  clearExpenseErrors,
  loadExpenseById,
  loadExpenses,
  removeExpense,
} from "../../store/slices/expensesSlice";
import { loadVendors } from "../../store/slices/vendorsSlice";
import { getEntityId } from "../../store/slices/crudHelpers";
import { iconProps } from "../../lib/icons";
import { exportExpenses } from "../../lib/expenseExport";
import { formatINR } from "../lib/purchaseMath";
import { getRowId } from "../lib/entityId";
import { useAdminEditById } from "../lib/useAdminEditById";
import AdminDataTable, { StatusPill } from "../components/AdminDataTable";
import { AdminInput, AdminSelect } from "../components/AdminFormFields";
import ConfirmDialog from "../components/ConfirmDialog";
import DateRangeFilter, { defaultMonthRange } from "../components/DateRangeFilter";
import ExpenseFormDrawer from "../components/ExpenseFormDrawer";

function formatDisplayDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function ExpensesPage() {
  const dispatch = useDispatch();
  const {
    items,
    current,
    status,
    error,
    detailStatus,
    detailError,
    mutationStatus,
  } = useSelector((state) => state.expenses);
  const { items: vendors, status: vendorsStatus } = useSelector(
    (state) => state.vendors,
  );
  const token = useSelector((state) => state.auth.token);

  const defaultRange = useMemo(() => defaultMonthRange(), []);
  const [fromDate, setFromDate] = useState(defaultRange.fromDate);
  const [toDate, setToDate] = useState(defaultRange.toDate);
  const [appliedRange, setAppliedRange] = useState(defaultRange);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [vendorId, setVendorId] = useState("");
  const [exporting, setExporting] = useState(null);
  const [exportError, setExportError] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const {
    drawerOpen,
    isEditing,
    localDetailError,
    openCreate,
    openEdit,
    closeDrawer,
  } = useAdminEditById({
    loadById: loadExpenseById,
    clearErrors: clearExpenseErrors,
    clearCurrent: clearExpenseCurrent,
  });

  const listParams = useMemo(
    () => ({
      limit: 100,
      fromDate: appliedRange.fromDate || undefined,
      toDate: appliedRange.toDate || undefined,
      search: search || undefined,
      vendorId: vendorId || undefined,
    }),
    [appliedRange.fromDate, appliedRange.toDate, search, vendorId],
  );

  const vendorLabel = useMemo(() => {
    if (!vendorId) return "";
    const match = (vendors || []).find(
      (vendor) => getEntityId(vendor) === vendorId,
    );
    return match?.name || "";
  }, [vendorId, vendors]);

  useEffect(() => {
    dispatch(loadVendors({ limit: 100 }));
  }, [dispatch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    dispatch(loadExpenses(listParams));
  }, [dispatch, listParams]);

  const applyDateRange = () => {
    if (!fromDate || !toDate || fromDate > toDate) return;
    setAppliedRange({ fromDate, toDate });
  };

  const clearFilters = () => {
    const range = defaultMonthRange();
    setFromDate(range.fromDate);
    setToDate(range.toDate);
    setAppliedRange(range);
    setSearchInput("");
    setSearch("");
    setVendorId("");
    setExportError(null);
  };

  const handleExport = async (format) => {
    setExporting(format);
    setExportError(null);
    try {
      await exportExpenses({
        format,
        filters: {
          fromDate: appliedRange.fromDate,
          toDate: appliedRange.toDate,
          search,
          vendorId,
        },
        token,
        vendorLabel,
      });
    } catch (err) {
      setExportError(err.message || `Failed to export ${format.toUpperCase()}`);
    } finally {
      setExporting(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const result = await dispatch(removeExpense(getRowId(deleteTarget)));
    if (result.meta.requestStatus === "fulfilled") {
      setDeleteTarget(null);
      dispatch(loadExpenses(listParams));
    }
  };

  const columns = [
    {
      key: "expenseDate",
      label: "Date",
      render: (row) => formatDisplayDate(row.expenseDate || row.date),
    },
    {
      key: "vendor",
      label: "Vendor",
      render: (row) =>
        row.vendorSnapshot?.name ||
        row.vendor?.name ||
        row.vendorName ||
        "—",
    },
    {
      key: "category",
      label: "Category",
      render: (row) =>
        row.categorySnapshot?.name ||
        row.category?.name ||
        row.categoryName ||
        "—",
    },
    {
      key: "amount",
      label: "Amount",
      align: "right",
      render: (row) => formatINR(row.totalAmount ?? row.amount),
    },
    {
      key: "payment",
      label: "Payment",
      render: (row) => (
        <StatusPill status={row.isPaid ? "paid" : "unpaid"} />
      ),
    },
    {
      key: "paymentType",
      label: "Type",
      render: (row) =>
        row.paymentType || row.payment?.paymentType || "—",
    },
    {
      key: "notes",
      label: "Notes",
      render: (row) => (
        <span className="line-clamp-1 max-w-56">
          {row.notes || "—"}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      align: "right",
      render: (row) => (
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              openEdit(row);
            }}
            className="focus-ring rounded-sm px-3 py-1.5 text-[0.65rem] font-semibold tracking-wider text-olive-800 uppercase hover:bg-olive-100"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setDeleteTarget(row);
            }}
            className="focus-ring rounded-sm px-3 py-1.5 text-[0.65rem] font-semibold tracking-wider text-terracotta-600 uppercase hover:bg-terracotta-500/10"
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  const hasActiveFilters = Boolean(
    search ||
      vendorId ||
      appliedRange.fromDate !== defaultRange.fromDate ||
      appliedRange.toDate !== defaultRange.toDate,
  );

  return (
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="section-label mb-2">Expenses</p>
          <h1 className="font-display text-display-sm text-brown-900">
            Expenses
          </h1>
          <p className="mt-1 text-body-sm text-brown-500">
            Track business expenses, tax, and payments
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handleExport("xlsx")}
            disabled={Boolean(exporting)}
            className="btn btn-secondary shrink-0 px-4 py-2.5 text-[0.68rem] disabled:opacity-50"
          >
            <FileSpreadsheet {...iconProps(16)} />
            {exporting === "xlsx" ? "Preparing…" : "Excel"}
          </button>
          <button
            type="button"
            onClick={() => handleExport("pdf")}
            disabled={Boolean(exporting)}
            className="btn btn-secondary shrink-0 px-4 py-2.5 text-[0.68rem] disabled:opacity-50"
          >
            <FileText {...iconProps(16)} />
            {exporting === "pdf" ? "Preparing…" : "PDF"}
          </button>
          <button
            type="button"
            onClick={openCreate}
            className="btn btn-primary shrink-0 px-4 py-2.5 text-[0.68rem]"
          >
            <Plus {...iconProps(16)} />
            Add Expense
          </button>
        </div>
      </div>

      <div className="mb-4 space-y-3">
        <DateRangeFilter
          fromDate={fromDate}
          toDate={toDate}
          onFromChange={setFromDate}
          onToChange={setToDate}
          onApply={applyDateRange}
          applying={status === "loading"}
        />

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_14rem_auto]">
          <div className="relative">
            <Search
              {...iconProps(16)}
              className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-brown-400"
            />
            <AdminInput
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search notes, invoice, vendor, category…"
              className="pl-9"
              aria-label="Search expenses"
              name="admin-expenses-search"
              autoComplete="off"
            />
          </div>
          <AdminSelect
            value={vendorId}
            onChange={(event) => setVendorId(event.target.value)}
            aria-label="Filter by vendor"
            disabled={vendorsStatus === "loading"}
          >
            <option value="">All vendors</option>
            {(vendors || []).map((vendor) => {
              const id = getEntityId(vendor);
              if (!id) return null;
              return (
                <option key={id} value={id}>
                  {vendor.name || "Unnamed vendor"}
                </option>
              );
            })}
          </AdminSelect>
          <button
            type="button"
            onClick={clearFilters}
            className="focus-ring rounded-md border border-cream-300 bg-white px-3.5 py-2.5 text-[0.65rem] font-semibold tracking-wider text-brown-600 uppercase hover:bg-cream-100"
          >
            Reset
          </button>
        </div>
      </div>

      {exportError && (
        <div className="mb-4 rounded-lg border border-terracotta-400/40 bg-terracotta-500/10 px-4 py-3 text-body-sm text-terracotta-600">
          {exportError}
        </div>
      )}

      {status === "loading" && (
        <div className="card flex items-center justify-center py-16">
          <p className="text-body-sm text-brown-500">Loading expenses...</p>
        </div>
      )}

      {status === "failed" && (
        <div className="rounded-lg border border-terracotta-400/40 bg-terracotta-500/10 px-4 py-3 text-body-sm text-terracotta-600">
          {error}
        </div>
      )}

      {status === "succeeded" && items.length === 0 && !hasActiveFilters && (
        <div className="card flex flex-col items-center justify-center px-6 py-20 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-olive-100 text-olive-800">
            <Receipt {...iconProps(28)} />
          </div>
          <h2 className="font-display text-xl text-brown-900">
            No expenses yet
          </h2>
          <p className="mt-2 max-w-md text-body-sm text-brown-500">
            Create your first expense with amount, category, optional tax, and
            payment details.
          </p>
          <button
            type="button"
            onClick={openCreate}
            className="btn btn-primary mt-6 px-5 py-2.5 text-[0.68rem]"
          >
            <Plus {...iconProps(16)} />
            Add Expense
          </button>
        </div>
      )}

      {status === "succeeded" && (items.length > 0 || hasActiveFilters) && (
        <AdminDataTable
          columns={columns}
          rows={items}
          onRowClick={openEdit}
          emptyMessage={
            hasActiveFilters
              ? "No expenses match these filters."
              : "No expenses found."
          }
        />
      )}

      <ExpenseFormDrawer
        open={drawerOpen}
        onClose={() => {
          closeDrawer();
          dispatch(loadExpenses(listParams));
        }}
        expense={isEditing ? current : null}
        detailLoading={isEditing && detailStatus === "loading"}
        detailError={isEditing ? localDetailError || detailError : null}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete expense?"
        message={`Expense of ${formatINR(deleteTarget?.amount)} will be permanently removed.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={mutationStatus === "loading"}
      />
    </>
  );
}
