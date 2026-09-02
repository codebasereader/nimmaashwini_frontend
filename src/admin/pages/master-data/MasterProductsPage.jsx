import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Plus } from "lucide-react";
import {
  clearMasterProductCurrent,
  clearMasterProductErrors,
  loadMasterProductById,
  loadMasterProducts,
  removeMasterProduct,
} from "../../../store/slices/masterProductsSlice";
import { iconProps } from "../../../lib/icons";
import { getRowId } from "../../lib/entityId";
import { useAdminEditById } from "../../lib/useAdminEditById";
import AdminDataTable from "../../components/AdminDataTable";
import ConfirmDialog from "../../components/ConfirmDialog";
import MasterProductFormDrawer from "../../components/MasterProductFormDrawer";
import { DEFAULT_UNITS, formatINR } from "../../lib/purchaseMath";

function unitLabel(unitId) {
  const unit = DEFAULT_UNITS.find((u) => u.id === unitId);
  return unit?.code || unitId || "—";
}

export default function MasterProductsPage() {
  const dispatch = useDispatch();
  const {
    items,
    current,
    status,
    error,
    detailStatus,
    detailError,
    mutationStatus,
  } = useSelector((state) => state.masterProducts);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const {
    drawerOpen,
    isEditing,
    localDetailError,
    openCreate,
    openEdit,
    closeDrawer,
  } = useAdminEditById({
    loadById: loadMasterProductById,
    clearErrors: clearMasterProductErrors,
    clearCurrent: clearMasterProductCurrent,
  });

  useEffect(() => {
    dispatch(loadMasterProducts());
  }, [dispatch]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const result = await dispatch(removeMasterProduct(getRowId(deleteTarget)));
    if (result.meta.requestStatus === "fulfilled") {
      setDeleteTarget(null);
    }
  };

  const columns = [
    { key: "name", label: "Product", render: (row) => row.name || "—" },
    {
      key: "primaryUnitId",
      label: "Unit",
      render: (row) => unitLabel(row.primaryUnitId),
    },
    {
      key: "sellingPriceExclTax",
      label: "Sell (excl.)",
      align: "right",
      render: (row) => formatINR(row.sellingPriceExclTax ?? row.price),
    },
    {
      key: "sellingPriceInclTax",
      label: "Sell (incl.)",
      align: "right",
      render: (row) => formatINR(row.sellingPriceInclTax),
    },
    {
      key: "taxRate",
      label: "Tax %",
      render: (row) => `${row.taxRate ?? 5}%`,
    },
    {
      key: "stock",
      label: "Stock",
      render: (row) => row.stock ?? 0,
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

  return (
    <>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="section-label mb-2">Master Data</p>
          <h1 className="font-display text-display-sm text-brown-900">
            Products
          </h1>
          <p className="mt-1 text-body-sm text-brown-500">
            Inventory products for purchase — units, tax, and sell price
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="btn btn-primary shrink-0 px-4 py-2.5 text-[0.68rem]"
        >
          <Plus {...iconProps(16)} />
          Add
        </button>
      </div>

      {status === "loading" && (
        <div className="card flex items-center justify-center py-16">
          <p className="text-body-sm text-brown-500">Loading products...</p>
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
          rows={items}
          emptyMessage="No products yet. Click Add to create one."
        />
      )}

      <MasterProductFormDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        product={isEditing ? current : null}
        detailLoading={isEditing && detailStatus === "loading"}
        detailError={isEditing ? localDetailError || detailError : null}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete product?"
        message={`"${deleteTarget?.name}" will be permanently removed.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={mutationStatus === "loading"}
      />
    </>
  );
}
