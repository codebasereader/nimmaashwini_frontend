import AdminDrawer from "../../components/AdminDrawer";
import AdminDataTable, { StatusPill } from "../../components/AdminDataTable";
import { formatINR } from "../orders/orderMath";

function formatDate(iso) {
  if (!iso) return "—";
  try {
    const value = String(iso).length <= 10 ? `${iso}T00:00:00` : iso;
    return new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
    }).format(new Date(value));
  } catch {
    return iso;
  }
}

function formatDateTime(iso) {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function Section({ title, children }) {
  return (
    <section className="space-y-3 border-t border-cream-300 pt-5 first:border-t-0 first:pt-0">
      <h3 className="text-caption font-semibold tracking-[0.14em] text-olive-800 uppercase">
        {title}
      </h3>
      {children}
    </section>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-md border border-cream-300 bg-white px-3 py-2.5">
      <p className="text-[0.65rem] font-semibold tracking-wider text-brown-400 uppercase">
        {label}
      </p>
      <p className="mt-1 font-display text-body text-brown-900">{value}</p>
    </div>
  );
}

export default function CustomerDetailDrawer({
  open,
  onClose,
  customer,
  loading = false,
  error = null,
  onOpenOrder,
}) {
  const address = customer?.address || {};
  const orders = customer?.orders || [];
  const products = customer?.products || [];

  const orderColumns = [
    {
      key: "orderNumber",
      label: "Invoice #",
      render: (row) => (
        <button
          type="button"
          onClick={() => onOpenOrder?.(row)}
          className="focus-ring rounded-sm font-semibold text-olive-800 underline-offset-2 hover:underline"
        >
          {row.orderNumber || row.orderId || "—"}
        </button>
      ),
    },
    {
      key: "orderDate",
      label: "Date",
      render: (row) => formatDate(row.orderDate),
    },
    {
      key: "status",
      label: "Status",
      render: (row) => <StatusPill status={row.status} />,
    },
    {
      key: "paymentStatus",
      label: "Payment",
      render: (row) => <StatusPill status={row.paymentStatus} />,
    },
    {
      key: "placeOfSupply",
      label: "State",
      render: (row) => row.placeOfSupply || "—",
    },
    {
      key: "totalAmount",
      label: "Amount",
      align: "right",
      render: (row) => formatINR(row.totalAmount),
    },
  ];

  const productColumns = [
    {
      key: "productName",
      label: "Product",
      render: (row) => row.productName || "—",
    },
    {
      key: "orderCount",
      label: "Orders",
      align: "right",
      render: (row) => row.orderCount ?? 0,
    },
    {
      key: "totalQuantity",
      label: "Qty",
      align: "right",
      render: (row) => row.totalQuantity ?? 0,
    },
    {
      key: "totalValue",
      label: "Value",
      align: "right",
      render: (row) => formatINR(row.totalValue),
    },
  ];

  return (
    <AdminDrawer
      open={open}
      onClose={onClose}
      title={customer?.name || "Customer"}
      subtitle={customer?.phoneDisplay || customer?.phone || undefined}
      size="xl"
    >
      {loading && (
        <p className="text-body-sm text-brown-500">Loading customer…</p>
      )}

      {!loading && error && (
        <div className="rounded-lg border border-terracotta-400/40 bg-terracotta-500/10 px-4 py-3 text-body-sm text-terracotta-600">
          {error}
        </div>
      )}

      {!loading && !error && customer && (
        <div className="space-y-6">
          <Section title="Profile">
            <dl className="grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-[0.65rem] font-semibold tracking-wider text-brown-400 uppercase">
                  Name
                </dt>
                <dd className="mt-0.5 text-body-sm text-brown-900">
                  {customer.name || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-[0.65rem] font-semibold tracking-wider text-brown-400 uppercase">
                  Phone
                </dt>
                <dd className="mt-0.5 text-body-sm text-brown-900">
                  {customer.phoneDisplay || customer.phone || "—"}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-[0.65rem] font-semibold tracking-wider text-brown-400 uppercase">
                  Address
                </dt>
                <dd className="mt-0.5 text-body-sm text-brown-900">
                  {[
                    address.line1 || address.address,
                    address.landmark,
                    [address.city, address.district, address.state, address.pincode]
                      .filter(Boolean)
                      .join(", "),
                    address.country,
                  ]
                    .filter(Boolean)
                    .join(" · ") || "—"}
                </dd>
              </div>
            </dl>
          </Section>

          <Section title="Summary">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="Orders" value={customer.orderCount ?? 0} />
              <Stat
                label="Completed"
                value={customer.completedOrderCount ?? 0}
              />
              <Stat
                label="Total spent"
                value={formatINR(customer.totalSpent)}
              />
              <Stat
                label="Last order"
                value={formatDateTime(customer.lastOrderAt)}
              />
            </div>
          </Section>

          <Section title="Orders / Invoices">
            <AdminDataTable
              columns={orderColumns}
              rows={orders}
              emptyMessage="No orders linked to this customer yet."
            />
          </Section>

          <Section title="Products">
            <AdminDataTable
              columns={productColumns}
              rows={products}
              emptyMessage="No product purchases yet."
            />
          </Section>
        </div>
      )}
    </AdminDrawer>
  );
}
