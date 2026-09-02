import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { ApiError } from "../api/client";
import { fetchOrderConfirmation, retryOrderPayment } from "../api/orders";
import Seo from "../components/Seo";
import {
  buildWhatsAppUrl,
  WHATSAPP_DISPLAY,
} from "../lib/checkout";
import { iconProps } from "../lib/icons";
import {
  formatOrderDate,
  formatOrderMoney,
  getMerchantOrderIdFromSearchParams,
} from "../lib/paymentOrder";

export default function PaymentFailurePage() {
  const [params] = useSearchParams();
  const merchantOrderId = getMerchantOrderIdFromSearchParams(params);
  const [order, setOrder] = useState(null);
  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState("");

  useEffect(() => {
    if (!merchantOrderId) return undefined;

    let cancelled = false;
    fetchOrderConfirmation(merchantOrderId)
      .then((data) => {
        if (!cancelled) setOrder(data);
      })
      .catch(() => {
        if (!cancelled) setOrder(null);
      });

    return () => {
      cancelled = true;
    };
  }, [merchantOrderId]);

  const supportUrl = buildWhatsAppUrl(
    merchantOrderId
      ? `Hello Nimma Ashwini, I need help with my payment for order ${order?.orderNumber || merchantOrderId}.`
      : "Hello Nimma Ashwini, I need help with a failed payment on checkout.",
  );

  const handleTryAgain = async () => {
    if (!merchantOrderId || retrying) return;

    setRetrying(true);
    setRetryError("");

    try {
      const data = await retryOrderPayment({ merchantOrderId });
      if (!data?.checkoutPageUrl) {
        throw new Error(
          "Payment could not be restarted. Please try checkout again or contact support.",
        );
      }
      window.location.assign(data.checkoutPageUrl);
    } catch (error) {
      setRetryError(
        error instanceof ApiError
          ? error.message
          : error.message || "Unable to restart payment. Please try again.",
      );
      setRetrying(false);
    }
  };

  return (
    <div className="pb-16 sm:pb-20">
      <Seo title="Payment Failed" noindex />
      <section className="product-hero-bg section-padding">
        <div className="container-ashwini">
          <div className="product-info-panel mx-auto max-w-lg p-8 text-center sm:p-10">
            <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-terracotta-500/15 text-terracotta-600">
              <AlertCircle {...iconProps(28)} />
            </span>
            <p className="section-label mb-3 text-terracotta-600">Payment</p>
            <h1 className="font-display text-display-sm text-brown-900">
              Payment Failed
            </h1>
            <p className="mt-4 text-body-sm leading-relaxed text-brown-600">
              Your payment was not completed. Your cart is still saved — you can
              try again, or contact us if you need help.
            </p>

            {merchantOrderId ? (
              <p className="mt-4 rounded-md border border-cream-300 bg-cream-50 px-3 py-2 text-body-sm text-brown-700">
                Reference:{" "}
                <span className="font-medium text-brown-900">
                  {order?.orderNumber || merchantOrderId}
                </span>
              </p>
            ) : (
              <p className="mt-4 rounded-md border border-cream-300 bg-cream-50 px-3 py-2 text-body-sm text-brown-600">
                No order reference was found in the redirect URL. If amount was
                deducted, contact support with your PhonePe transaction id.
              </p>
            )}

            {order ? (
              <div className="mt-4 rounded-md border border-cream-300 bg-cream-50 px-3 py-3 text-left text-body-sm text-brown-700">
                <p>
                  Status:{" "}
                  <span className="font-medium text-brown-900">
                    {order.paymentStatus || order.status || "FAILED"}
                  </span>
                </p>
                {order.updatedAt || order.createdAt ? (
                  <p className="mt-1">
                    Updated: {formatOrderDate(order.updatedAt || order.createdAt)}
                  </p>
                ) : null}
                {order.totalAmount != null || order.subtotal != null ? (
                  <p className="mt-1">
                    Amount:{" "}
                    {formatOrderMoney(
                      order.totalAmount ?? order.subtotal,
                      order.currency || "INR",
                    )}
                  </p>
                ) : null}
              </div>
            ) : null}

            {retryError ? (
              <p className="mt-4 rounded-md border border-terracotta-400/40 bg-terracotta-500/10 px-3 py-2 text-left text-body-sm text-terracotta-700">
                {retryError}
              </p>
            ) : null}

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {merchantOrderId ? (
                <button
                  type="button"
                  onClick={handleTryAgain}
                  disabled={retrying}
                  className="btn btn-primary focus-ring px-8 py-3.5 disabled:opacity-60"
                >
                  {retrying ? "Redirecting to payment…" : "Try Again"}
                </button>
              ) : (
                <Link
                  to="/checkout"
                  className="btn btn-primary focus-ring px-8 py-3.5"
                >
                  Try Again
                </Link>
              )}
              <Link
                to="/cart"
                className="btn focus-ring border border-cream-300 bg-white px-6 py-3.5 text-brown-800 hover:border-olive-500 hover:text-olive-800"
              >
                Back to Cart
              </Link>
            </div>

            {merchantOrderId && retryError ? (
              <Link
                to="/checkout"
                className="mt-4 inline-block text-body-sm font-medium text-brown-600 hover:text-olive-800"
              >
                Or go back to checkout
              </Link>
            ) : null}

            <a
              href={supportUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-block text-body-sm font-medium text-olive-800 hover:text-olive-900"
            >
              Contact us on WhatsApp ({WHATSAPP_DISPLAY})
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
