import { X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { fetchAvailableCoupons } from "../../api/coupons";
import {
  cartItemsToValidatePayload,
  formatCouponDiscountPreview,
  formatINR,
} from "../../lib/coupon";
import { iconProps } from "../../lib/icons";
import { normalizeListResponse } from "../../store/slices/crudHelpers";

function formatEndsAt(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Modal listing coupons eligible for the current cart.
 * Selecting a row calls onSelect(code) — parent should validate/apply.
 */
export default function AvailableCouponsModal({
  open,
  onClose,
  cartItems,
  onSelect,
  selecting = false,
}) {
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);
  const [coupons, setCoupons] = useState([]);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setStatus("loading");
    setError(null);

    (async () => {
      try {
        const data = await fetchAvailableCoupons({
          items: cartItemsToValidatePayload(cartItems),
        });
        if (cancelled) return;
        const list = normalizeListResponse(data);
        setCoupons(Array.isArray(list) ? list : []);
        setStatus("succeeded");
      } catch (err) {
        if (cancelled) return;
        setCoupons([]);
        setError(err.message || "Unable to load coupons");
        setStatus("failed");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, cartItems]);

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            aria-label="Close available coupons"
            className="fixed inset-0 z-[340] bg-olive-950/45"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Available coupons"
            className="fixed top-1/2 left-1/2 z-[350] flex max-h-[min(85vh,36rem)] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl border border-cream-300 bg-white shadow-[var(--shadow-card-hover)]"
            initial={{ opacity: 0, scale: 0.96, y: "-45%" }}
            animate={{ opacity: 1, scale: 1, y: "-50%" }}
            exit={{ opacity: 0, scale: 0.96, y: "-45%" }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
          >
            <div className="flex items-start justify-between gap-3 border-b border-cream-300 px-5 py-4">
              <div>
                <h3 className="font-display text-xl text-brown-900">
                  Available coupons
                </h3>
                <p className="mt-1 text-body-sm text-brown-500">
                  Tap a coupon to apply it to your order
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="focus-ring rounded-md p-1.5 text-brown-500 hover:bg-cream-100 hover:text-brown-800"
                aria-label="Close"
              >
                <X {...iconProps(18)} />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
              {status === "loading" ? (
                <p className="py-8 text-center text-body-sm text-brown-500">
                  Loading coupons...
                </p>
              ) : null}

              {status === "failed" ? (
                <p className="rounded-md border border-terracotta-400/40 bg-terracotta-500/10 px-3 py-2 text-body-sm text-terracotta-600">
                  {error}
                </p>
              ) : null}

              {status === "succeeded" && coupons.length === 0 ? (
                <p className="py-8 text-center text-body-sm text-brown-500">
                  No coupons available for your cart right now.
                </p>
              ) : null}

              {status === "succeeded" && coupons.length > 0 ? (
                <ul className="space-y-3">
                  {coupons.map((coupon) => {
                    const code = String(coupon.code || "").toUpperCase();
                    const ends = formatEndsAt(coupon.endsAt);
                    const preview =
                      coupon.message ||
                      formatCouponDiscountPreview(
                        coupon.discountType,
                        coupon.discountValue,
                      );
                    const amount = Number(coupon.discountAmount) || 0;

                    return (
                      <li key={code}>
                        <button
                          type="button"
                          disabled={selecting || !code}
                          onClick={() => onSelect(code)}
                          className="focus-ring flex w-full items-start justify-between gap-3 rounded-lg border border-cream-300 bg-cream-50 px-3.5 py-3 text-left transition-colors hover:border-olive-500 hover:bg-olive-50/60 disabled:opacity-60"
                        >
                          <div className="min-w-0">
                            <p className="font-mono text-body-sm font-semibold tracking-wide text-olive-900">
                              {code}
                            </p>
                            <p className="mt-0.5 text-body-sm text-brown-700">
                              {preview}
                            </p>
                            {ends ? (
                              <p className="mt-1 text-xs text-brown-500">
                                Valid till {ends}
                              </p>
                            ) : null}
                          </div>
                          {amount > 0 ? (
                            <span className="shrink-0 text-body-sm font-semibold text-olive-800">
                              −{formatINR(amount)}
                            </span>
                          ) : null}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
