import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  addCategory,
  clearCategoryErrors,
  editCategory,
} from "../../store/slices/categoriesSlice";
import AdminDrawer from "../components/AdminDrawer";
import ImageUpload from "../components/ImageUpload";
import {
  AdminField,
  AdminInput,
  AdminTextarea,
  AdminToggle,
} from "../components/AdminFormFields";

const EMPTY_FORM = {
  name: "",
  description: "",
  image: null,
  isActive: true,
  sortOrder: 0,
};

export default function CategoryFormDrawer({
  open,
  onClose,
  category,
  detailLoading = false,
  detailError = null,
}) {
  const dispatch = useDispatch();
  const mutationStatus = useSelector((state) => state.categories.mutationStatus);
  const mutationError = useSelector((state) => state.categories.mutationError);
  const isEditing = Boolean(category);

  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (open) {
      dispatch(clearCategoryErrors());
      if (detailLoading) return;
      if (category) {
        setForm({
          name: category.name || "",
          description: category.description || "",
          image: category.image || null,
          isActive: category.isActive ?? true,
          sortOrder: category.sortOrder ?? 0,
        });
      } else {
        setForm(EMPTY_FORM);
      }
    }
  }, [open, category, detailLoading, dispatch]);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      isActive: form.isActive,
      sortOrder: Number(form.sortOrder) || 0,
    };

    if (form.image) {
      payload.image = form.image;
    }

    const action = isEditing
      ? await dispatch(editCategory({ id: category.id, payload }))
      : await dispatch(addCategory(payload));

    if (action.meta.requestStatus === "fulfilled") {
      onClose();
    }
  };

  const saving = mutationStatus === "loading";

  return (
    <AdminDrawer
      open={open}
      onClose={onClose}
      title={isEditing ? "Edit Category" : "Add Category"}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {detailLoading && (
          <p className="text-body-sm text-brown-500">Loading category details...</p>
        )}
        {detailError && (
          <div className="rounded-md border border-terracotta-400/40 bg-terracotta-500/10 px-3 py-2 text-body-sm text-terracotta-600">
            {detailError}
          </div>
        )}
        <fieldset disabled={detailLoading} className="space-y-5 border-0 p-0">
        <AdminField label="Name" required>
          <AdminInput
            value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
            placeholder="e.g. Food"
            required
          />
        </AdminField>

        <AdminField label="Description">
          <AdminTextarea
            value={form.description}
            onChange={(e) => updateField("description", e.target.value)}
            placeholder="Short description for this category"
          />
        </AdminField>

        <AdminField label="Category Image">
          <ImageUpload
            folder="categories"
            value={form.image}
            onChange={(image) => updateField("image", image)}
          />
        </AdminField>

        <div className="grid grid-cols-2 gap-4">
          <AdminField label="Sort Order">
            <AdminInput
              type="number"
              min="0"
              value={form.sortOrder}
              onChange={(e) => updateField("sortOrder", e.target.value)}
            />
          </AdminField>

          <div className="flex items-end pb-1">
            <AdminToggle
              checked={form.isActive}
              onChange={(value) => updateField("isActive", value)}
              label="Active"
            />
          </div>
        </div>

        {mutationError && (
          <p className="rounded-md border border-terracotta-400/40 bg-terracotta-500/10 px-3 py-2 text-body-sm text-terracotta-600">
            {mutationError}
          </p>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="btn btn-secondary flex-1 py-2.5 text-[0.7rem]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || detailLoading || !form.name.trim()}
            className="btn btn-primary flex-1 py-2.5 text-[0.7rem] disabled:opacity-60"
          >
            {saving ? "Saving..." : isEditing ? "Update" : "Create"}
          </button>
        </div>
        </fieldset>
      </form>
    </AdminDrawer>
  );
}
