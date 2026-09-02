import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Leaf, Package, MapPin, Phone } from "lucide-react";
import { ApiError } from "../api/client";
import { fetchOrderConfirmation } from "../api/orders";
import LeafMark from "../components/icons/LeafMark";
import { useCart } from "../context/CartContext";
import { iconProps } from "../lib/icons";
import {
  formatCustomerAddress,
  formatOrderDate,
  formatOrderMoney,
  getMerchantOrderIdFromSearchParams,
} from "../lib/paymentOrder";

function DetailBlock({ label, children }) {
  return (
    <div className="rounded-xl border border-cream-300 bg-cream-50/80 p-4 sm:p-5">
      <p className="text-caption mb-2 font-semibold tracking-[0.14em] text-olive-800 uppercase">
        {label}
      </p>
      <div className="text-body-sm leading-relaxed text-brown-800">{children}</div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  const [params] = useSearchParams();
  const merchantOrderId = getMerchantOrderIdFromSearchParams(params);
  const { clearCart } = useCart();
  const [order, setOrder] = useState(null);
  const [status, setStatus] = useState(merchantOrderId ? "loading" : "missing");
  const [error, setError] = useState("");

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  useEffect(() => {
    if (!merchantOrderId) {
      setStatus("missing");
      return undefined;
    }

    let cancelled = false;
    setStatus("loading");
    setError("");

    fetchOrderConfirmation(merchantOrderId)
      .then((data) => {
        if (cancelled) return;
        setOrder(data);
        setStatus("success");
      })
      .catch((err) => {
        if (cancelled) return;
        setOrder(null);
        setStatus("error");
        setError(
          err instanceof ApiError
            ? err.message
            : "Could not load order details. Your payment may still have succeeded — please save your reference id.",
        );
      });

    return () => {
      cancelled = true;
    };
  }, [merchantOrderId]);

  const customer = order?.customer || {};
  const items = order?.items || [];
  const currency = order?.currency || "INR";
  const displayOrderId = order?.orderNumber || merchantOrderId;
  const addressText = formatCustomerAddress(customer);

  return (
    <div className="pb-16 sm:pb-20">
      <section className="product-hero-bg section-padding">
        <div className="container-ashwini">
          <div className="mx-auto max-w-3xl">
            <div className="product-info-panel p-6 text-center sm:p-10">
              <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-olive-100 text-olive-800">
                <CheckCircle2 {...iconProps(28)} />
              </span>
              <p className="section-label mb-3 flex items-center justify-center gap-2 text-olive-700">
                <LeafMark size={14} className="h-3.5 w-3.5 text-olive-600" />
                Order Confirmed
              </p>
              <h1 className="font-display text-display-sm text-brown-900 sm:text-display-md">
                Payment Successful
              </h1>
              <p className="mx-auto mt-4 max-w-xl text-body-sm leading-relaxed text-brown-600 sm:text-body">
                Thank you for your order. We have received your payment and will
                contact you on your registered number to arrange delivery.
              </p>

              {displayOrderId ? (
                <p className="mt-5 inline-flex flex-wrap items-center justify-center gap-2 rounded-full border border-cream-300 bg-cream-50 px-4 py-2 text-body-sm text-brown-700">
                  <Leaf {...iconProps(14)} className="text-olive-700" />
                  Order ID:{" "}
                  <span className="font-semibold text-brown-900">
                    {displayOrderId}
                  </span>
                </p>
              ) : null}

              {status === "loading" ? (
                <p className="mt-8 text-body-sm text-brown-500">
                  Loading your order details…
                </p>
              ) : null}

              {status === "missing" ? (
                <p className="mt-8 rounded-md border border-cream-300 bg-cream-50 px-4 py-3 text-body-sm text-brown-600">
                  No order reference was found in the payment redirect URL. If
                  you completed payment, contact support with your PhonePe
                  transaction details.
                </p>
              ) : null}

              {status === "error" ? (
                <div className="mt-8 space-y-3 text-left">
                  <p className="rounded-md border border-terracotta-400/40 bg-terracotta-500/10 px-4 py-3 text-body-sm text-terracotta-700">
                    {error}
                  </p>
                  {merchantOrderId ? (
                    <p className="rounded-md border border-cream-300 bg-cream-50 px-4 py-3 text-body-sm text-brown-700">
                      Reference:{" "}
                      <span className="font-medium text-brown-900">
                        {merchantOrderId}
                      </span>
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>

            {status === "success" && order ? (
              <div className="mt-6 space-y-4 sm:mt-8">
                <div className="grid gap-4 sm:grid-cols-2">
                  <DetailBlock label="Order summary">
                    <p>
                      <span className="text-brown-500">Order number:</span>{" "}
                      <span className="font-medium text-brown-900">
                        {order.orderNumber || "—"}
                      </span>
                    </p>
                    <p className="mt-1">
                      <span className="text-brown-500">Placed:</span>{" "}
                      {formatOrderDate(order.paidAt || order.updatedAt || order.createdAt)}
                    </p>
                    <p className="mt-1">
                      <span className="text-brown-500">Payment:</span>{" "}
                      {order.paymentStatus || "COMPLETED"}
                    </p>
                    {merchantOrderId ? (
                      <p className="mt-1 break-all">
                        <span className="text-brown-500">Reference:</span>{" "}
                        {merchantOrderId}
                      </p>
                    ) : null}
                  </DetailBlock>

                  <DetailBlock label="Amount paid">
                    <p className="font-display text-2xl font-semibold text-olive-800">
                      {formatOrderMoney(
                        order.totalAmount ?? order.subtotal,
                        currency,
                      )}
                    </p>
                    {order.couponCode && Number(order.discountAmount) > 0 ? (
                      <p className="mt-1 text-body-sm text-olive-700">
                        Coupon {String(order.couponCode).toUpperCase()} applied
                      </p>
                    ) : null}
                  </DetailBlock>
                </div>

                <DetailBlock label="Delivery address">
                  <div className="flex gap-3">
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-olive-100 text-olive-800">
                      <MapPin {...iconProps(16)} />
                    </span>
                    <div className="min-w-0 space-y-1">
                      <p className="font-medium text-brown-900">
                        {customer.name || "—"}
                      </p>
                      {customer.contactNumber ? (
                        <p className="flex items-center gap-1.5 text-brown-700">
                          <Phone {...iconProps(14)} />
                          {customer.contactNumber}
                          {customer.alternateNumber
                            ? ` · ${customer.alternateNumber}`
                            : ""}
                        </p>
                      ) : null}
                      <p className="whitespace-pre-line text-brown-700">
                        {addressText || "—"}
                      </p>
                    </div>
                  </div>
                </DetailBlock>

                <DetailBlock label="Items ordered">
                  <ul className="divide-y divide-cream-300">
                    {items.map((item, index) => (
                      <li
                        key={`${item.productId || item.slug || "item"}-${index}`}
                        className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0"
                      >
                        <div className="flex min-w-0 gap-3">
                          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold-100 text-olive-800">
                            <Package {...iconProps(16)} />
                          </span>
                          <div className="min-w-0">
                            <p className="font-medium text-brown-900">
                              {item.name}
                            </p>
                            <p className="mt-0.5 text-brown-500">
                              {[item.variantLabel, `Qty ${item.quantity}`]
                                .filter(Boolean)
                                .join(" · ")}
                            </p>
                          </div>
                        </div>
                        <p className="shrink-0 font-medium text-brown-900">
                          {formatOrderMoney(
                            item.lineTotal ??
                              (Number(item.unitPrice) || 0) *
                                (Number(item.quantity) || 0),
                            currency,
                          )}
                        </p>
                      </li>
                    ))}
                  </ul>
                </DetailBlock>

                <div className="product-info-panel space-y-2 p-5 text-body-sm sm:p-6">
                  <div className="flex justify-between text-brown-600">
                    <span>Subtotal</span>
                    <span>
                      {formatOrderMoney(
                        order.subtotal ?? order.totalAmount,
                        currency,
                      )}
                    </span>
                  </div>
                  {Number(order.discountAmount) > 0 ? (
                    <div className="flex justify-between text-olive-800">
                      <span>
                        Discount
                        {order.couponCode
                          ? ` (${String(order.couponCode).toUpperCase()})`
                          : ""}
                      </span>
                      <span>
                        −{formatOrderMoney(order.discountAmount, currency)}
                      </span>
                    </div>
                  ) : null}
                  <div className="flex justify-between border-t border-cream-300 pt-3 font-display text-lg font-semibold text-brown-900">
                    <span>Total paid</span>
                    <span className="text-olive-800">
                      {formatOrderMoney(
                        order.totalAmount ?? order.subtotal,
                        currency,
                      )}
                    </span>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                to="/#products"
                className="btn btn-primary focus-ring px-8 py-3.5"
              >
                Continue Shopping
              </Link>
              <Link
                to="/"
                className="btn focus-ring border border-cream-300 bg-white px-6 py-3.5 text-brown-800 hover:border-olive-500 hover:text-olive-800"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
