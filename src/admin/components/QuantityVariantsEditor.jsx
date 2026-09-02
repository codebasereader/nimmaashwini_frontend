import { Plus, X } from "lucide-react";
import { iconProps } from "../../lib/icons";
import { AdminField, AdminInput, AdminSelect } from "./AdminFormFields";

export const QUANTITY_UNITS = [
  { value: "ml", label: "ML" },
  { value: "g", label: "G" },
  { value: "kg", label: "KG" },
  { value: "l", label: "L" },
];

export function createQuantityVariant(overrides = {}) {
  return {
    _key: crypto.randomUUID(),
    amount: "",
    unit: "g",
    price: "",
    stock: "",
    maxQuantityPerOrder: 1,
    ...overrides,
  };
}

function RemoveButton({ onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="focus-ring shrink-0 rounded-sm p-2 text-brown-400 transition-colors hover:bg-terracotta-500/10 hover:text-terracotta-600"
      aria-label={label}
    >
      <X {...iconProps(16)} />
    </button>
  );
}

export function quantityToLabel(variant) {
  const amount = variant.amount ?? "";
  const unit = variant.unit || "g";
  return `${amount} ${unit}`.trim();
}

export function quantityToValue(variant) {
  return `${variant.amount}${variant.unit}`.toLowerCase().replace(/\s/g, "");
}

export function mapApiQuantityToForm(item) {
  if (item.amount !== undefined) {
    return createQuantityVariant({
      amount: item.amount ?? "",
      unit: item.unit || "g",
      price: item.price ?? "",
      stock: item.stock ?? "",
      maxQuantityPerOrder: item.maxQuantityPerOrder ?? 1,
    });
  }

  if (item.label) {
    const match = String(item.label).match(/^([\d.]+)\s*(ml|g|kg|l)?/i);
    return createQuantityVariant({
      amount: match?.[1] ?? "",
      unit: (match?.[2] || "g").toLowerCase(),
      price: item.price ?? "",
      stock: item.stock ?? "",
      maxQuantityPerOrder: item.maxQuantityPerOrder ?? 1,
    });
  }

  return createQuantityVariant();
}

export function serializeQuantities(variants) {
  return variants
    .filter((v) => v.amount !== "" && v.price !== "")
    .map((variant, index) => ({
      amount: Number(variant.amount),
      unit: variant.unit,
      label: quantityToLabel(variant),
      value: quantityToValue(variant),
      price: Number(variant.price),
      stock: variant.stock !== "" ? Number(variant.stock) : 0,
      maxQuantityPerOrder: Number(variant.maxQuantityPerOrder) || 1,
      sortOrder: index,
    }));
}

export default function QuantityVariantsEditor({ items, onChange }) {
  const updateItem = (index, field, value) => {
    onChange(
      items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item,
      ),
    );
  };

  const addItem = () => {
    onChange([...items, createQuantityVariant()]);
  };

  const removeItem = (index) => {
    if (items.length === 1) return;
    onChange(items.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <div>
        <p className="text-caption font-semibold tracking-[0.14em] text-olive-800 uppercase">
          Quantity Variants
        </p>
        <p className="mt-1 text-xs text-brown-500">
          Add each pack size with its own price, stock, and max order limit.
        </p>
      </div>

      <div className="space-y-3">
        {items.map((item, index) => (
          <div
            key={item._key}
            className="rounded-lg border border-cream-300 bg-white p-4 shadow-[var(--shadow-soft)]"
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="font-display text-lg text-brown-900">
                {item.amount
                  ? quantityToLabel(item)
                  : `Variant ${index + 1}`}
              </span>
              {items.length > 1 && (
                <RemoveButton
                  onClick={() => removeItem(index)}
                  label={`Remove variant ${index + 1}`}
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <AdminField label="Quantity" required>
                <AdminInput
                  type="number"
                  min="0"
                  step="any"
                  value={item.amount}
                  onChange={(e) => updateItem(index, "amount", e.target.value)}
                  placeholder="250"
                  required
                />
              </AdminField>

              <AdminField label="Unit" required>
                <AdminSelect
                  value={item.unit}
                  onChange={(e) => updateItem(index, "unit", e.target.value)}
                >
                  {QUANTITY_UNITS.map((unit) => (
                    <option key={unit.value} value={unit.value}>
                      {unit.label}
                    </option>
                  ))}
                </AdminSelect>
              </AdminField>

              <AdminField label="Price (₹)" required>
                <AdminInput
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.price}
                  onChange={(e) => updateItem(index, "price", e.target.value)}
                  placeholder="199"
                  required
                />
              </AdminField>

              <AdminField label="Stock">
                <AdminInput
                  type="number"
                  min="0"
                  value={item.stock}
                  onChange={(e) => updateItem(index, "stock", e.target.value)}
                  placeholder="50"
                />
              </AdminField>

              <div className="col-span-2">
                <AdminField label="Max Order Qty">
                  <AdminInput
                    type="number"
                    min="1"
                    value={item.maxQuantityPerOrder}
                    onChange={(e) =>
                      updateItem(index, "maxQuantityPerOrder", e.target.value)
                    }
                  />
                </AdminField>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addItem}
        className="btn btn-secondary w-full py-2.5 text-[0.68rem]"
      >
        <Plus {...iconProps(16)} />
        Add Quantity Variant
      </button>
    </div>
  );
}
