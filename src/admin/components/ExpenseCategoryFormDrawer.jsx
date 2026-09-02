import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  addExpenseCategory,
  clearExpenseCategoryErrors,
  editExpenseCategory,
} from "../../store/slices/expenseCategoriesSlice";
import { getEntityId } from "../../store/slices/crudHelpers";
import AdminDrawer from "./AdminDrawer";
import {
  AdminField,
  AdminInput,
  AdminTextarea,
  AdminToggle,
} from "./AdminFormFields";

const EMPTY_FORM = {
  name: "",
  description: "",
  isActive: true,
};

export default function ExpenseCategoryFormDrawer({
  open,
  onClose,
  category,
  onSaved,
  detailLoading = false,
  detailError = null,
  nested = false,
}) {
  const dispatch = useDispatch();
  const mutationStatus = useSelector(
    (state) => state.expenseCategories.mutationStatus,
  );
  const mutationError = useSelector(
    (state) => state.expenseCategories.mutationError,
  );
  const isEditing = Boolean(category);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (!open) return;
    dispatch(clearExpenseCategoryErrors());
    if (detailLoading) return;
    if (category) {
      setForm({
        name: category.name || "",
        description: category.description || "",
        isActive: category.isActive ?? true,
      });
    } else {
      setForm(EMPTY_FORM);
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
    };

    const id = getEntityId(category);
    const action = isEditing
      ? await dispatch(editExpenseCategory({ id, payload }))
      : await dispatch(addExpenseCategory(payload));

    if (action.meta.requestStatus === "fulfilled") {
      onSaved?.(action.payload);
      onClose();
    }
  };

  const saving = mutationStatus === "loading";

  return (
    <AdminDrawer
      open={open}
      onClose={onClose}
      title={isEditing ? "Edit Expense Category" : "Add Expense Category"}
      nested={nested}
      headerActions={
        <button
          type="submit"
          form="expense-category-form"
          disabled={saving || !form.name.trim() || detailLoading}
          className="btn btn-primary px-4 py-2 text-[0.68rem]"
        >
          {saving ? "Saving..." : isEditing ? "Save" : "Add"}
        </button>
      }
    >
      <form
        id="expense-category-form"
        onSubmit={handleSubmit}
        className="space-y-5"
      >
        {detailLoading && (
          <p className="text-body-sm text-brown-500">
            Loading category details...
          </p>
        )}
        {detailError && (
          <div className="rounded-md border border-terracotta-400/40 bg-terracotta-500/10 px-3 py-2 text-body-sm text-terracotta-600">
            {detailError}
          </div>
        )}
        {mutationError && (
          <div className="rounded-md border border-terracotta-400/40 bg-terracotta-500/10 px-3 py-2 text-body-sm text-terracotta-600">
            {mutationError}
          </div>
        )}

        <fieldset disabled={detailLoading} className="space-y-5 border-0 p-0">
          <AdminField label="Category Name" required>
            <AdminInput
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              placeholder="e.g. Travel, Rent, Utilities"
              required
            />
          </AdminField>
          <AdminField label="Description">
            <AdminTextarea
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              rows={3}
              placeholder="Optional notes about this category"
            />
          </AdminField>
          <AdminToggle
            checked={form.isActive}
            onChange={(value) => updateField("isActive", value)}
            label="Active"
          />
        </fieldset>
      </form>
    </AdminDrawer>
  );
}
