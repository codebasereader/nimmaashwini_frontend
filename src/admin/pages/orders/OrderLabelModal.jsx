import { useEffect } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, MapPin, Package, Phone, Printer, X } from "lucide-react";
import { iconProps } from "../../../lib/icons";

const MAX_ITEM_LINES = 3;

function formatLabelDate(date) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function isPaid(order) {
  const manual = Boolean(order?.manual_entry ?? order?.manualEntry);
  return manual || String(order?.paymentStatus || "").toUpperCase() === "COMPLETED";
}

/**
 * 100mm x 100mm shipping label. Sizes are in mm/pt so the printed output
 * matches the sheet regardless of screen DPI. Fills are limited to solid
 * bands so a monochrome thermal printer renders them cleanly.
 */
export function OrderLabel({ order, printDate }) {
  const customer = order?.customer || {};
  const items = order?.items || [];
  const shownItems = items.slice(0, MAX_ITEM_LINES);
  const hiddenCount = items.length - shownItems.length;
  const totalUnits = items.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0),
    0,
  );

  const cityLine = [customer.city, customer.state].filter(Boolean).join(", ");

  return (
    <div
      className="label-sheet relative flex flex-col overflow-hidden bg-white font-sans text-black"
      style={{ width: "100mm", height: "99.5mm", border: "0.5mm solid #3d4a22" }}
    >
      {/* Brand header */}
      <div
        className="flex items-center gap-[2.5mm] bg-olive-800 px-[3mm] text-white"
        style={{ height: "16mm" }}
      >
        <div
          className="flex shrink-0 items-center justify-center rounded-full bg-white"
          style={{ width: "11.5mm", height: "11.5mm" }}
        >
          <img
            src="/anp_logo.webp"
            alt=""
            style={{ width: "9.5mm", height: "9.5mm", objectFit: "contain" }}
          />
        </div>
        <div className="min-w-0 flex-1 leading-tight">
          <p
            className="font-display font-bold tracking-[0.12em] text-inherit"
            style={{ fontSize: "13pt" }}
          >
            NIMMA ASHWINI
          </p>
        </div>
        <div className="shrink-0 text-right leading-tight">
          <p style={{ fontSize: "4.8pt", letterSpacing: "0.14em" }} className="text-gold-200 uppercase">
            Order
          </p>
          <p className="font-mono font-bold text-inherit" style={{ fontSize: "8pt" }}>
            {order?.orderNumber || "—"}
          </p>
        </div>
      </div>
      <div className="bg-gold-500" style={{ height: "1.1mm" }} />

      {/* Date + website */}
      <div
        className="flex items-center justify-between border-b border-dashed border-olive-800 px-[3mm]"
        style={{ height: "5.5mm", fontSize: "6.5pt" }}
      >
        <span className="font-semibold">{formatLabelDate(printDate)}</span>
        <span className="tracking-[0.1em] text-olive-900">nimmaashwini.com</span>
      </div>

      {/* Deliver to */}
      <div className="flex flex-1 gap-[2.5mm] px-[3mm] py-[2mm]" style={{ minHeight: 0 }}>
        <div className="min-w-0 flex-1">
          <p
            className="mb-[1mm] inline-flex items-center gap-[1mm] rounded-sm bg-olive-800 px-[1.6mm] py-[0.4mm] font-bold tracking-[0.18em] text-white uppercase"
            style={{ fontSize: "5.5pt" }}
          >
            <MapPin size={7} strokeWidth={2.5} aria-hidden="true" />
            Deliver to
          </p>
          <p
            className="line-clamp-2 leading-tight font-bold text-inherit"
            style={{ fontSize: "12.5pt" }}
          >
            {customer.name || "—"}
          </p>
          <p
            className="mt-[0.8mm] line-clamp-2 leading-snug text-inherit"
            style={{ fontSize: "8pt" }}
          >
            {customer.address}
            {customer.landmark ? `, ${customer.landmark}` : ""}
          </p>
          <p className="mt-[0.4mm] leading-snug font-semibold text-inherit" style={{ fontSize: "8pt" }}>
            {cityLine}
            {customer.country && customer.country !== "India"
              ? `, ${customer.country}`
              : ""}
          </p>
          <p
            className="mt-[1mm] flex items-baseline gap-[1mm] font-bold text-inherit"
            style={{ fontSize: "10.5pt" }}
          >
            <Phone size={11} strokeWidth={2.5} aria-hidden="true" className="self-center" />
            {customer.contactNumber || "—"}
            {customer.alternateNumber && (
              <span className="font-semibold" style={{ fontSize: "6.5pt" }}>
                / {customer.alternateNumber}
              </span>
            )}
          </p>
        </div>

        <div
          className="flex shrink-0 flex-col items-center justify-center self-start rounded-md border-[0.5mm] border-terracotta-600 text-center"
          style={{ width: "21mm", padding: "1.6mm 1mm" }}
        >
          <p
            className="font-bold tracking-[0.16em] text-terracotta-600 uppercase"
            style={{ fontSize: "5pt" }}
          >
            PIN
          </p>
          <p className="font-mono leading-none font-bold text-inherit" style={{ fontSize: "13pt" }}>
            {customer.pincode || "—"}
          </p>
        </div>
      </div>

      {/* Items */}
      <div
        className="mx-[3mm] mb-[2mm] rounded-md border border-olive-800"
        style={{ fontSize: "7.2pt" }}
      >
        <p
          className="flex items-center justify-between rounded-t-[1.4mm] bg-olive-100 px-[2mm] py-[0.5mm] font-bold tracking-[0.16em] text-olive-900 uppercase"
          style={{ fontSize: "5.5pt" }}
        >
          <span className="inline-flex items-center gap-[1mm]">
            <Package size={7} strokeWidth={2.5} aria-hidden="true" />
            Items
          </span>
          <span>{totalUnits} pc</span>
        </p>
        <ul className="px-[2mm] py-[0.8mm] leading-snug">
          {shownItems.map((item, index) => (
            <li
              key={`${item.productId}-${item.variantId || index}`}
              className="flex gap-[1.5mm]"
            >
              <span className="w-[6mm] shrink-0 font-bold">{item.quantity}×</span>
              <span className="min-w-0 flex-1 truncate">
                {item.name}
                {item.variantLabel ? ` (${item.variantLabel})` : ""}
              </span>
            </li>
          ))}
          {hiddenCount > 0 && (
            <li className="font-bold">
              + {hiddenCount} more item{hiddenCount > 1 ? "s" : ""}
            </li>
          )}
          {items.length === 0 && <li>—</li>}
        </ul>
      </div>

      {/* Prepaid */}
      <div
        className="flex items-center justify-between bg-terracotta-600 px-[3mm] text-white"
        style={{ height: "13.5mm" }}
      >
        <div className="leading-none">
          <p
            className="font-display font-bold tracking-[0.2em] text-inherit"
            style={{ fontSize: "17pt" }}
          >
            PREPAID
          </p>
          <p
            className="mt-[0.8mm] font-semibold tracking-[0.1em] text-inherit uppercase"
            style={{ fontSize: "5.6pt" }}
          >
            Payment received · Do not collect any cash
          </p>
        </div>
        <div
          className="rounded-md border-[0.4mm] border-white text-center leading-tight"
          style={{ padding: "1mm 2.2mm" }}
        >
          <p style={{ fontSize: "4.8pt" }} className="tracking-[0.12em] text-inherit uppercase">
            Collect
          </p>
          <p className="font-bold text-inherit" style={{ fontSize: "11pt" }}>
            ₹0
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Preview + print dialog for one or many orders (one 10x10cm page each).
 * Rendered in a portal so print CSS can isolate it. "Save as PDF" in the
 * browser print dialog is how labels are downloaded.
 */
export default function OrderLabelModal({ orders, printDate, onClose }) {
  const open = Boolean(orders?.length);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const count = orders.length;
  const unpaidCount = orders.filter((order) => !isPaid(order)).length;

  return createPortal(
    <div
      className="label-modal-backdrop fixed inset-0 z-[360] flex overflow-y-auto bg-olive-950/55 p-4"
      onClick={onClose}
    >
      <div
        className="label-modal-panel m-auto w-full max-w-[28rem] rounded-xl border border-cream-300 bg-cream-50 shadow-[var(--shadow-card-hover)]"
        role="dialog"
        aria-modal="true"
        aria-label="Shipping labels"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="label-modal-chrome flex items-start justify-between gap-3 border-b border-cream-300 px-5 py-4">
          <div>
            <h3 className="font-display text-xl text-brown-900">
              {count === 1 ? "Shipping label" : `${count} shipping labels`}
            </h3>
            <p className="text-body-sm text-brown-500">
              {count === 1 ? orders[0].orderNumber : "One label per page"} · 10
              cm × 10 cm thermal
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="focus-ring rounded-sm p-1.5 text-brown-500 hover:bg-cream-200"
          >
            <X {...iconProps(18)} />
          </button>
        </div>

        <div className="label-preview flex max-h-[60vh] flex-col items-center gap-5 overflow-y-auto px-5 py-5">
          {orders.map((order) => (
            <div
              key={order.id || order.orderNumber}
              className="label-page shrink-0 shadow-[0_6px_24px_rgba(61,74,34,0.18)]"
            >
              <OrderLabel order={order} printDate={printDate} />
            </div>
          ))}
        </div>

        <div className="label-modal-chrome space-y-3 border-t border-cream-300 px-5 py-4">
          {unpaidCount > 0 && (
            <p className="flex items-start gap-2 rounded-md border border-gold-500/50 bg-gold-100 px-3 py-2 text-body-sm text-brown-800">
              <AlertTriangle {...iconProps(16)} className="mt-0.5 shrink-0" />
              {unpaidCount === 1
                ? "1 order is not marked as paid, but its label still says PREPAID."
                : `${unpaidCount} orders are not marked as paid, but their labels still say PREPAID.`}
            </p>
          )}
          <p className="text-xs text-brown-500">
            To print: choose your thermal printer, paper size 100 × 100 mm,
            margins “None”, scale 100%. To download, choose “Save as PDF” as the
            destination.
          </p>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary px-5 py-2.5 text-[0.7rem]"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="btn btn-primary inline-flex items-center gap-2 px-5 py-2.5 text-[0.7rem]"
            >
              <Printer {...iconProps(16)} />
              {count === 1 ? "Print / Save PDF" : `Print / Save PDF (${count})`}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
