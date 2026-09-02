import { Plus, X } from "lucide-react";
import { iconProps } from "../../lib/icons";
import { AdminField, AdminInput, AdminTextarea } from "./AdminFormFields";

function RemoveButton({ onClick, label = "Remove" }) {
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

export function createDynamicField(heading = "", description = "") {
  return {
    _key: crypto.randomUUID(),
    heading,
    description,
  };
}

export default function DynamicFieldList({
  title,
  description,
  items,
  onChange,
  headingLabel = "Title",
  descriptionLabel = "Description",
  headingPlaceholder = "e.g. Net Weight",
  descriptionPlaceholder = "e.g. 250 g / 500 g",
  addLabel = "Add item",
}) {
  const updateItem = (index, field, value) => {
    onChange(
      items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item,
      ),
    );
  };

  const addItem = () => {
    onChange([...items, createDynamicField()]);
  };

  const removeItem = (index) => {
    onChange(items.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <div>
        <p className="text-caption font-semibold tracking-[0.14em] text-olive-800 uppercase">
          {title}
        </p>
        {description && (
          <p className="mt-1 text-xs text-brown-500">{description}</p>
        )}
      </div>

      {items.length === 0 && (
        <p className="rounded-md border border-dashed border-cream-400 bg-cream-50 px-3 py-4 text-center text-body-sm text-brown-500">
          No items yet. Click &ldquo;{addLabel}&rdquo; to add one.
        </p>
      )}

      <div className="space-y-3">
        {items.map((item, index) => (
          <div
            key={item._key}
            className="rounded-lg border border-cream-300 bg-white p-4 shadow-[var(--shadow-soft)]"
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="text-[0.65rem] font-semibold tracking-wider text-brown-400 uppercase">
                #{index + 1}
              </span>
              <RemoveButton
                onClick={() => removeItem(index)}
                label={`Remove ${title} item ${index + 1}`}
              />
            </div>

            <div className="space-y-3">
              <AdminField label={headingLabel}>
                <AdminInput
                  value={item.heading}
                  onChange={(e) => updateItem(index, "heading", e.target.value)}
                  placeholder={headingPlaceholder}
                />
              </AdminField>

              <AdminField label={descriptionLabel}>
                <AdminTextarea
                  value={item.description}
                  onChange={(e) =>
                    updateItem(index, "description", e.target.value)
                  }
                  placeholder={descriptionPlaceholder}
                  rows={3}
                />
              </AdminField>
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
        {addLabel}
      </button>
    </div>
  );
}
