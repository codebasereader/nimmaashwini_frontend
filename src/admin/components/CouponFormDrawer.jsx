import { Check, Copy, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  addCoupon,
  clearCouponErrors,
  editCoupon,
} from "../../store/slices/couponsSlice";
import { loadProducts } from "../../store/slices/productsSlice";
import {
  computeEndsAt,
  formatCouponDiscountPreview,
  generateCouponCode,
  normalizeCouponCode,
} from "../../lib/coupon";
import { iconProps } from "../../lib/icons";
import { getRowId } from "../lib/entityId";
import AdminDrawer from "./AdminDrawer";
import {
  AdminField,
  AdminInput,
  AdminToggle,
} from "./AdminFormFields";

function toDateInputValue(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function startOfLocalDayIso(dateStr) {
  if (!dateStr) return new Date().toISOString();
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d, 0, 0, 0, 0);
  return date.toISOString();
}

const EMPTY_FORM = {
  code: "",
  discountType: "percent",
  discountValue: "",
  appliesTo: "all",
  productIds: [],
  validDays: "30",
  startsAt: toDateInputValue(new Date()),
  isActive: true,
  maxUses: "",
};

export default function CouponFormDrawer({
  open,
  onClose,
  coupon,
  detailLoading = false,
  detailError = null,
}) {
  const dispatch = useDispatch();
  const mutationStatus = useSelector((state) => state.coupons.mutationStatus);
  const mutationError = useSelector((state) => state.coupons.mutationError);
  const products = useSelector((state) => state.products.items);
  const isEditing = Boolean(coupon);
  const [form, setForm] = useState(EMPTY_FORM);
  const [productSearch, setProductSearch] = useState("");
  const [copied, setCopied] = useState(false);
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    if (!open) return;
    dispatch(loadProducts({ limit: 100 }));
  }, [open, dispatch]);

  useEffect(() => {
    if (!open) return;
    dispatch(clearCouponErrors());
    setFormError(null);
    setCopied(false);
    setProductSearch("");
    if (detailLoading) return;
    if (coupon) {
      setForm({
        code: coupon.code || "",
        discountType: coupon.discountType === "amount" ? "amount" : "percent",
        discountValue:
          coupon.discountValue != null ? String(coupon.discountValue) : "",
        appliesTo: coupon.appliesTo === "products" ? "products" : "all",
        productIds: (coupon.productIds || []).map((id) => String(id)),
        validDays:
          coupon.validDays != null ? String(coupon.validDays) : "30",
        startsAt: toDateInputValue(coupon.startsAt) || toDateInputValue(new Date()),
        isActive: coupon.isActive !== false,
        maxUses:
          coupon.maxUses != null && coupon.maxUses !== ""
            ? String(coupon.maxUses)
            : "",
      });
    } else {
      setForm({
        ...EMPTY_FORM,
        code: generateCouponCode(),
        startsAt: toDateInputValue(new Date()),
      });
    }
  }, [open, coupon, detailLoading, dispatch]);

  const endsAtPreview = useMemo(() => {
    const end = computeEndsAt(
      startOfLocalDayIso(form.startsAt),
      Number(form.validDays) || 1,
    );
    if (!end) return "—";
    return end.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }, [form.startsAt, form.validDays]);

  const previewText = useMemo(
    () =>
      formatCouponDiscountPreview(
        form.discountType,
        Number(form.discountValue) || 0,
      ),
    [form.discountType, form.discountValue],
  );

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    const list = Array.isArray(products) ? products : [];
    if (!q) return list;
    return list.filter((p) => {
      const name = String(p.name || "").toLowerCase();
      const slug = String(p.slug || "").toLowerCase();
      return name.includes(q) || slug.includes(q);
    });
  }, [products, productSearch]);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFormError(null);
  };

  const toggleProduct = (id) => {
    const key = String(id);
    setForm((prev) => {
      const next = prev.productIds.includes(key)
        ? prev.productIds.filter((x) => x !== key)
        : [...prev.productIds, key];
      return { ...prev, productIds: next };
    });
  };

  const handleCopyCode = async () => {
    const code = normalizeCouponCode(form.code);
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const code = normalizeCouponCode(form.code);
    const discountValue = Number(form.discountValue);
    const validDays = Math.floor(Number(form.validDays));

    if (!code) {
      setFormError("Coupon code is required");
      return;
    }
    if (!(discountValue > 0)) {
      setFormError("Discount value must be greater than 0");
      return;
    }
    if (form.discountType === "percent" && discountValue > 100) {
      setFormError("Percentage cannot exceed 100");
      return;
    }
    if (!(validDays >= 1)) {
      setFormError("Valid days must be at least 1");
      return;
    }
    if (form.appliesTo === "products" && form.productIds.length === 0) {
      setFormError("Select at least one product");
      return;
    }

    const maxUsesRaw = form.maxUses.trim();
    const maxUses =
      maxUsesRaw === "" ? null : Math.floor(Number(maxUsesRaw));
    if (maxUsesRaw !== "" && (!(maxUses >= 1) || Number.isNaN(maxUses))) {
      setFormError("Max uses must be a positive number or empty");
      return;
    }

    const payload = {
      code,
      discountType: form.discountType,
      discountValue,
      appliesTo: form.appliesTo,
      productIds:
        form.appliesTo === "products" ? form.productIds : [],
      validDays,
      startsAt: startOfLocalDayIso(form.startsAt),
      isActive: form.isActive,
      maxUses,
    };

    const action = isEditing
      ? await dispatch(
          editCoupon({ id: getRowId(coupon), payload }),
        )
      : await dispatch(addCoupon(payload));

    if (action.meta.requestStatus === "fulfilled") {
      onClose();
    }
  };

  const saving = mutationStatus === "loading";
  const canSave =
    normalizeCouponCode(form.code) &&
    Number(form.discountValue) > 0 &&
    Number(form.validDays) >= 1;

  return (
    <AdminDrawer
      open={open}
      onClose={onClose}
      title={isEditing ? "Edit Coupon" : "Create Coupon"}
      subtitle={isEditing ? form.code : "Generate a code and set the discount"}
      size="lg"
      headerActions={
        <button
          type="submit"
          form="coupon-form"
          disabled={saving || detailLoading || !canSave}
          className="btn btn-primary px-4 py-2 text-[0.68rem]"
        >
          {saving ? "Saving..." : isEditing ? "Save" : "Create"}
        </button>
      }
    >
      <form id="coupon-form" onSubmit={handleSubmit} className="space-y-6">
        {detailLoading && (
          <p className="text-body-sm text-brown-500">Loading coupon...</p>
        )}
        {detailError && (
          <div className="rounded-md border border-terracotta-400/40 bg-terracotta-500/10 px-3 py-2 text-body-sm text-terracotta-600">
            {detailError}
          </div>
        )}
        {(mutationError || formError) && (
          <div className="rounded-md border border-terracotta-400/40 bg-terracotta-500/10 px-3 py-2 text-body-sm text-terracotta-600">
            {formError || mutationError}
          </div>
        )}

        <fieldset disabled={detailLoading} className="space-y-6 border-0 p-0">
          <section className="space-y-4">
            <h3 className="text-caption font-semibold tracking-[0.14em] text-olive-800 uppercase">
              Code
            </h3>
            <AdminField label="Coupon code" required>
              <div className="flex gap-2">
                <AdminInput
                  value={form.code}
                  onChange={(e) =>
                    updateField(
                      "code",
                      e.target.value.toUpperCase().replace(/\s+/g, ""),
                    )
                  }
                  className="font-mono tracking-wider"
                  placeholder="ASHW••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => updateField("code", generateCouponCode())}
                  className="focus-ring inline-flex shrink-0 items-center gap-1.5 rounded-md border border-cream-300 bg-white px-3 py-2 text-[0.65rem] font-semibold tracking-wider text-olive-800 uppercase hover:border-olive-500"
                  title="Generate new code"
                >
                  <RefreshCw {...iconProps(14)} />
                  Generate
                </button>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  disabled={!form.code}
                  className="focus-ring inline-flex shrink-0 items-center gap-1.5 rounded-md border border-cream-300 bg-white px-3 py-2 text-[0.65rem] font-semibold tracking-wider text-brown-700 uppercase hover:border-olive-500 disabled:opacity-40"
                  title="Copy code"
                >
                  {copied ? (
                    <Check {...iconProps(14)} />
                  ) : (
                    <Copy {...iconProps(14)} />
                  )}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
            </AdminField>
          </section>

          <section className="space-y-4">
            <h3 className="text-caption font-semibold tracking-[0.14em] text-olive-800 uppercase">
              Discount
            </h3>
            <div className="inline-flex rounded-md border border-cream-300 bg-cream-100 p-0.5">
              {[
                { value: "amount", label: "Amount (₹)" },
                { value: "percent", label: "Percent (%)" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => updateField("discountType", opt.value)}
                  className={`rounded-sm px-3.5 py-2 text-[0.65rem] font-semibold tracking-wider uppercase transition-colors ${
                    form.discountType === opt.value
                      ? "bg-olive-800 text-cream-50"
                      : "text-brown-600 hover:text-olive-800"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <AdminField
              label={
                form.discountType === "percent"
                  ? "Discount percent"
                  : "Discount amount (₹)"
              }
              required
            >
              <AdminInput
                type="number"
                min="0"
                max={form.discountType === "percent" ? "100" : undefined}
                step={form.discountType === "percent" ? "1" : "0.01"}
                value={form.discountValue}
                onChange={(e) => updateField("discountValue", e.target.value)}
                placeholder={form.discountType === "percent" ? "15" : "100"}
                required
              />
            </AdminField>
            {Number(form.discountValue) > 0 ? (
              <p className="text-body-sm text-olive-800">{previewText}</p>
            ) : null}
          </section>

          <section className="space-y-4">
            <h3 className="text-caption font-semibold tracking-[0.14em] text-olive-800 uppercase">
              Applies to
            </h3>
            <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
              {[
                { value: "all", label: "All products" },
                { value: "products", label: "Selected products" },
              ].map((opt) => (
                <label
                  key={opt.value}
                  className="flex cursor-pointer items-center gap-2 text-body-sm text-brown-800"
                >
                  <input
                    type="radio"
                    name="appliesTo"
                    checked={form.appliesTo === opt.value}
                    onChange={() => updateField("appliesTo", opt.value)}
                    className="accent-olive-700"
                  />
                  {opt.label}
                </label>
              ))}
            </div>

            {form.appliesTo === "products" ? (
              <div className="space-y-3 rounded-md border border-cream-300 bg-white p-3">
                <AdminInput
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Search products..."
                />
                <p className="text-xs text-brown-500">
                  {form.productIds.length} selected
                </p>
                <ul className="max-h-48 space-y-1 overflow-y-auto">
                  {filteredProducts.length === 0 ? (
                    <li className="px-1 py-2 text-body-sm text-brown-500">
                      No products found
                    </li>
                  ) : (
                    filteredProducts.map((product) => {
                      const id = getRowId(product);
                      if (!id) return null;
                      const checked = form.productIds.includes(String(id));
                      return (
                        <li key={id}>
                          <label className="flex cursor-pointer items-start gap-2 rounded-sm px-1 py-1.5 hover:bg-cream-100">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleProduct(id)}
                              className="mt-0.5 accent-olive-700"
                            />
                            <span className="text-body-sm text-brown-800">
                              {product.name || "Untitled"}
                            </span>
                          </label>
                        </li>
                      );
                    })
                  )}
                </ul>
              </div>
            ) : null}
          </section>

          <section className="space-y-4">
            <h3 className="text-caption font-semibold tracking-[0.14em] text-olive-800 uppercase">
              Validity
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <AdminField label="Valid for (days)" required>
                <AdminInput
                  type="number"
                  min="1"
                  step="1"
                  value={form.validDays}
                  onChange={(e) => updateField("validDays", e.target.value)}
                  required
                />
              </AdminField>
              <AdminField label="Starts on" required>
                <AdminInput
                  type="date"
                  value={form.startsAt}
                  onChange={(e) => updateField("startsAt", e.target.value)}
                  required
                />
              </AdminField>
            </div>
            <p className="text-body-sm text-brown-600">
              Ends on{" "}
              <span className="font-medium text-brown-900">{endsAtPreview}</span>
            </p>
            <AdminField label="Max uses (optional)">
              <AdminInput
                type="number"
                min="1"
                step="1"
                value={form.maxUses}
                onChange={(e) => updateField("maxUses", e.target.value)}
                placeholder="Unlimited"
              />
            </AdminField>
            <AdminToggle
              checked={form.isActive}
              onChange={(value) => updateField("isActive", value)}
              label="Active"
            />
          </section>
        </fieldset>
      </form>
    </AdminDrawer>
  );
}
