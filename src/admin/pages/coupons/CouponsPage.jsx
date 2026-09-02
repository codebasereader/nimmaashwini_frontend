import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Check, Copy, Plus } from "lucide-react";
import {
  clearCouponCurrent,
  clearCouponErrors,
  loadCouponById,
  loadCoupons,
  removeCoupon,
} from "../../../store/slices/couponsSlice";
import { formatCouponDiscountPreview } from "../../../lib/coupon";
import { iconProps } from "../../../lib/icons";
import { getRowId } from "../../lib/entityId";
import { useAdminEditById } from "../../lib/useAdminEditById";
import AdminDataTable from "../../components/AdminDataTable";
import ConfirmDialog from "../../components/ConfirmDialog";
import CouponFormDrawer from "../../components/CouponFormDrawer";

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getCouponStatus(coupon) {
  if (coupon?.isActive === false) return "inactive";
  const endsAt = coupon?.endsAt ? new Date(coupon.endsAt) : null;
  if (endsAt && !Number.isNaN(endsAt.getTime()) && endsAt.getTime() < Date.now()) {
    return "expired";
  }
  const startsAt = coupon?.startsAt ? new Date(coupon.startsAt) : null;
  if (
    startsAt &&
    !Number.isNaN(startsAt.getTime()) &&
    startsAt.getTime() > Date.now()
  ) {
    return "scheduled";
  }
  return "active";
}

function StatusBadge({ status }) {
  const styles = {
    active: "bg-olive-100 text-olive-800",
    expired: "bg-cream-300 text-brown-600",
    inactive: "bg-terracotta-500/10 text-terracotta-600",
    scheduled: "bg-cream-300 text-brown-700",
  };
  const labels = {
    active: "Active",
    expired: "Expired",
    inactive: "Inactive",
    scheduled: "Scheduled",
  };
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-[0.62rem] font-semibold tracking-wider uppercase ${
        styles[status] || styles.inactive
      }`}
    >
      {labels[status] || status}
    </span>
  );
}

function productsSummary(row) {
  if (row.appliesTo === "all") return "All products";
  const ids = row.productIds || [];
  if (Array.isArray(row.products) && row.products.length) {
    const names = row.products.map((p) => p.name).filter(Boolean);
    if (names.length <= 2) return names.join(", ");
    return `${names.slice(0, 2).join(", ")} +${names.length - 2}`;
  }
  if (ids.length === 0) return "—";
  if (ids.length === 1) return "1 product";
  return `${ids.length} products`;
}

export default function CouponsPage() {
  const dispatch = useDispatch();
  const {
    items,
    current,
    status,
    error,
    detailStatus,
    detailError,
    mutationStatus,
  } = useSelector((state) => state.coupons);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [copiedId, setCopiedId] = useState(null);
  const {
    drawerOpen,
    isEditing,
    localDetailError,
    openCreate,
    openEdit,
    closeDrawer,
  } = useAdminEditById({
    loadById: loadCouponById,
    clearErrors: clearCouponErrors,
    clearCurrent: clearCouponCurrent,
  });

  useEffect(() => {
    dispatch(loadCoupons());
  }, [dispatch]);

  const filteredItems = useMemo(() => {
    if (statusFilter === "all") return items;
    return items.filter((row) => getCouponStatus(row) === statusFilter);
  }, [items, statusFilter]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const result = await dispatch(removeCoupon(getRowId(deleteTarget)));
    if (result.meta.requestStatus === "fulfilled") {
      setDeleteTarget(null);
    }
  };

  const handleCopy = async (code, id) => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(String(code).toUpperCase());
      setCopiedId(id);
      window.setTimeout(() => setCopiedId(null), 1500);
    } catch {
      /* ignore */
    }
  };

  const columns = [
    {
      key: "code",
      label: "Code",
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className="font-mono text-body-sm font-semibold tracking-wide text-brown-900">
            {row.code || "—"}
          </span>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              handleCopy(row.code, getRowId(row));
            }}
            className="focus-ring rounded-sm p-1 text-brown-500 hover:bg-olive-100 hover:text-olive-800"
            title="Copy code"
          >
            {copiedId === getRowId(row) ? (
              <Check {...iconProps(14)} />
            ) : (
              <Copy {...iconProps(14)} />
            )}
          </button>
        </div>
      ),
    },
    {
      key: "discount",
      label: "Discount",
      render: (row) =>
        formatCouponDiscountPreview(row.discountType, row.discountValue),
    },
    {
      key: "products",
      label: "Products",
      render: (row) => productsSummary(row),
    },
    {
      key: "endsAt",
      label: "Ends",
      render: (row) => formatDate(row.endsAt),
    },
    {
      key: "uses",
      label: "Uses",
      render: (row) => {
        const used = Number(row.usedCount) || 0;
        if (row.maxUses == null) return `${used} / ∞`;
        return `${used} / ${row.maxUses}`;
      },
    },
    {
      key: "status",
      label: "Status",
      render: (row) => <StatusBadge status={getCouponStatus(row)} />,
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

  const filters = [
    { id: "all", label: "All" },
    { id: "active", label: "Active" },
    { id: "expired", label: "Expired" },
    { id: "inactive", label: "Inactive" },
  ];

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="section-label mb-2">Catalog</p>
          <h1 className="font-display text-display-sm text-brown-900">
            Coupons
          </h1>
          <p className="mt-1 text-body-sm text-brown-500">
            Create discount codes for products
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="btn btn-primary shrink-0 px-4 py-2.5 text-[0.68rem]"
        >
          <Plus {...iconProps(16)} />
          Create coupon
        </button>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {filters.map((filter) => (
          <button
            key={filter.id}
            type="button"
            onClick={() => setStatusFilter(filter.id)}
            className={`focus-ring rounded-full px-3.5 py-1.5 text-[0.65rem] font-semibold tracking-wider uppercase ${
              statusFilter === filter.id
                ? "bg-olive-800 text-cream-50"
                : "bg-cream-200 text-brown-600 hover:bg-cream-300"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {status === "loading" && (
        <div className="card flex items-center justify-center py-16">
          <p className="text-body-sm text-brown-500">Loading coupons...</p>
        </div>
      )}

      {status === "failed" && (
        <div className="rounded-lg border border-terracotta-400/40 bg-terracotta-500/10 px-4 py-3 text-body-sm text-terracotta-600">
          {error}
        </div>
      )}

      {status === "succeeded" && (
        <AdminDataTable
          columns={columns}
          rows={filteredItems}
          emptyMessage={
            statusFilter === "all"
              ? "No coupons yet. Click Create coupon to add one."
              : "No coupons match this filter."
          }
        />
      )}

      <CouponFormDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        coupon={isEditing ? current : null}
        detailLoading={isEditing && detailStatus === "loading"}
        detailError={isEditing ? localDetailError || detailError : null}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete coupon?"
        message={`"${deleteTarget?.code}" will be permanently removed.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={mutationStatus === "loading"}
      />
    </>
  );
}
