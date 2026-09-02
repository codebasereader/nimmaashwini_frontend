import AdminDrawer from "./AdminDrawer";

function formatPrice(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount ?? 0);
}

function Section({ title, children }) {
  if (!children) return null;
  return (
    <section className="space-y-3 border-t border-cream-300 pt-5">
      <h3 className="text-caption font-semibold tracking-[0.14em] text-olive-800 uppercase">
        {title}
      </h3>
      {children}
    </section>
  );
}

function DetailRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="space-y-1">
      <p className="text-[0.65rem] font-semibold tracking-wider text-brown-400 uppercase">
        {label}
      </p>
      <p className="text-body-sm text-brown-800">{value}</p>
    </div>
  );
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

function getVariants(product) {
  if (product.quantities?.length > 0) return product.quantities;
  if (product.sizes?.length > 0) return product.sizes;
  return [];
}

function variantLabel(variant) {
  if (variant.label) return variant.label;
  if (variant.amount != null && variant.unit) {
    return `${variant.amount} ${variant.unit}`;
  }
  return "—";
}

export default function ProductViewDrawer({
  open,
  onClose,
  product,
  onEdit,
  detailLoading = false,
  detailError = null,
}) {
  if (detailLoading) {
    return (
      <AdminDrawer open={open} onClose={onClose} title="View Product">
        <p className="text-body-sm text-brown-500">Loading product details...</p>
      </AdminDrawer>
    );
  }

  if (detailError) {
    return (
      <AdminDrawer open={open} onClose={onClose} title="View Product">
        <div className="rounded-md border border-terracotta-400/40 bg-terracotta-500/10 px-3 py-2 text-body-sm text-terracotta-600">
          {detailError}
        </div>
      </AdminDrawer>
    );
  }

  if (!product) return null;

  const variants = getVariants(product);
  const categoryName = product.category?.name || "Uncategorized";
  const highlights = product.highlights || [];
  const specifications = product.specifications || [];
  const benefits = product.benefits || [];
  const images = product.images || [];
  const coverImage = product.coverImage;

  return (
    <AdminDrawer open={open} onClose={onClose} title="View Product">
      <div className="space-y-5">
        {coverImage?.url && (
          <div className="space-y-2">
            <p className="text-[0.65rem] font-semibold tracking-wider text-brown-400 uppercase">
              Cover Image
            </p>
            <div className="aspect-[4/3] max-w-xs overflow-hidden rounded-md border border-cream-300 bg-cream-100">
              <img
                src={coverImage.url}
                alt={coverImage.alt || `${product.name} cover`}
                className="h-full w-full object-contain"
              />
            </div>
          </div>
        )}

        {images.length > 0 && (
          <div className="space-y-2">
            <p className="text-[0.65rem] font-semibold tracking-wider text-brown-400 uppercase">
              Gallery Images
            </p>
            <div className="grid grid-cols-3 gap-2">
            {images.map((img, index) => (
              <div
                key={img.key || index}
                className="aspect-square overflow-hidden rounded-md border border-cream-300 bg-cream-100"
              >
                <img
                  src={img.url}
                  alt={img.alt || product.name}
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
            </div>
          </div>
        )}

        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-display text-2xl text-brown-900">
                {product.name}
              </h3>
              {product.tagline && (
                <p className="mt-1 text-body-sm text-brown-500">
                  {product.tagline}
                </p>
              )}
            </div>
            <StatusBadge active={product.isActive} />
          </div>

          <DetailRow label="Category" value={categoryName} />
          {product.slug && <DetailRow label="Slug" value={product.slug} />}
        </div>

        {product.description && (
          <Section title="Description">
            <p className="text-body-sm leading-relaxed text-brown-700 whitespace-pre-wrap">
              {product.description}
            </p>
          </Section>
        )}

        {highlights.length > 0 && (
          <Section title="Highlights">
            <ul className="space-y-2">
              {highlights.map((item, index) => (
                <li
                  key={index}
                  className="flex gap-2 text-body-sm text-brown-700"
                >
                  <span className="text-olive-600">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {variants.length > 0 && (
          <Section title="Quantity Variants">
            <div className="overflow-hidden rounded-lg border border-cream-300">
              <table className="w-full text-left text-body-sm">
                <thead className="bg-cream-100 text-[0.65rem] font-semibold tracking-wider text-brown-500 uppercase">
                  <tr>
                    <th className="px-3 py-2.5">Pack</th>
                    <th className="px-3 py-2.5">Price</th>
                    <th className="px-3 py-2.5">Stock</th>
                    <th className="px-3 py-2.5">Max Order</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cream-200 bg-white">
                  {variants.map((variant, index) => (
                    <tr key={variant.value || index}>
                      <td className="px-3 py-2.5 font-medium text-brown-900">
                        {variantLabel(variant)}
                      </td>
                      <td className="px-3 py-2.5 text-olive-800">
                        {formatPrice(variant.price ?? product.price)}
                      </td>
                      <td className="px-3 py-2.5 text-brown-600">
                        {variant.stock ?? "—"}
                      </td>
                      <td className="px-3 py-2.5 text-brown-600">
                        {variant.maxQuantityPerOrder ?? product.maxQuantityPerOrder ?? 1}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        )}

        {variants.length === 0 && product.price != null && (
          <Section title="Pricing">
            <div className="grid grid-cols-2 gap-4 rounded-lg border border-cream-300 bg-white p-4">
              <DetailRow label="Price" value={formatPrice(product.price)} />
              <DetailRow
                label="Stock"
                value={product.stock != null ? String(product.stock) : "—"}
              />
              <DetailRow
                label="Max Order Qty"
                value={String(product.maxQuantityPerOrder ?? 1)}
              />
            </div>
          </Section>
        )}

        {specifications.length > 0 && (
          <Section title="Specifications">
            <dl className="space-y-3 rounded-lg border border-cream-300 bg-white p-4">
              {specifications.map((item, index) => (
                <div
                  key={index}
                  className="border-b border-cream-200 pb-3 last:border-0 last:pb-0"
                >
                  <dt className="text-[0.65rem] font-semibold tracking-wider text-brown-400 uppercase">
                    {item.heading}
                  </dt>
                  <dd className="mt-1 text-body-sm text-brown-800">
                    {item.description}
                  </dd>
                </div>
              ))}
            </dl>
          </Section>
        )}

        {benefits.length > 0 && (
          <Section title="Benefits">
            <div className="space-y-3">
              {benefits.map((item, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-cream-300 bg-white p-4"
                >
                  <p className="font-display text-lg text-brown-900">
                    {index + 1}. {item.heading}
                  </p>
                  <p className="mt-1.5 text-body-sm leading-relaxed text-brown-600">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </Section>
        )}

        <div className="flex gap-3 border-t border-cream-300 pt-5">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary flex-1 py-2.5 text-[0.7rem]"
          >
            Close
          </button>
          {onEdit && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(product);
              }}
              className="btn btn-primary flex-1 py-2.5 text-[0.7rem]"
            >
              Edit Product
            </button>
          )}
        </div>
      </div>
    </AdminDrawer>
  );
}
