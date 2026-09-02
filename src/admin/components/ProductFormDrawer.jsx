import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loadCategories } from "../../store/slices/categoriesSlice";
import {
  addProduct,
  clearProductErrors,
  editProduct,
} from "../../store/slices/productsSlice";
import AdminDrawer from "./AdminDrawer";
import DynamicFieldList, { createDynamicField } from "./DynamicFieldList";
import ImageUpload from "./ImageUpload";
import QuantityVariantsEditor, {
  createQuantityVariant,
  mapApiQuantityToForm,
  serializeQuantities,
} from "./QuantityVariantsEditor";
import {
  AdminField,
  AdminInput,
  AdminSelect,
  AdminTextarea,
  AdminToggle,
} from "./AdminFormFields";

function createEmptyForm() {
  return {
    name: "",
    tagline: "",
    description: "",
    highlights: "",
    category: "",
    coverImage: null,
    images: [],
    quantities: [createQuantityVariant()],
    specifications: [],
    benefits: [],
    isActive: true,
  };
}

function parseLines(value) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function mapDynamicFields(items = []) {
  return items.map((item) =>
    createDynamicField(item.heading || "", item.description || ""),
  );
}

function serializeDynamicFields(items = []) {
  return items
    .filter((item) => item.heading.trim() || item.description.trim())
    .map((item, index) => ({
      heading: item.heading.trim(),
      description: item.description.trim(),
      sortOrder: index,
    }));
}

function mapProductToForm(product) {
  const quantitiesSource =
    product.quantities?.length > 0
      ? product.quantities
      : product.sizes?.length > 0
        ? product.sizes
        : null;

  const quantities = quantitiesSource
    ? quantitiesSource.map(mapApiQuantityToForm)
    : product.price
      ? [
          createQuantityVariant({
            amount: "",
            price: product.price ?? "",
            stock: product.stock ?? "",
            maxQuantityPerOrder: product.maxQuantityPerOrder ?? 1,
          }),
        ]
      : [createQuantityVariant()];

  return {
    name: product.name || "",
    tagline: product.tagline || "",
    description: product.description || "",
    highlights: (product.highlights || []).join("\n"),
    category: product.category?.id || product.category || "",
    coverImage: product.coverImage || null,
    images: product.images || [],
    quantities,
    specifications: mapDynamicFields(product.specifications),
    benefits: mapDynamicFields(product.benefits),
    isActive: product.isActive ?? true,
  };
}

export default function ProductFormDrawer({
  open,
  onClose,
  product,
  detailLoading = false,
  detailError = null,
}) {
  const dispatch = useDispatch();
  const categories = useSelector((state) => state.categories.items);
  const mutationStatus = useSelector((state) => state.products.mutationStatus);
  const mutationError = useSelector((state) => state.products.mutationError);
  const isEditing = Boolean(product);

  const [form, setForm] = useState(createEmptyForm);

  useEffect(() => {
    if (open && !categories.length) {
      dispatch(loadCategories());
    }
  }, [open, categories.length, dispatch]);

  useEffect(() => {
    if (open) {
      dispatch(clearProductErrors());
      if (detailLoading) return;
      setForm(product ? mapProductToForm(product) : createEmptyForm());
    }
  }, [open, product, detailLoading, dispatch]);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const hasValidQuantities = form.quantities.some(
    (variant) => variant.amount !== "" && variant.price !== "",
  );

  const handleSubmit = async (e) => {
    e.preventDefault();

    const quantities = serializeQuantities(form.quantities);
    const specifications = serializeDynamicFields(form.specifications);
    const benefits = serializeDynamicFields(form.benefits);

    const payload = {
      name: form.name.trim(),
      tagline: form.tagline.trim() || undefined,
      description: form.description.trim() || undefined,
      highlights: parseLines(form.highlights),
      category: form.category,
      coverImage: form.coverImage ?? null,
      images: form.images,
      quantities,
      price: quantities[0]?.price,
      stock: quantities.reduce((sum, item) => sum + (item.stock || 0), 0),
      maxQuantityPerOrder: quantities[0]?.maxQuantityPerOrder ?? 1,
      specifications: specifications.length ? specifications : undefined,
      benefits: benefits.length ? benefits : undefined,
      isActive: form.isActive,
    };

    const action = isEditing
      ? await dispatch(editProduct({ id: product.id, payload }))
      : await dispatch(addProduct(payload));

    if (action.meta.requestStatus === "fulfilled") {
      onClose();
    }
  };

  const saving = mutationStatus === "loading";

  return (
    <AdminDrawer
      open={open}
      onClose={onClose}
      title={isEditing ? "Edit Product" : "Add Product"}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {detailLoading && (
          <p className="text-body-sm text-brown-500">Loading product details...</p>
        )}
        {detailError && (
          <div className="rounded-md border border-terracotta-400/40 bg-terracotta-500/10 px-3 py-2 text-body-sm text-terracotta-600">
            {detailError}
          </div>
        )}
        <fieldset disabled={detailLoading} className="space-y-6 border-0 p-0">
        <section className="space-y-5">
          <p className="section-label">Basic Info</p>

          <AdminField label="Name" required>
            <AdminInput
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              placeholder="Product name"
              required
            />
          </AdminField>

          <AdminField label="Tagline">
            <AdminInput
              value={form.tagline}
              onChange={(e) => updateField("tagline", e.target.value)}
              placeholder="Short tagline"
            />
          </AdminField>

          <AdminField label="Category" required>
            <AdminSelect
              value={form.category}
              onChange={(e) => updateField("category", e.target.value)}
              required
            >
              <option value="">Select category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </AdminSelect>
          </AdminField>

          <AdminField label="Description">
            <AdminTextarea
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              placeholder="Full product description"
              rows={5}
            />
          </AdminField>

          <AdminField label="Highlights">
            <AdminTextarea
              value={form.highlights}
              onChange={(e) => updateField("highlights", e.target.value)}
              placeholder="One highlight per line"
              rows={4}
            />
          </AdminField>

          <AdminField label="Cover Image">
            <p className="text-xs text-brown-500">
              Shown on the homepage Our Products section. Use a clean product shot
              on a transparent or simple background.
            </p>
            <ImageUpload
              folder="products"
              value={form.coverImage}
              onChange={(coverImage) => updateField("coverImage", coverImage)}
              label="Cover image"
            />
          </AdminField>

          <AdminField label="Product Images">
            <ImageUpload
              folder="products"
              value={form.images}
              onChange={(images) => updateField("images", images)}
              multiple
              label="Gallery images"
            />
          </AdminField>
        </section>

        <section className="border-t border-cream-300 pt-6">
          <QuantityVariantsEditor
            items={form.quantities}
            onChange={(quantities) => updateField("quantities", quantities)}
          />
        </section>

        <section className="space-y-5 border-t border-cream-300 pt-6">
          <DynamicFieldList
            title="Specifications"
            description="Add product specs like Net Weight, Ingredients, Storage, etc."
            items={form.specifications}
            onChange={(specifications) =>
              updateField("specifications", specifications)
            }
            headingLabel="Label"
            descriptionLabel="Value"
            headingPlaceholder="e.g. Net Weight"
            descriptionPlaceholder="e.g. 250 g / 500 g"
            addLabel="Add Specification"
          />
        </section>

        <section className="space-y-5 border-t border-cream-300 pt-6">
          <DynamicFieldList
            title="Benefits"
            description="Add benefit title and description shown on the product page."
            items={form.benefits}
            onChange={(benefits) => updateField("benefits", benefits)}
            headingLabel="Benefit Title"
            descriptionLabel="Benefit Description"
            headingPlaceholder="e.g. Rich in Calcium"
            descriptionPlaceholder="e.g. Finger millet naturally supports bone health..."
            addLabel="Add Benefit"
          />
        </section>

        <section className="border-t border-cream-300 pt-6">
          <AdminToggle
            checked={form.isActive}
            onChange={(value) => updateField("isActive", value)}
            label="Active on storefront"
          />
        </section>

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
            disabled={
              saving ||
              detailLoading ||
              !form.name.trim() ||
              !form.category ||
              !hasValidQuantities
            }
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
