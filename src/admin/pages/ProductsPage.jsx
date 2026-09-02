import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Plus } from "lucide-react";
import {
  clearProductCurrent,
  clearProductErrors,
  loadProductById,
  loadProducts,
  removeProduct,
} from "../../store/slices/productsSlice";
import ProductFormDrawer from "../components/ProductFormDrawer";
import ProductViewDrawer from "../components/ProductViewDrawer";
import ConfirmDialog from "../components/ConfirmDialog";
import { getProductCoverUrl } from "../../lib/product";
import { iconProps } from "../../lib/icons";
import { getRowId } from "../lib/entityId";
import { useAdminEditById } from "../lib/useAdminEditById";

function formatPrice(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function StatusBadge({ active }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-[0.62rem] font-semibold tracking-wider uppercase ${
        active
          ? "bg-olive-100 text-olive-800"
          : "bg-cream-300 text-brown-600"
      }`}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}

export default function ProductsPage() {
  const dispatch = useDispatch();
  const {
    items,
    current,
    status,
    error,
    detailStatus,
    detailError,
    mutationStatus,
  } = useSelector((state) => state.products);

  const [viewOpen, setViewOpen] = useState(false);
  const [isViewing, setIsViewing] = useState(false);
  const [viewError, setViewError] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const {
    drawerOpen,
    isEditing,
    localDetailError,
    openCreate: openAddBase,
    openEdit: openEditBase,
    closeDrawer,
  } = useAdminEditById({
    loadById: loadProductById,
    clearErrors: clearProductErrors,
    clearCurrent: clearProductCurrent,
  });

  useEffect(() => {
    dispatch(loadProducts());
  }, [dispatch]);

  const openAdd = () => {
    setViewOpen(false);
    setIsViewing(false);
    setViewError(null);
    openAddBase();
  };

  const openEdit = async (product) => {
    setViewOpen(false);
    setIsViewing(false);
    setViewError(null);
    await openEditBase(product);
  };

  const openView = async (product) => {
    const id = getRowId(product);
    closeDrawer();
    setIsViewing(true);
    setViewOpen(true);
    setViewError(null);
    dispatch(clearProductErrors());
    dispatch(clearProductCurrent());

    if (!id) {
      setViewError(
        "Cannot load details: this row has no id/_id. List API must return id (or _id) on every item.",
      );
      console.error("[admin view] missing id on list row", product);
      return;
    }

    const result = await dispatch(loadProductById(id));
    if (result.meta.requestStatus === "rejected") {
      setViewError(result.payload || "Failed to load product");
    }
  };

  const closeView = () => {
    setViewOpen(false);
    setIsViewing(false);
    setViewError(null);
    dispatch(clearProductCurrent());
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const result = await dispatch(removeProduct(getRowId(deleteTarget)));
    if (result.meta.requestStatus === "fulfilled") {
      setDeleteTarget(null);
    }
  };

  return (
    <>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="section-label mb-2">Manage</p>
          <h1 className="font-display text-display-sm text-brown-900">
            Products
          </h1>
          <p className="mt-1 text-body-sm text-brown-500">
            Add and manage your storefront products
          </p>
        </div>
        <button
          type="button"
          onClick={openAdd}
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

      {status === "succeeded" && items.length === 0 && (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <p className="font-display text-xl text-brown-800">No products yet</p>
          <p className="mt-2 max-w-sm text-body-sm text-brown-500">
            Add your first product to display on the storefront.
          </p>
          <button
            type="button"
            onClick={openAdd}
            className="btn btn-primary mt-6 px-5 py-2.5 text-[0.68rem]"
          >
            Add Product
          </button>
        </div>
      )}

      {items.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((product) => {
            const thumb = getProductCoverUrl(product);
            const categoryName =
              product.category?.name || "Uncategorized";
            const variants =
              product.quantities?.length > 0
                ? product.quantities
                : product.sizes || [];
            const prices = variants
              .map((v) => v.price)
              .filter((p) => p != null);
            const priceLabel =
              prices.length > 1
                ? `${formatPrice(Math.min(...prices))} – ${formatPrice(Math.max(...prices))}`
                : formatPrice(product.price ?? prices[0] ?? 0);
            const totalStock =
              variants.length > 0
                ? variants.reduce((sum, v) => sum + (v.stock || 0), 0)
                : product.stock;

            return (
              <article
                key={product.id}
                className="card card-hover overflow-hidden"
              >
                <div className="aspect-[4/3] bg-cream-200">
                  {thumb ? (
                    <img
                      src={thumb}
                      alt={product.coverImage?.alt || product.images?.[0]?.alt || product.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-body-sm text-brown-400">
                      No image
                    </div>
                  )}
                </div>
                <div className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h2 className="font-display text-xl text-brown-900">
                        {product.name}
                      </h2>
                      {product.tagline && (
                        <p className="mt-0.5 line-clamp-1 text-body-sm text-brown-500">
                          {product.tagline}
                        </p>
                      )}
                    </div>
                    <StatusBadge active={product.isActive} />
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-body-sm">
                    <span className="font-semibold text-olive-800">
                      {priceLabel}
                    </span>
                    <span className="text-brown-300">·</span>
                    <span className="text-brown-500">{categoryName}</span>
                    {variants.length > 0 && (
                      <>
                        <span className="text-brown-300">·</span>
                        <span className="text-brown-500">
                          {variants.length} variant{variants.length !== 1 ? "s" : ""}
                        </span>
                      </>
                    )}
                    {totalStock !== undefined && (
                      <>
                        <span className="text-brown-300">·</span>
                        <span className="text-brown-500">
                          Stock: {totalStock}
                        </span>
                      </>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-2 border-t border-cream-200 pt-3">
                    <button
                      type="button"
                      onClick={() => openView(product)}
                      className="focus-ring rounded-sm px-3 py-1.5 text-[0.65rem] font-semibold tracking-wider text-brown-600 uppercase transition-colors hover:bg-cream-200"
                    >
                      View
                    </button>
                    <button
                      type="button"
                      onClick={() => openEdit(product)}
                      className="focus-ring rounded-sm px-3 py-1.5 text-[0.65rem] font-semibold tracking-wider text-olive-800 uppercase transition-colors hover:bg-olive-100"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(product)}
                      className="focus-ring rounded-sm px-3 py-1.5 text-[0.65rem] font-semibold tracking-wider text-terracotta-600 uppercase transition-colors hover:bg-terracotta-500/10"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <ProductViewDrawer
        open={viewOpen}
        onClose={closeView}
        product={isViewing ? current : null}
        detailLoading={isViewing && detailStatus === "loading"}
        detailError={isViewing ? viewError || detailError : null}
        onEdit={openEdit}
      />

      <ProductFormDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        product={isEditing ? current : null}
        detailLoading={isEditing && detailStatus === "loading"}
        detailError={isEditing ? localDetailError || detailError : null}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete product?"
        message={`"${deleteTarget?.name}" will be permanently removed from your catalog.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={mutationStatus === "loading"}
      />
    </>
  );
}
