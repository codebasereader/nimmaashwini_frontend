import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Plus } from "lucide-react";
import {
  clearCategoryCurrent,
  clearCategoryErrors,
  loadCategories,
  loadCategoryById,
  removeCategory,
} from "../../../store/slices/categoriesSlice";
import { iconProps } from "../../../lib/icons";
import { getRowId } from "../../lib/entityId";
import { useAdminEditById } from "../../lib/useAdminEditById";
import CategoryFormDrawer from "../../components/CategoryFormDrawer";
import ConfirmDialog from "../../components/ConfirmDialog";

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

export default function CategoriesPage() {
  const dispatch = useDispatch();
  const {
    items,
    current,
    status,
    error,
    detailStatus,
    detailError,
    mutationStatus,
  } = useSelector((state) => state.categories);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const {
    drawerOpen,
    isEditing,
    localDetailError,
    openCreate: openAdd,
    openEdit,
    closeDrawer,
  } = useAdminEditById({
    loadById: loadCategoryById,
    clearErrors: clearCategoryErrors,
    clearCurrent: clearCategoryCurrent,
  });

  useEffect(() => {
    dispatch(loadCategories());
  }, [dispatch]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const result = await dispatch(removeCategory(getRowId(deleteTarget)));
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
            Categories
          </h1>
          <p className="mt-1 text-body-sm text-brown-500">
            Organize your product collections
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
          <p className="text-body-sm text-brown-500">Loading categories...</p>
        </div>
      )}

      {status === "failed" && (
        <div className="rounded-lg border border-terracotta-400/40 bg-terracotta-500/10 px-4 py-3 text-body-sm text-terracotta-600">
          {error}
        </div>
      )}

      {status === "succeeded" && items.length === 0 && (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <p className="font-display text-xl text-brown-800">
            No categories yet
          </p>
          <p className="mt-2 max-w-sm text-body-sm text-brown-500">
            Create your first category to start organizing products.
          </p>
          <button
            type="button"
            onClick={openAdd}
            className="btn btn-primary mt-6 px-5 py-2.5 text-[0.68rem]"
          >
            Add Category
          </button>
        </div>
      )}

      {items.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((category) => (
            <article
              key={category.id}
              className="card card-hover overflow-hidden"
            >
              <div className="aspect-[16/10] bg-cream-200">
                {category.image?.url ? (
                  <img
                    src={category.image.url}
                    alt={category.image.alt || category.name}
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
                  <h2 className="font-display text-xl text-brown-900">
                    {category.name}
                  </h2>
                  <StatusBadge active={category.isActive} />
                </div>
                {category.description && (
                  <p className="line-clamp-2 text-body-sm text-brown-500">
                    {category.description}
                  </p>
                )}
                <div className="flex items-center justify-between border-t border-cream-200 pt-3">
                  <span className="text-xs text-brown-400">
                    Order: {category.sortOrder ?? 0}
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => openEdit(category)}
                      className="focus-ring rounded-sm px-3 py-1.5 text-[0.65rem] font-semibold tracking-wider text-olive-800 uppercase transition-colors hover:bg-olive-100"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(category)}
                      className="focus-ring rounded-sm px-3 py-1.5 text-[0.65rem] font-semibold tracking-wider text-terracotta-600 uppercase transition-colors hover:bg-terracotta-500/10"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <CategoryFormDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        category={isEditing ? current : null}
        detailLoading={isEditing && detailStatus === "loading"}
        detailError={isEditing ? localDetailError || detailError : null}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete category?"
        message={`"${deleteTarget?.name}" will be permanently removed. Products linked to it may be affected.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={mutationStatus === "loading"}
      />
    </>
  );
}
