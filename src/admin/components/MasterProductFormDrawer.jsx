import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  addMasterProduct,
  clearMasterProductErrors,
  editMasterProduct,
} from "../../store/slices/masterProductsSlice";
import {
  DEFAULT_TAX_RATE,
  DEFAULT_UNITS,
  priceExcludingTax,
  priceIncludingTax,
} from "../lib/purchaseMath";
import AdminDrawer from "./AdminDrawer";
import {
  AdminField,
  AdminInput,
  AdminSelect,
  AdminTextarea,
} from "./AdminFormFields";

const EMPTY_FORM = {
  name: "",
  type: "product",
  sellingPriceExclTax: "",
  sellingPriceInclTax: "",
  purchasePriceExclTax: "",
  taxRate: String(DEFAULT_TAX_RATE),
  primaryUnitId: "pcs",
  hsnSac: "",
  barcode: "",
  category: "",
  description: "",
  stock: "0",
  priceMode: "excl",
};

export default function MasterProductFormDrawer({
  open,
  onClose,
  product,
  onSaved,
  detailLoading = false,
  detailError = null,
}) {
  const dispatch = useDispatch();
  const mutationStatus = useSelector(
    (state) => state.masterProducts.mutationStatus,
  );
  const mutationError = useSelector(
    (state) => state.masterProducts.mutationError,
  );
  const isEditing = Boolean(product);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (!open) return;
    dispatch(clearMasterProductErrors());
    if (detailLoading) return;
    if (product) {
      const taxRate = Number(product.taxRate ?? DEFAULT_TAX_RATE);
      const excl =
        product.sellingPriceExclTax ??
        (product.sellingPriceInclTax
          ? priceExcludingTax(product.sellingPriceInclTax, taxRate)
          : product.price ?? 0);
      setForm({
        name: product.name || "",
        type: product.type || "product",
        sellingPriceExclTax: String(excl ?? ""),
        sellingPriceInclTax: String(
          product.sellingPriceInclTax ?? priceIncludingTax(excl, taxRate),
        ),
        purchasePriceExclTax: String(
          product.purchasePriceExclTax ?? product.purchasePrice ?? "",
        ),
        taxRate: String(taxRate),
        primaryUnitId: product.primaryUnitId || "pcs",
        hsnSac: product.hsnSac || product.hsn || "",
        barcode: product.barcode || "",
        category: product.category || "",
        description: product.description || "",
        stock: String(product.stock ?? 0),
        priceMode: "excl",
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [open, product, detailLoading, dispatch]);

  const updateField = (field, value) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      const tax = Number(next.taxRate) || DEFAULT_TAX_RATE;

      if (field === "sellingPriceExclTax" || (field === "taxRate" && next.priceMode === "excl")) {
        next.sellingPriceInclTax = String(
          priceIncludingTax(next.sellingPriceExclTax, tax),
        );
      }
      if (field === "sellingPriceInclTax" || (field === "taxRate" && next.priceMode === "incl")) {
        next.sellingPriceExclTax = String(
          priceExcludingTax(next.sellingPriceInclTax, tax),
        );
      }
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const taxRate = Number(form.taxRate) || DEFAULT_TAX_RATE;
    const sellingPriceExclTax = Number(form.sellingPriceExclTax) || 0;
    const sellingPriceInclTax =
      Number(form.sellingPriceInclTax) ||
      priceIncludingTax(sellingPriceExclTax, taxRate);

    const payload = {
      name: form.name.trim(),
      type: form.type,
      sellingPriceExclTax,
      sellingPriceInclTax,
      purchasePriceExclTax: Number(form.purchasePriceExclTax) || 0,
      taxRate,
      primaryUnitId: form.primaryUnitId,
      hsnSac: form.hsnSac.trim() || undefined,
      barcode: form.barcode.trim() || undefined,
      category: form.category.trim() || undefined,
      description: form.description.trim() || undefined,
      stock: Number(form.stock) || 0,
    };

    const action = isEditing
      ? await dispatch(editMasterProduct({ id: product.id, payload }))
      : await dispatch(addMasterProduct(payload));

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
      title={isEditing ? "Edit Product" : "Add Item"}
      size="lg"
      headerActions={
        <button
          type="submit"
          form="master-product-form"
          disabled={saving || !form.name.trim()}
          className="btn btn-primary px-4 py-2 text-[0.68rem]"
        >
          {saving ? "Saving..." : isEditing ? "Save" : "Add Item"}
        </button>
      }
    >
      <form id="master-product-form" onSubmit={handleSubmit} className="space-y-5">
        {detailLoading && (
          <p className="text-body-sm text-brown-500">Loading product details...</p>
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
        <div className="inline-flex rounded-md border border-cream-300 bg-white p-1">
          {["product", "service"].map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => updateField("type", type)}
              className={`rounded-sm px-4 py-1.5 text-[0.7rem] font-semibold tracking-wide uppercase ${
                form.type === type
                  ? "bg-olive-800 text-white"
                  : "text-brown-600 hover:bg-cream-100"
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        <AdminField label="Product Name" required>
          <AdminInput
            value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
            required
          />
        </AdminField>

        <div className="grid gap-4 sm:grid-cols-2">
          <AdminField
            label={
              form.priceMode === "excl"
                ? "Selling Price (excl. tax)"
                : "Selling Price (incl. tax)"
            }
          >
            <div className="space-y-2">
              <AdminInput
                type="number"
                min="0"
                step="any"
                value={
                  form.priceMode === "excl"
                    ? form.sellingPriceExclTax
                    : form.sellingPriceInclTax
                }
                onChange={(e) =>
                  updateField(
                    form.priceMode === "excl"
                      ? "sellingPriceExclTax"
                      : "sellingPriceInclTax",
                    e.target.value,
                  )
                }
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => updateField("priceMode", "excl")}
                  className={`rounded-sm px-2 py-1 text-[0.65rem] font-semibold uppercase ${
                    form.priceMode === "excl"
                      ? "bg-olive-100 text-olive-800"
                      : "text-brown-500 hover:bg-cream-100"
                  }`}
                >
                  without Tax
                </button>
                <button
                  type="button"
                  onClick={() => updateField("priceMode", "incl")}
                  className={`rounded-sm px-2 py-1 text-[0.65rem] font-semibold uppercase ${
                    form.priceMode === "incl"
                      ? "bg-olive-100 text-olive-800"
                      : "text-brown-500 hover:bg-cream-100"
                  }`}
                >
                  with Tax
                </button>
              </div>
              <p className="text-xs text-brown-500">
                Excl: ₹{Number(form.sellingPriceExclTax || 0).toFixed(2)} · Incl: ₹
                {Number(form.sellingPriceInclTax || 0).toFixed(2)}
              </p>
            </div>
          </AdminField>

          <AdminField label="Tax %">
            <AdminInput
              type="number"
              min="0"
              step="any"
              value={form.taxRate}
              onChange={(e) => updateField("taxRate", e.target.value)}
            />
            <p className="mt-1 text-xs text-brown-500">
              Default 5% GST (CGST 2.5% + SGST 2.5%)
            </p>
          </AdminField>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <AdminField label="Primary Unit">
            <AdminSelect
              value={form.primaryUnitId}
              onChange={(e) => updateField("primaryUnitId", e.target.value)}
            >
              {DEFAULT_UNITS.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.code} — {unit.name}
                </option>
              ))}
            </AdminSelect>
          </AdminField>
          <AdminField label="Purchase Price (excl. tax)">
            <AdminInput
              type="number"
              min="0"
              step="any"
              value={form.purchasePriceExclTax}
              onChange={(e) => updateField("purchasePriceExclTax", e.target.value)}
            />
          </AdminField>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <AdminField label="HSN / SAC">
            <AdminInput
              value={form.hsnSac}
              onChange={(e) => updateField("hsnSac", e.target.value)}
            />
          </AdminField>
          <AdminField label="Barcode">
            <AdminInput
              value={form.barcode}
              onChange={(e) => updateField("barcode", e.target.value)}
            />
          </AdminField>
          <AdminField label="Category">
            <AdminInput
              value={form.category}
              onChange={(e) => updateField("category", e.target.value)}
            />
          </AdminField>
          <AdminField label="Opening Stock">
            <AdminInput
              type="number"
              min="0"
              step="any"
              value={form.stock}
              onChange={(e) => updateField("stock", e.target.value)}
            />
          </AdminField>
        </div>

        <AdminField label="Description">
          <AdminTextarea
            value={form.description}
            onChange={(e) => updateField("description", e.target.value)}
            rows={4}
          />
        </AdminField>
        </fieldset>
      </form>
    </AdminDrawer>
  );
}
