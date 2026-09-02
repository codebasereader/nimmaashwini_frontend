import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { Plus, Search, Trash2 } from "lucide-react";
import { fetchAdminProducts } from "../../../api/products";
import { iconProps } from "../../../lib/icons";
import { AdminInput, AdminSelect } from "../../components/AdminFormFields";
import {
  createOrderLineItem,
  DEFAULT_TAX_RATE,
  formatINR,
  getCatalogVariants,
  gstSplitLabel,
  recomputeOrderLine,
} from "./orderMath";

export default function OrderProductLineEditor({
  lines,
  onChange,
  customerState = "",
}) {
  const place = { customerState };
  const token = useSelector((state) => state.auth.token);
  const [query, setQuery] = useState("");
  const [qty, setQty] = useState("1");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const rootRef = useRef(null);
  const debounceRef = useRef(null);

  const variants = selectedProduct ? getCatalogVariants(selectedProduct) : [];
  const selectedVariant =
    variants.find((variant) => variant.id === selectedVariantId) || variants[0] || null;

  useEffect(() => {
    const onDocClick = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await fetchAdminProducts(
          { search: query.trim(), limit: 20 },
          token,
        );
        setResults(Array.isArray(data) ? data : data?.items || []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 280);
    return () => clearTimeout(debounceRef.current);
  }, [query, open, token]);

  const pickProduct = (product) => {
    const productVariants = getCatalogVariants(product);
    setSelectedProduct(product);
    setSelectedVariantId(productVariants[0]?.id || "");
    setQuery(product.name || "");
    setOpen(false);
  };

  const addLine = () => {
    if (!selectedProduct || !selectedVariant) return;
    const quantity = Number(qty) || 1;
    const line = createOrderLineItem(
      selectedProduct,
      selectedVariant,
      quantity,
      place,
    );
    onChange([...(lines || []), line]);
    setQuery("");
    setQty("1");
    setSelectedProduct(null);
    setSelectedVariantId("");
    setResults([]);
  };

  const updateLine = (key, patch) => {
    onChange(
      lines.map((line) =>
        line.key === key ? recomputeOrderLine(line, patch, place) : line,
      ),
    );
  };

  const changeVariant = (key, variantId) => {
    const line = lines.find((item) => item.key === key);
    if (!line) return;
    // Variant change only when we still have product context in search results —
    // for existing lines, keep price editable; label/id update from stored options if present.
    const options = line.variantOptions || [];
    const variant = options.find((item) => item.id === variantId);
    if (variant) {
      updateLine(key, {
        variantId: variant.id,
        variantLabel: variant.label,
        unitPrice: variant.price,
        stock: variant.stock,
        maxQuantityPerOrder: variant.maxQuantityPerOrder,
      });
      return;
    }
    updateLine(key, { variantId });
  };

  const removeLine = (key) => {
    onChange(lines.filter((line) => line.key !== key));
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-caption font-semibold tracking-[0.14em] text-olive-800 uppercase">
          Products &amp; Quantity Variants
        </h3>
        <p className="mt-1 text-xs text-brown-500">
          Catalog unit prices already include GST {DEFAULT_TAX_RATE}% (CGST 2.5% +
          SGST 2.5%). Changing quantity only splits the included tax — nothing is
          added on top.
        </p>
      </div>

      <div
        ref={rootRef}
        className="relative flex flex-col gap-2 lg:flex-row lg:items-end"
      >
        <div className="relative min-w-0 flex-1">
          <label className="mb-1.5 block text-[0.65rem] font-semibold tracking-wider text-brown-500 uppercase">
            Product
          </label>
          <div className="relative">
            <Search
              {...iconProps(16)}
              className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-brown-400"
            />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedProduct(null);
                setSelectedVariantId("");
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              placeholder="Search catalog products by name..."
              className="focus-ring w-full rounded-md border border-cream-300 bg-white py-2.5 pr-3 pl-10 text-body-sm text-brown-900 placeholder:text-brown-400"
              autoComplete="off"
            />
          </div>
          {open && (
            <div className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-cream-300 bg-white shadow-[var(--shadow-card-hover)]">
              {loading && (
                <p className="px-4 py-3 text-body-sm text-brown-500">Searching...</p>
              )}
              {!loading && results.length === 0 && (
                <p className="px-4 py-3 text-body-sm text-brown-500">
                  No products found
                </p>
              )}
              {!loading &&
                results.map((product) => {
                  const id = product.id || product._id;
                  const productVariants = getCatalogVariants(product);
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => pickProduct({ ...product, id })}
                      className="flex w-full flex-col items-start gap-0.5 border-b border-cream-100 px-4 py-2.5 text-left last:border-b-0 hover:bg-cream-50"
                    >
                      <span className="font-medium text-brown-900">
                        {product.name}
                      </span>
                      <span className="text-xs text-brown-500">
                        {productVariants.length} variant
                        {productVariants.length !== 1 ? "s" : ""} · from{" "}
                        {formatINR(productVariants[0]?.price || 0)} incl. tax
                      </span>
                    </button>
                  );
                })}
            </div>
          )}
        </div>

        <div className="w-full sm:w-44">
          <label className="mb-1.5 block text-[0.65rem] font-semibold tracking-wider text-brown-500 uppercase">
            Quantity Variant
          </label>
          <AdminSelect
            value={selectedVariantId}
            onChange={(e) => setSelectedVariantId(e.target.value)}
            disabled={!selectedProduct}
          >
            {!selectedProduct && <option value="">Select product first</option>}
            {variants.map((variant) => (
              <option key={variant.id} value={variant.id}>
                {variant.label} — {formatINR(variant.price)}
              </option>
            ))}
          </AdminSelect>
        </div>

        <div className="w-full sm:w-24">
          <label className="mb-1.5 block text-[0.65rem] font-semibold tracking-wider text-brown-500 uppercase">
            Qty
          </label>
          <AdminInput
            type="number"
            min="1"
            step="1"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            className="py-2.5"
          />
        </div>

        <button
          type="button"
          disabled={!selectedProduct || !selectedVariant}
          onClick={addLine}
          className="btn btn-primary shrink-0 px-4 py-2.5 text-[0.68rem] disabled:opacity-50"
        >
          <Plus {...iconProps(14)} />
          Add to Order
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border border-cream-300 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-body-sm">
            <thead className="border-b border-cream-300 bg-cream-100">
              <tr>
                <th className="px-3 py-2.5 text-[0.62rem] font-semibold tracking-wider text-olive-800 uppercase">
                  Product Name
                </th>
                <th className="px-3 py-2.5 text-[0.62rem] font-semibold tracking-wider text-olive-800 uppercase">
                  Quantity Variant
                </th>
                <th className="px-3 py-2.5 text-[0.62rem] font-semibold tracking-wider text-olive-800 uppercase">
                  Qty
                </th>
                <th className="px-3 py-2.5 text-[0.62rem] font-semibold tracking-wider text-olive-800 uppercase">
                  Unit Price
                </th>
                <th className="px-3 py-2.5 text-[0.62rem] font-semibold tracking-wider text-olive-800 uppercase">
                  Tax
                </th>
                <th className="px-3 py-2.5 text-right text-[0.62rem] font-semibold tracking-wider text-olive-800 uppercase">
                  Total
                </th>
                <th className="px-3 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {!lines?.length && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-brown-500"
                  >
                    Search and add products with a quantity variant
                  </td>
                </tr>
              )}
              {lines?.map((line) => (
                <tr
                  key={line.key}
                  className="border-b border-cream-200 align-top last:border-b-0"
                >
                  <td className="px-3 py-3">
                    <p className="font-medium text-brown-900">{line.name}</p>
                    {line.stock != null && (
                      <p className="mt-0.5 text-xs text-brown-500">
                        Stock: {line.stock}
                      </p>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    {line.variantOptions?.length > 1 ? (
                      <AdminSelect
                        value={line.variantId}
                        onChange={(e) => changeVariant(line.key, e.target.value)}
                        className="min-w-[8rem] py-2"
                      >
                        {line.variantOptions.map((variant) => (
                          <option key={variant.id} value={variant.id}>
                            {variant.label}
                          </option>
                        ))}
                      </AdminSelect>
                    ) : (
                      <span className="text-brown-700">
                        {line.variantLabel || line.variantId || "—"}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <AdminInput
                      type="number"
                      min="1"
                      step="1"
                      value={line.quantity}
                      onChange={(e) =>
                        updateLine(line.key, { quantity: e.target.value })
                      }
                      className="w-20 py-2"
                    />
                  </td>
                  <td className="px-3 py-3">
                    <AdminInput
                      type="number"
                      min="0"
                      step="any"
                      value={line.unitPrice}
                      onChange={(e) =>
                        updateLine(line.key, { unitPrice: e.target.value })
                      }
                      className="w-28 py-2"
                    />
                    <p className="mt-1 text-[0.65rem] text-brown-400">
                      incl. 5% GST
                    </p>
                  </td>
                  <td className="px-3 py-3">
                    <p className="font-medium text-brown-800">
                      Incl. {DEFAULT_TAX_RATE}%
                    </p>
                    <p className="mt-1 text-[0.65rem] text-brown-400">
                      {gstSplitLabel(line.taxType, line.taxRate)}
                    </p>
                    <p className="mt-0.5 text-[0.65rem] text-brown-500">
                      {formatINR(line.taxAmount)} (included)
                    </p>
                  </td>
                  <td className="px-3 py-3 text-right font-medium text-brown-900">
                    {formatINR(line.lineTotal)}
                  </td>
                  <td className="px-3 py-3">
                    <button
                      type="button"
                      onClick={() => removeLine(line.key)}
                      className="focus-ring rounded-sm p-1.5 text-terracotta-600 hover:bg-terracotta-500/10"
                      aria-label="Remove line"
                    >
                      <Trash2 {...iconProps(16)} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
