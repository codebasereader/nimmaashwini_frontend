import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FileSpreadsheet, Plus, Search } from "lucide-react";
import {
  clearAdminOrderDetail,
  clearAdminOrderErrors,
  createAdminOrder,
  editAdminOrderStatus,
  loadAdminOrderById,
  loadAdminOrders,
} from "../../../store/slices/adminOrdersSlice";
import { iconProps } from "../../../lib/icons";
import { exportAdminOrders } from "../../../lib/orderExport";
import AdminDataTable, { StatusPill } from "../../components/AdminDataTable";
import AdminPagination from "../../components/AdminPagination";
import { AdminInput, AdminSelect } from "../../components/AdminFormFields";
import ConfirmDialog from "../../components/ConfirmDialog";
import DateRangeFilter from "../../components/DateRangeFilter";
import OrderDetailDrawer from "./OrderDetailDrawer";
import OrderFormDrawer from "./OrderFormDrawer";
import { formatINR } from "./orderMath";

const ORDER_STATUSES = [
  { value: "", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const PAYMENT_STATUSES = [
  { value: "", label: "All payments" },
  { value: "initiated", label: "Initiated" },
  { value: "COMPLETED", label: "Completed" },
  { value: "FAILED", label: "Failed" },
];

function formatDateTime(iso) {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

const DATE_PRESETS = [
  { key: "today", label: "Today", getRange: getTodayRange },
  { key: "yesterday", label: "Yesterday", getRange: getYesterdayRange },
  { key: "this-month", label: "This Month", getRange: getThisMonthRange },
  { key: "3-months", label: "3 Months", getRange: () => getPastMonthsRange(3) },
  { key: "6-months", label: "6 Months", getRange: () => getPastMonthsRange(6) },
  { key: "1-year", label: "1 Year", getRange: () => getPastMonthsRange(12) },
];

function toISODate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getTodayRange(reference = new Date()) {
  return {
    fromDate: toISODate(reference),
    toDate: toISODate(reference),
  };
}

function getYesterdayRange(reference = new Date()) {
  const date = new Date(reference);
  date.setDate(date.getDate() - 1);
  return {
    fromDate: toISODate(date),
    toDate: toISODate(date),
  };
}

function getThisMonthRange(reference = new Date()) {
  return {
    fromDate: toISODate(new Date(reference.getFullYear(), reference.getMonth(), 1)),
    toDate: toISODate(reference),
  };
}

function getPastMonthsRange(months, reference = new Date()) {
  const to = new Date(reference);
  const from = new Date(reference);
  from.setMonth(from.getMonth() - (months - 1));
  from.setDate(1);
  return {
    fromDate: toISODate(from),
    toDate: toISODate(to),
  };
}

export default function OrdersPage() {
  const dispatch = useDispatch();
  const {
    items,
    pagination,
    status,
    error,
    selected,
    detailStatus,
    detailError,
    mutationStatus,
    mutationError,
  } = useSelector((state) => state.adminOrders);
  const token = useSelector((state) => state.auth.token);

  const defaultRange = useMemo(() => getThisMonthRange(), []);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState(defaultRange.fromDate);
  const [toDate, setToDate] = useState(defaultRange.toDate);
  const [appliedRange, setAppliedRange] = useState(defaultRange);
  const [activePreset, setActivePreset] = useState("this-month");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [editingStatus, setEditingStatus] = useState("pending");
  const [pendingStatus, setPendingStatus] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState(null);

  const listParams = useMemo(
    () => ({
      page,
      limit: 20,
      status: statusFilter || undefined,
      paymentStatus: paymentStatusFilter || undefined,
      search: search || undefined,
      fromDate: appliedRange.fromDate || undefined,
      toDate: appliedRange.toDate || undefined,
    }),
    [
      page,
      statusFilter,
      paymentStatusFilter,
      search,
      appliedRange.fromDate,
      appliedRange.toDate,
    ],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      const next = searchInput.trim();
      setSearch((prev) => {
        if (prev !== next) setPage(1);
        return next;
      });
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    dispatch(loadAdminOrders(listParams));
  }, [dispatch, listParams]);

  const openDetail = async (row) => {
    setEditingStatus(String(row.status || "pending").toLowerCase());
    setDrawerOpen(true);
    const action = await dispatch(loadAdminOrderById(row.id));
    if (action.meta.requestStatus === "fulfilled" && action.payload?.status) {
      setEditingStatus(String(action.payload.status).toLowerCase());
    }
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setPendingStatus(null);
    dispatch(clearAdminOrderDetail());
  };

  const openCreate = () => {
    dispatch(clearAdminOrderErrors());
    setFormKey((value) => value + 1);
    setFormOpen(true);
  };

  const closeForm = () => {
    const previousSearch = searchInput;
    setFormOpen(false);
    dispatch(clearAdminOrderErrors());
    scrubSearchAutofillLeak(previousSearch);
  };

  const scrubSearchAutofillLeak = (previousSearch, leakedPhone = "") => {
    const previous = previousSearch ?? "";
    const phoneDigits = String(leakedPhone || "").replace(/\D/g, "");

    const apply = () => {
      setSearchInput((current) => {
        if (current === previous) return current;
        const currentDigits = String(current || "").replace(/\D/g, "");
        const looksLikePhone = /^[+]?[\d\s-]{8,15}$/.test(String(current).trim());
        const matchesSavedPhone =
          phoneDigits.length >= 8 && currentDigits === phoneDigits;
        if (matchesSavedPhone || (previous.trim() === "" && looksLikePhone)) {
          return previous;
        }
        return current;
      });
    };

    queueMicrotask(apply);
    window.setTimeout(apply, 0);
    window.setTimeout(apply, 100);
  };

  const applyDateRange = (nextRange = { fromDate, toDate }, presetKey = null) => {
    setAppliedRange(nextRange);
    setFromDate(nextRange.fromDate);
    setToDate(nextRange.toDate);
    setPage(1);
    setActivePreset(presetKey);
  };

  const handlePresetClick = (preset) => {
    const nextRange = preset.getRange();
    applyDateRange(nextRange, preset.key);
  };

  const handleExport = async () => {
    setExporting(true);
    setExportError(null);
    try {
      await exportAdminOrders({
        filters: {
          fromDate: appliedRange.fromDate,
          toDate: appliedRange.toDate,
          status: statusFilter,
          paymentStatus: paymentStatusFilter,
          search,
        },
        token,
      });
    } catch (err) {
      setExportError(err.message || "Failed to export orders");
    } finally {
      setExporting(false);
    }
  };

  const handleSaveStatus = async () => {
    if (!selected?.id || !editingStatus) return;
    const currentStatus = String(selected.status || "").toLowerCase();
    if (editingStatus === currentStatus) return;
    if (editingStatus === "cancelled") {
      setPendingStatus("cancelled");
      return;
    }
    await submitStatusChange(editingStatus);
  };

  const submitStatusChange = async (nextStatus) => {
    if (!selected?.id || !nextStatus) return;
    const action = await dispatch(
      editAdminOrderStatus({ id: selected.id, status: nextStatus }),
    );
    if (action.meta.requestStatus === "fulfilled") {
      dispatch(loadAdminOrders(listParams));
      setPendingStatus(null);
    }
  };

  const handleCreateOrder = async (payload) => {
    const previousSearch = searchInput;
    const action = await dispatch(createAdminOrder(payload));
    if (action.meta.requestStatus === "fulfilled") {
      setFormOpen(false);
      dispatch(loadAdminOrders(listParams));
      scrubSearchAutofillLeak(
        previousSearch,
        payload?.customer?.contactNumber || payload?.customer?.alternateNumber,
      );
    }
  };

  const columns = [
    {
      key: "orderNumber",
      label: "Order #",
      render: (row) => (
        <span className="font-medium text-brown-900">
          {row.orderNumber || "—"}
          {(row.manual_entry || row.manualEntry) && (
            <span className="ml-2 inline-flex rounded-full bg-olive-100 px-1.5 py-0.5 text-[0.55rem] font-semibold tracking-wider text-olive-800 uppercase">
              Manual
            </span>
          )}
        </span>
      ),
    },
    {
      key: "customer",
      label: "Customer",
      render: (row) => row.customer?.name || "—",
    },
    {
      key: "phone",
      label: "Phone",
      render: (row) => row.customer?.contactNumber || "—",
    },
    {
      key: "subtotal",
      label: "Total",
      align: "right",
      render: (row) => formatINR(row.totalAmount ?? row.subtotal),
    },
    {
      key: "status",
      label: "Status",
      render: (row) => <StatusPill status={row.status} />,
    },
    {
      key: "paymentStatus",
      label: "Payment",
      render: (row) => <StatusPill status={row.paymentStatus} />,
    },
    {
      key: "createdAt",
      label: "Created",
      render: (row) => formatDateTime(row.createdAt),
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
              openDetail(row);
            }}
            className="focus-ring rounded-sm px-3 py-1.5 text-[0.65rem] font-semibold tracking-wider text-olive-800 uppercase hover:bg-olive-100"
          >
            View
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              dispatch(clearAdminOrderErrors());
              openDetail(row);
            }}
            className="focus-ring rounded-sm px-3 py-1.5 text-[0.65rem] font-semibold tracking-wider text-brown-700 uppercase hover:bg-cream-200"
          >
            Edit Status
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="section-label mb-2">Sales</p>
          <h1 className="font-display text-display-sm text-brown-900">Orders</h1>
          <p className="mt-1 text-body-sm text-brown-500">
            View customer orders, add manual sales, and update status
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className="btn btn-secondary shrink-0 px-4 py-2.5 text-[0.68rem] disabled:opacity-50"
          >
            <FileSpreadsheet {...iconProps(16)} />
            {exporting ? "Preparing…" : "Export Excel"}
          </button>
          <button
            type="button"
            onClick={openCreate}
            className="btn btn-primary shrink-0 px-4 py-2.5 text-[0.68rem]"
          >
            <Plus {...iconProps(14)} />
            Add Order
          </button>
        </div>
      </div>

      {exportError && (
        <div className="mb-4 rounded-lg border border-terracotta-400/40 bg-terracotta-500/10 px-4 py-3 text-body-sm text-terracotta-600">
          {exportError}
        </div>
      )}

      <div className="mb-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          {DATE_PRESETS.map((preset) => (
            <button
              key={preset.key}
              type="button"
              onClick={() => handlePresetClick(preset)}
              className={`focus-ring rounded-sm border px-3 py-2 text-[0.65rem] font-semibold tracking-wider uppercase transition-colors ${
                activePreset === preset.key
                  ? "border-olive-800 bg-olive-800 text-white"
                  : "border-cream-300 bg-white text-brown-700 hover:bg-olive-100 hover:text-olive-800"
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <DateRangeFilter
          fromDate={fromDate}
          toDate={toDate}
          onFromChange={(value) => {
            setFromDate(value);
            setActivePreset(null);
            setPage(1);
          }}
          onToChange={(value) => {
            setToDate(value);
            setActivePreset(null);
            setPage(1);
          }}
          onApply={() => applyDateRange({ fromDate, toDate }, null)}
          applying={status === "loading"}
        />
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative lg:col-span-2">
          <Search
            {...iconProps(16)}
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-brown-400"
          />
          <AdminInput
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search order #, name, phone, city..."
            className="pl-9"
            aria-label="Search orders"
            name="admin-orders-search"
            autoComplete="off"
            data-1p-ignore
            data-lpignore="true"
          />
        </div>
        <AdminSelect
          value={statusFilter}
          onChange={(event) => {
            setStatusFilter(event.target.value);
            setPage(1);
          }}
          aria-label="Filter by order status"
        >
          {ORDER_STATUSES.map((option) => (
            <option key={option.value || "all-status"} value={option.value}>
              {option.label}
            </option>
          ))}
        </AdminSelect>
        <AdminSelect
          value={paymentStatusFilter}
          onChange={(event) => {
            setPaymentStatusFilter(event.target.value);
            setPage(1);
          }}
          aria-label="Filter by payment status"
        >
          {PAYMENT_STATUSES.map((option) => (
            <option key={option.value || "all-payment"} value={option.value}>
              {option.label}
            </option>
          ))}
        </AdminSelect>
      </div>

      {status === "loading" && (
        <div className="card flex items-center justify-center py-16">
          <p className="text-body-sm text-brown-500">Loading orders...</p>
        </div>
      )}

      {status === "failed" && (
        <div className="rounded-lg border border-terracotta-400/40 bg-terracotta-500/10 px-4 py-3 text-body-sm text-terracotta-600">
          {error}
        </div>
      )}

      {status === "succeeded" && (
        <>
          <AdminDataTable
            columns={columns}
            rows={items}
            emptyMessage="No orders found."
            onRowClick={openDetail}
          />

          <AdminPagination
            pagination={pagination}
            onPrev={() => setPage((value) => Math.max(1, value - 1))}
            onNext={() => setPage((value) => value + 1)}
          />
        </>
      )}

      <OrderDetailDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        order={selected}
        loading={detailStatus === "loading"}
        error={detailError}
        statusValue={editingStatus}
        onStatusChange={setEditingStatus}
        onSaveStatus={handleSaveStatus}
        saving={mutationStatus === "loading"}
        mutationError={mutationError}
      />

      <OrderFormDrawer
        key={formKey}
        open={formOpen}
        onClose={closeForm}
        onSave={handleCreateOrder}
        saving={mutationStatus === "loading"}
        error={mutationError}
      />

      <ConfirmDialog
        open={pendingStatus === "cancelled"}
        title="Cancel this order?"
        message="Cancelled orders should not be counted in revenue. Are you sure you want to mark this order as cancelled?"
        confirmLabel="Yes, Cancel Order"
        onConfirm={() => submitStatusChange("cancelled")}
        onCancel={() => setPendingStatus(null)}
        loading={mutationStatus === "loading"}
      />
    </>
  );
}
