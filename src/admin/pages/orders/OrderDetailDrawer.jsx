import AdminDrawer from "../../components/AdminDrawer";
import { StatusPill } from "../../components/AdminDataTable";
import { AdminSelect } from "../../components/AdminFormFields";
import { TAX_TYPE_IGST } from "../../../lib/gst";
import { formatINR } from "./orderMath";

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

function formatMoney(amount, currency = "INR") {
  if (currency === "INR") return formatINR(amount);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(Number(amount) || 0);
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

function DetailRow({ label, value }) {
  if (value == null || value === "") return null;
  return (
    <div className="space-y-1">
      <p className="text-[0.65rem] font-semibold tracking-wider text-brown-400 uppercase">
        {label}
      </p>
      <p className="text-body-sm text-brown-800">{value}</p>
    </div>
  );
}

export default function OrderDetailDrawer({
  open,
  onClose,
  order,
  loading,
  error,
  statusValue,
  onStatusChange,
  onSaveStatus,
  saving = false,
  mutationError = null,
  nested = false,
  readOnly = false,
}) {
  const customer = order?.customer;
  const items = order?.items || [];
  const paymentResult = order?.paymentResult;
  const isManual = Boolean(order?.manual_entry ?? order?.manualEntry);
  const hasTax =
    order?.taxAmount != null ||
    order?.igstAmount != null ||
    items.some(
      (item) =>
        item.taxAmount != null ||
        item.cgstAmount != null ||
        item.igstAmount != null,
    );
  const isIgst =
    order?.taxType === TAX_TYPE_IGST ||
    (Number(order?.igstAmount) > 0 &&
      !(Number(order?.cgstAmount) > 0) &&
      !(Number(order?.sgstAmount) > 0));
  const cgstRate = order?.cgstRate ?? 2.5;
  const sgstRate = order?.sgstRate ?? 2.5;
  const igstRate = order?.igstRate ?? order?.taxRate ?? 5;

  return (
    <AdminDrawer
      open={open}
      onClose={onClose}
      title="Order Details"
      subtitle={order?.orderNumber || undefined}
      size="lg"
      nested={nested}
      headerActions={
        !readOnly && order && onSaveStatus ? (
          <button
            type="button"
            onClick={onSaveStatus}
            disabled={saving || !statusValue}
            className="btn btn-primary px-4 py-2 text-[0.68rem]"
          >
            {saving ? "Saving..." : "Save Status"}
          </button>
        ) : null
      }
    >
      {loading && (
        <p className="text-body-sm text-brown-500">Loading order...</p>
      )}

      {error && (
        <div className="rounded-lg border border-terracotta-400/40 bg-terracotta-500/10 px-4 py-3 text-body-sm text-terracotta-600">
          {error}
        </div>
      )}

      {mutationError && (
        <div className="rounded-lg border border-terracotta-400/40 bg-terracotta-500/10 px-4 py-3 text-body-sm text-terracotta-600">
          {mutationError}
        </div>
      )}

      {!loading && !error && order && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill status={order.status} />
            <StatusPill status={order.paymentStatus} />
            {order.orderType && (
              <span className="inline-flex rounded-full bg-cream-300 px-2.5 py-0.5 text-[0.62rem] font-semibold tracking-wider text-brown-600 uppercase">
                {order.orderType}
              </span>
            )}
            {isManual && (
              <span className="inline-flex rounded-full bg-olive-100 px-2.5 py-0.5 text-[0.62rem] font-semibold tracking-wider text-olive-800 uppercase">
                Manual entry
              </span>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <DetailRow label="Order Number" value={order.orderNumber} />
            <DetailRow
              label="Order Date"
              value={formatDate(order.orderDate || order.createdAt)}
            />
            <DetailRow
              label="Created"
              value={formatDateTime(order.createdAt)}
            />
            <DetailRow
              label="Updated"
              value={formatDateTime(order.updatedAt)}
            />
            <DetailRow
              label="Subtotal"
              value={formatMoney(
                order.totalAmount ?? order.subtotal,
                order.currency,
              )}
            />
          </div>

          {!readOnly && (
            <Section title="Order Status">
              <div className="grid gap-4 sm:grid-cols-[minmax(0,12rem)_auto] sm:items-end">
                <div className="space-y-1.5">
                  <p className="block text-caption font-semibold tracking-[0.14em] text-olive-800 uppercase">
                    Status
                  </p>
                  <AdminSelect
                    value={statusValue}
                    onChange={(event) => onStatusChange?.(event.target.value)}
                    aria-label="Edit order status"
                  >
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </AdminSelect>
                </div>
                <p className="text-body-sm text-brown-500">
                  Cancelled orders should be excluded from revenue reporting.
                </p>
              </div>
            </Section>
          )}

          <Section title="Customer">
            <div className="grid gap-4 sm:grid-cols-2">
              <DetailRow label="Name" value={customer?.name} />
              <DetailRow label="Phone" value={customer?.contactNumber} />
              <DetailRow
                label="Alternate Phone"
                value={customer?.alternateNumber}
              />
              <DetailRow label="Pincode" value={customer?.pincode} />
            </div>
            <div className="mt-4 grid gap-4">
              <DetailRow label="Address" value={customer?.address} />
              <DetailRow label="Landmark" value={customer?.landmark} />
              <div className="grid gap-4 sm:grid-cols-3">
                <DetailRow label="City" value={customer?.city} />
                <DetailRow label="State" value={customer?.state} />
                <DetailRow label="Country" value={customer?.country} />
              </div>
            </div>
          </Section>

          <Section title="Items">
            {items.length === 0 ? (
              <p className="text-body-sm text-brown-500">No line items</p>
            ) : (
              <div className="overflow-hidden rounded-md border border-cream-300">
                <table className="min-w-full text-left text-body-sm">
                  <thead className="border-b border-cream-300 bg-cream-100">
                    <tr>
                      <th className="px-3 py-2 text-[0.62rem] font-semibold tracking-wider text-olive-800 uppercase">
                        Product
                      </th>
                      <th className="px-3 py-2 text-[0.62rem] font-semibold tracking-wider text-olive-800 uppercase">
                        Variant
                      </th>
                      <th className="px-3 py-2 text-right text-[0.62rem] font-semibold tracking-wider text-olive-800 uppercase">
                        Qty
                      </th>
                      <th className="px-3 py-2 text-right text-[0.62rem] font-semibold tracking-wider text-olive-800 uppercase">
                        Unit
                      </th>
                      {hasTax && (
                        <th className="px-3 py-2 text-right text-[0.62rem] font-semibold tracking-wider text-olive-800 uppercase">
                          Tax
                        </th>
                      )}
                      <th className="px-3 py-2 text-right text-[0.62rem] font-semibold tracking-wider text-olive-800 uppercase">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
                      <tr
                        key={`${item.productId}-${item.variantId || index}`}
                        className="border-b border-cream-200 last:border-b-0"
                      >
                        <td className="px-3 py-2.5 text-brown-800">
                          {item.name || "—"}
                        </td>
                        <td className="px-3 py-2.5 text-brown-600">
                          {item.variantLabel || item.variantId || "—"}
                        </td>
                        <td className="px-3 py-2.5 text-right text-brown-800">
                          {item.quantity ?? "—"}
                        </td>
                        <td className="px-3 py-2.5 text-right text-brown-800">
                          {formatMoney(item.unitPrice, order.currency)}
                        </td>
                        {hasTax && (
                          <td className="px-3 py-2.5 text-right text-brown-600">
                            {formatMoney(item.taxAmount ?? 0, order.currency)}
                          </td>
                        )}
                        <td className="px-3 py-2.5 text-right font-medium text-brown-900">
                          {formatMoney(item.lineTotal, order.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="mt-3 space-y-1 border-t border-cream-300 pt-3 text-right text-body-sm">
              {hasTax && (
                <>
                  <p className="text-brown-600">
                    Taxable{" "}
                    <span className="ml-2 font-medium text-brown-800">
                      {formatMoney(order.taxableAmount ?? 0, order.currency)}
                    </span>
                  </p>
                  {isIgst ? (
                    <p className="text-brown-600">
                      IGST ({igstRate}%){" "}
                      <span className="ml-2 font-medium text-brown-800">
                        {formatMoney(order.igstAmount ?? order.taxAmount ?? 0, order.currency)}
                      </span>
                    </p>
                  ) : (
                    <>
                      <p className="text-brown-600">
                        CGST ({cgstRate}%){" "}
                        <span className="ml-2 font-medium text-brown-800">
                          {formatMoney(order.cgstAmount ?? 0, order.currency)}
                        </span>
                      </p>
                      <p className="text-brown-600">
                        SGST ({sgstRate}%){" "}
                        <span className="ml-2 font-medium text-brown-800">
                          {formatMoney(order.sgstAmount ?? 0, order.currency)}
                        </span>
                      </p>
                    </>
                  )}
                </>
              )}
              <p className="text-brown-800">
                <span className="mr-3 text-[0.65rem] font-semibold tracking-wider text-brown-400 uppercase">
                  {hasTax ? "Grand Total" : "Subtotal"}
                </span>
                <span className="font-semibold">
                  {formatMoney(
                    order.totalAmount ?? order.subtotal,
                    order.currency,
                  )}
                </span>
              </p>
            </div>
          </Section>

          {paymentResult && (
            <Section title="Payment">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-[0.65rem] font-semibold tracking-wider text-brown-400 uppercase">
                    Gateway Status
                  </p>
                  <StatusPill status={paymentResult.status} />
                </div>
                <DetailRow
                  label="Payment Date"
                  value={formatDateTime(paymentResult.paymentDate)}
                />
              </div>
            </Section>
          )}
        </div>
      )}
    </AdminDrawer>
  );
}
