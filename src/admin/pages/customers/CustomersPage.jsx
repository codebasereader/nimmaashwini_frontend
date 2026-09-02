import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RefreshCw, Search } from "lucide-react";
import {
  clearAdminOrderDetail,
  clearAdminOrderErrors,
  loadAdminOrderById,
} from "../../../store/slices/adminOrdersSlice";
import {
  clearCustomerDetail,
  clearCustomerErrors,
  loadCustomerById,
  loadCustomers,
  runCustomerBackfill,
} from "../../../store/slices/customersSlice";
import { iconProps } from "../../../lib/icons";
import { getRowId } from "../../lib/entityId";
import AdminDataTable from "../../components/AdminDataTable";
import AdminPagination from "../../components/AdminPagination";
import { AdminInput } from "../../components/AdminFormFields";
import OrderDetailDrawer from "../orders/OrderDetailDrawer";
import { formatINR } from "../orders/orderMath";
import CustomerDetailDrawer from "./CustomerDetailDrawer";

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

export default function CustomersPage() {
  const dispatch = useDispatch();
  const {
    items,
    pagination,
    status,
    error,
    selected,
    detailStatus,
    detailError,
    backfillStatus,
    backfillError,
    backfillResult,
  } = useSelector((state) => state.customers);

  const {
    selected: orderSelected,
    detailStatus: orderDetailStatus,
    detailError: orderDetailError,
  } = useSelector((state) => state.adminOrders);

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [detailOpen, setDetailOpen] = useState(false);
  const [orderOpen, setOrderOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    dispatch(
      loadCustomers({
        page,
        limit: 25,
        search: search || undefined,
        sort: "lastOrderAt:desc",
      }),
    );
  }, [dispatch, page, search]);

  const openCustomer = (row) => {
    const id = getRowId(row);
    if (!id) return;
    dispatch(clearCustomerErrors());
    setDetailOpen(true);
    dispatch(loadCustomerById(id));
  };

  const closeCustomer = () => {
    setDetailOpen(false);
    dispatch(clearCustomerDetail());
  };

  const openOrder = (row) => {
    const id = row.orderId || row.id || row._id;
    if (!id) return;
    dispatch(clearAdminOrderErrors());
    setOrderOpen(true);
    dispatch(loadAdminOrderById(id));
  };

  const closeOrder = () => {
    setOrderOpen(false);
    dispatch(clearAdminOrderDetail());
  };

  const handleBackfill = async () => {
    const result = await dispatch(runCustomerBackfill());
    if (result.meta.requestStatus === "fulfilled") {
      dispatch(
        loadCustomers({
          page,
          limit: 25,
          search: search || undefined,
          sort: "lastOrderAt:desc",
        }),
      );
    }
  };

  const columns = [
    {
      key: "name",
      label: "Name",
      render: (row) => row.name || "—",
    },
    {
      key: "phone",
      label: "Phone",
      render: (row) => row.phoneDisplay || row.phone || "—",
    },
    {
      key: "orderCount",
      label: "Orders",
      align: "right",
      render: (row) => row.orderCount ?? 0,
    },
    {
      key: "completedOrderCount",
      label: "Completed",
      align: "right",
      render: (row) => row.completedOrderCount ?? 0,
    },
    {
      key: "totalSpent",
      label: "Total spent",
      align: "right",
      render: (row) => formatINR(row.totalSpent),
    },
    {
      key: "lastOrderAt",
      label: "Last order",
      render: (row) => formatDateTime(row.lastOrderAt),
    },
    {
      key: "actions",
      label: "Actions",
      align: "right",
      render: (row) => (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            openCustomer(row);
          }}
          className="focus-ring rounded-sm px-3 py-1.5 text-[0.65rem] font-semibold tracking-wider text-olive-800 uppercase hover:bg-olive-100"
        >
          View
        </button>
      ),
    },
  ];

  return (
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="section-label mb-2">CRM</p>
          <h1 className="font-display text-display-sm text-brown-900">
            Customer Data
          </h1>
          <p className="mt-1 text-body-sm text-brown-500">
            Members keyed by mobile — repeat orders, invoices, and products
          </p>
        </div>
        <button
          type="button"
          onClick={handleBackfill}
          disabled={backfillStatus === "loading"}
          className="btn btn-secondary shrink-0 px-4 py-2.5 text-[0.68rem] disabled:opacity-50"
          title="Rebuild customers from existing orders"
        >
          <RefreshCw {...iconProps(16)} />
          {backfillStatus === "loading" ? "Backfilling…" : "Backfill"}
        </button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[16rem] flex-1">
          <Search
            {...iconProps(16)}
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-brown-400"
          />
          <AdminInput
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search name or phone…"
            className="pl-9"
          />
        </div>
      </div>

      {backfillError && (
        <div className="mb-4 rounded-lg border border-terracotta-400/40 bg-terracotta-500/10 px-4 py-3 text-body-sm text-terracotta-600">
          {backfillError}
        </div>
      )}

      {backfillResult && backfillStatus === "succeeded" && (
        <div className="mb-4 rounded-lg border border-olive-300 bg-olive-100/60 px-4 py-3 text-body-sm text-olive-900">
          Backfill done — processed {backfillResult.ordersProcessed ?? 0} orders,
          created {backfillResult.customersCreated ?? 0}, updated{" "}
          {backfillResult.customersUpdated ?? 0}, linked{" "}
          {backfillResult.ordersLinked ?? 0}.
        </div>
      )}

      {status === "loading" && (
        <div className="card flex items-center justify-center py-16">
          <p className="text-body-sm text-brown-500">Loading customers…</p>
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
            onRowClick={openCustomer}
            emptyMessage="No customers yet. They appear automatically when orders are placed (or run Backfill)."
          />
          <AdminPagination
            pagination={pagination}
            onPrev={() => setPage((p) => Math.max(1, p - 1))}
            onNext={() => setPage((p) => p + 1)}
          />
        </>
      )}

      <CustomerDetailDrawer
        open={detailOpen}
        onClose={closeCustomer}
        customer={selected}
        loading={detailStatus === "loading"}
        error={detailError}
        onOpenOrder={openOrder}
      />

      <OrderDetailDrawer
        open={orderOpen}
        onClose={closeOrder}
        order={orderSelected}
        loading={orderDetailStatus === "loading"}
        error={orderDetailError}
        nested
        readOnly
      />
    </>
  );
}
