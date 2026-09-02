import { ChevronDown } from "lucide-react";
import { iconProps } from "../lib/icons";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { ApiError } from "../api/client";
import { validateCoupon } from "../api/coupons";
import { createOrder } from "../api/orders";
import AvailableCouponsModal from "../components/checkout/AvailableCouponsModal";
import { useCart } from "../context/CartContext";
import { usePincodeAutofill } from "../hooks/usePincodeAutofill";
import {
  buildInternationalOrderMessage,
  buildWhatsAppUrl,
  COUNTRY_OPTIONS,
  DOMESTIC_COUNTRY,
  WHATSAPP_DISPLAY,
} from "../lib/checkout";
import {
  cartItemsToValidatePayload,
  formatINR,
  normalizeCouponCode,
} from "../lib/coupon";
import { buildOrderPayload, validateCheckoutForm } from "../lib/order";
import {
  defaultTransition,
  fadeUp,
  springSnappy,
  staggerContainer,
} from "../lib/motion";

function mapApiFieldErrors(apiErrors) {
  if (!apiErrors || typeof apiErrors !== "object") return {};

  const mapped = {};
  for (const [key, message] of Object.entries(apiErrors)) {
    const customerMatch = key.match(/^customer\.(.+)$/);
    if (customerMatch) {
      mapped[customerMatch[1]] = message;
    }
  }
  return mapped;
}

const EMPTY_FORM = {
  name: "",
  contactNumber: "",
  alternateNumber: "",
  address: "",
  landmark: "",
  pincode: "",
  city: "",
  district: "",
  state: "",
  country: DOMESTIC_COUNTRY,
};

function Field({ label, required, error, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-caption font-semibold tracking-[0.14em] text-olive-800 uppercase">
        {label}
        {required ? <span className="text-terracotta-500"> *</span> : null}
      </label>
      {children}
      {error ? <p className="text-xs text-terracotta-600">{error}</p> : null}
    </div>
  );
}

function CountryField({ value, onChange }) {
  return (
    <Field label="Country" required>
      <select
        className={inputClassName()}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="country-name"
      >
        {COUNTRY_OPTIONS.map((country) => (
          <option key={country} value={country}>
            {country}
          </option>
        ))}
      </select>
    </Field>
  );
}

function inputClassName(extra = "") {
  return `focus-ring w-full rounded-md border border-cream-300 bg-white px-3.5 py-2.5 text-body-sm text-brown-900 placeholder:text-brown-400 transition-colors focus:border-olive-500 ${extra}`;
}

function InternationalNotice({ items }) {
  const whatsappUrl = buildWhatsAppUrl(buildInternationalOrderMessage(items));

  return (
    <div className="rounded-xl border border-gold-300/80 bg-gold-50/80 p-5 sm:p-6">
      <h2 className="font-display text-xl font-semibold text-brown-900">
        International Orders
      </h2>
      <p className="mt-3 text-body-sm leading-relaxed text-brown-700">
        We currently process domestic orders within India through the website.
        For international delivery, please contact us on WhatsApp and our team
        will assist you with shipping and payment.
      </p>
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="btn btn-primary focus-ring mt-5 inline-flex items-center gap-2 px-6 py-3"
      >
        Contact on WhatsApp
        <span className="text-body-sm opacity-90">({WHATSAPP_DISPLAY})</span>
      </a>
    </div>
  );
}

export default function CheckoutPage() {
  const { items, itemCount, subtotal, subtotalDisplay } = useCart();
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [availableOpen, setAvailableOpen] = useState(false);

  const isInternational = form.country !== DOMESTIC_COUNTRY;

  const discountAmount = Number(appliedCoupon?.discountAmount) || 0;
  const totalPayable = Math.max(0, (Number(subtotal) || 0) - discountAmount);
  const totalDisplay = formatINR(totalPayable);

  useEffect(() => {
    setAppliedCoupon(null);
    setCouponError("");
  }, [items]);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    setSubmitError("");
  };

  const handlePincodeResolved = useCallback(({ city, district, state }) => {
    setForm((prev) => ({ ...prev, city, district, state }));
    setErrors((prev) => ({
      ...prev,
      city: undefined,
      district: undefined,
      state: undefined,
      pincode: undefined,
    }));
  }, []);

  const pincodeLookup = usePincodeAutofill({
    pincode: form.pincode,
    enabled: !isInternational,
    onResolved: handlePincodeResolved,
  });

  const applyCouponCode = useCallback(
    async (rawCode) => {
      const code = normalizeCouponCode(rawCode);
      if (!code) {
        setCouponError("Enter a coupon code");
        return false;
      }

      setCouponLoading(true);
      setCouponError("");

      try {
        const data = await validateCoupon({
          code,
          items: cartItemsToValidatePayload(items),
        });

        if (!data?.valid) {
          setAppliedCoupon(null);
          setCouponError(data?.message || "This coupon is not valid");
          return false;
        }

        const amount = Number(data.discountAmount) || 0;
        if (amount <= 0) {
          setAppliedCoupon(null);
          setCouponError(
            data?.message || "This coupon has no discount for your cart",
          );
          return false;
        }

        setAppliedCoupon({
          code: normalizeCouponCode(data.code || code),
          discountAmount: amount,
          discountType: data.discountType,
          discountValue: data.discountValue,
          message: data.message,
        });
        setCouponInput(normalizeCouponCode(data.code || code));
        setCouponError("");
        return true;
      } catch (error) {
        setAppliedCoupon(null);
        setCouponError(error.message || "Unable to validate coupon");
        return false;
      } finally {
        setCouponLoading(false);
      }
    },
    [items],
  );

  const handleApplyCoupon = () => {
    applyCouponCode(couponInput);
  };

  const handleSelectAvailableCoupon = async (code) => {
    const ok = await applyCouponCode(code);
    if (ok) setAvailableOpen(false);
  };

  const handleClearCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isInternational || items.length === 0) return;

    const validationErrors = validateCheckoutForm(form, { isInternational });
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    setSubmitError("");

    try {
      const coupon =
        appliedCoupon?.code && Number(appliedCoupon.discountAmount) > 0
          ? {
              code: appliedCoupon.code,
              discountAmount: appliedCoupon.discountAmount,
            }
          : null;
      const payload = buildOrderPayload(items, form, subtotal, coupon);
      const data = await createOrder(payload);

      if (!data?.checkoutPageUrl) {
        throw new Error(
          "Payment could not be started. Please try again or contact support.",
        );
      }

      // Full-page redirect to PhonePe. Cart is cleared only on /payment-success.
      window.location.assign(data.checkoutPageUrl);
    } catch (error) {
      if (error instanceof ApiError && error.errors) {
        const fieldErrors = mapApiFieldErrors(error.errors);
        if (Object.keys(fieldErrors).length > 0) {
          setErrors(fieldErrors);
        }
      }

      setSubmitError(
        error.message || "Unable to start payment. Please try again.",
      );
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return <Navigate to="/cart" replace />;
  }

  return (
    <div className="pb-16 sm:pb-20">
      <div className="border-b border-cream-300/80 bg-cream-100/90 backdrop-blur-sm">
        <div className="container-ashwini py-4">
          <nav aria-label="Breadcrumb" className="text-body-sm text-brown-500">
            <ol className="flex flex-wrap items-center gap-2">
              <li>
                <Link to="/" className="hover:text-olive-800">
                  Home
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link to="/cart" className="hover:text-olive-800">
                  Cart
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="font-medium text-brown-800">Checkout</li>
            </ol>
          </nav>
        </div>
      </div>

      <section className="product-hero-bg relative overflow-hidden section-padding">
        <motion.div
          className="container-ashwini relative z-10"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.div variants={fadeUp} transition={defaultTransition}>
            <p className="section-label mb-3 text-olive-700">Checkout</p>
            <h1 className="font-display text-display-sm sm:text-display-md text-brown-900">
              Delivery Details
            </h1>
            <p className="mt-2 text-body-sm text-brown-600">
              Enter your details to complete your order.
            </p>
          </motion.div>

          <div className="mt-10 flex flex-col gap-6 lg:grid lg:grid-cols-[1fr_minmax(0,20rem)] lg:items-start lg:gap-10">
            <CheckoutSummary
              items={items}
              itemCount={itemCount}
              subtotalDisplay={subtotalDisplay}
              payableDisplay={totalDisplay}
              discountDisplay={formatINR(discountAmount)}
              appliedCoupon={appliedCoupon}
              couponInput={couponInput}
              couponError={couponError}
              couponLoading={couponLoading}
              showCoupon={!isInternational}
              onCouponInputChange={(value) => {
                setCouponInput(value.toUpperCase().replace(/\s+/g, ""));
                setCouponError("");
              }}
              onApplyCoupon={handleApplyCoupon}
              onClearCoupon={handleClearCoupon}
              onViewAvailable={() => setAvailableOpen(true)}
            />

            <motion.div
              className="order-2 lg:order-1"
              variants={fadeUp}
              transition={defaultTransition}
            >
              {isInternational ? (
                <div className="space-y-5">
                  <div className="product-info-panel p-5 sm:p-7">
                    <CountryField
                      value={form.country}
                      onChange={(value) => updateField("country", value)}
                    />
                  </div>
                  <InternationalNotice items={items} />
                  <Link
                    to="/cart"
                    className="btn focus-ring inline-flex border border-cream-300 bg-white px-6 py-3 text-brown-800 hover:border-olive-500 hover:text-olive-800"
                  >
                    Back to Cart
                  </Link>
                </div>
              ) : (
                <form
                  onSubmit={handleSubmit}
                  className="product-info-panel space-y-5 p-5 sm:p-7"
                >
                  <Field label="Name" required error={errors.name}>
                    <input
                      className={inputClassName()}
                      value={form.name}
                      onChange={(e) => updateField("name", e.target.value)}
                      placeholder="Full name"
                      autoComplete="name"
                    />
                  </Field>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field label="Contact No." required error={errors.contactNumber}>
                      <input
                        className={inputClassName()}
                        value={form.contactNumber}
                        onChange={(e) =>
                          updateField("contactNumber", e.target.value)
                        }
                        placeholder="+91 98765 43210"
                        autoComplete="tel"
                        inputMode="tel"
                      />
                    </Field>

                    <Field label="Alternate Number" error={errors.alternateNumber}>
                      <input
                        className={inputClassName()}
                        value={form.alternateNumber}
                        onChange={(e) =>
                          updateField("alternateNumber", e.target.value)
                        }
                        placeholder="Optional"
                        autoComplete="tel"
                        inputMode="tel"
                      />
                    </Field>
                  </div>

                  <CountryField
                    value={form.country}
                    onChange={(value) => updateField("country", value)}
                  />

                  <Field label="Address" required error={errors.address}>
                    <textarea
                      className={inputClassName("min-h-24 resize-y")}
                      value={form.address}
                      onChange={(e) => updateField("address", e.target.value)}
                      placeholder="House / flat / street"
                      autoComplete="street-address"
                    />
                  </Field>

                  <Field label="Landmark" error={errors.landmark}>
                    <input
                      className={inputClassName()}
                      value={form.landmark}
                      onChange={(e) => updateField("landmark", e.target.value)}
                      placeholder="Near temple, school, etc. (optional)"
                    />
                  </Field>

                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    <Field label="Pincode" required error={errors.pincode}>
                      <input
                        className={inputClassName()}
                        value={form.pincode}
                        onChange={(e) =>
                          updateField(
                            "pincode",
                            e.target.value.replace(/\D/g, "").slice(0, 6),
                          )
                        }
                        placeholder="Enter Pincode"
                        inputMode="numeric"
                        autoComplete="postal-code"
                        maxLength={6}
                      />
                      {!errors.pincode && pincodeLookup.message ? (
                        <p
                          className={`text-xs ${
                            pincodeLookup.status === "error"
                              ? "text-terracotta-600"
                              : "text-olive-700"
                          }`}
                        >
                          {pincodeLookup.message}
                        </p>
                      ) : null}
                    </Field>

                    <Field label="City" required error={errors.city}>
                      <input
                        className={inputClassName()}
                        value={form.city}
                        onChange={(e) => updateField("city", e.target.value)}
                        placeholder="City will autofill based on pincode"
                        autoComplete="address-level2"
                      />
                    </Field>

                    <Field label="District" required error={errors.district}>
                      <input
                        className={inputClassName()}
                        value={form.district}
                        onChange={(e) =>
                          updateField("district", e.target.value)
                        }
                        placeholder="District will autofill based on pincode"
                      />
                    </Field>

                    <Field label="State" required error={errors.state}>
                      <input
                        className={inputClassName()}
                        value={form.state}
                        onChange={(e) => updateField("state", e.target.value)}
                        placeholder="State will autofill based on pincode"
                        autoComplete="address-level1"
                      />
                    </Field>
                  </div>

                  {submitError ? (
                    <p className="rounded-md border border-terracotta-400/40 bg-terracotta-500/10 px-3 py-2 text-body-sm text-terracotta-600">
                      {submitError}
                    </p>
                  ) : null}

                  <motion.button
                    type="submit"
                    disabled={submitting}
                    className="btn btn-primary focus-ring w-full px-6 py-3.5 disabled:opacity-60"
                    whileHover={{ scale: submitting ? 1 : 1.02 }}
                    whileTap={{ scale: submitting ? 1 : 0.98 }}
                    transition={springSnappy}
                  >
                    {submitting
                      ? "Redirecting to Payment..."
                      : `Pay ${totalDisplay}`}
                  </motion.button>
                </form>
              )}
            </motion.div>
          </div>
        </motion.div>
      </section>

      <AvailableCouponsModal
        open={availableOpen}
        onClose={() => setAvailableOpen(false)}
        cartItems={items}
        onSelect={handleSelectAvailableCoupon}
        selecting={couponLoading}
      />
    </div>
  );
}

function formatLinePrice(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function ChevronIcon({ open }) {
  return (
    <ChevronDown
      {...iconProps(16)}
      className={`shrink-0 text-brown-600 transition-transform duration-300 ${
        open ? "rotate-180" : ""
      }`}
    />
  );
}

function CheckoutSummary({
  items,
  itemCount,
  subtotalDisplay,
  couponInput,
  onCouponInputChange,
  onApplyCoupon,
  onClearCoupon,
  onViewAvailable,
  couponLoading,
  couponError,
  appliedCoupon,
  discountDisplay,
  payableDisplay,
  showCoupon,
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const summaryProps = {
    items,
    itemCount,
    subtotalDisplay,
    couponInput,
    onCouponInputChange,
    onApplyCoupon,
    onClearCoupon,
    onViewAvailable,
    couponLoading,
    couponError,
    appliedCoupon,
    discountDisplay,
    payableDisplay,
    showCoupon,
  };

  return (
    <motion.aside
      className="product-info-panel order-1 p-0 lg:order-2 lg:sticky lg:top-24 lg:p-6 xl:p-7"
      variants={fadeUp}
      transition={{ ...defaultTransition, delay: 0.06 }}
    >
      <button
        type="button"
        onClick={() => setMobileOpen((open) => !open)}
        aria-expanded={mobileOpen}
        className="focus-ring flex w-full items-center justify-between gap-3 p-4 text-left lg:hidden"
      >
        <div className="min-w-0">
          <h2 className="font-display text-lg font-semibold text-brown-900">
            Order Summary
          </h2>
          <p className="mt-0.5 text-body-sm text-brown-600">
            {itemCount} item{itemCount !== 1 ? "s" : ""} ·{" "}
            {appliedCoupon ? payableDisplay : subtotalDisplay}
          </p>
        </div>
        <ChevronIcon open={mobileOpen} />
      </button>

      <h2 className="hidden font-display text-xl font-semibold text-brown-900 lg:block lg:px-0 lg:pt-0">
        Order Summary
      </h2>

      <div className="hidden lg:block">
        <CheckoutSummaryContent {...summaryProps} />
      </div>

      <AnimatePresence initial={false}>
        {mobileOpen ? (
          <motion.div
            key="mobile-summary"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden lg:hidden"
          >
            <div className="border-t border-cream-300 px-4 pt-4 pb-4">
              <CheckoutSummaryContent {...summaryProps} />
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.aside>
  );
}

function CheckoutSummaryContent({
  items,
  itemCount,
  subtotalDisplay,
  couponInput,
  onCouponInputChange,
  onApplyCoupon,
  onClearCoupon,
  onViewAvailable,
  couponLoading,
  couponError,
  appliedCoupon,
  discountDisplay,
  payableDisplay,
  showCoupon,
}) {
  return (
    <>
      <ul className="space-y-3 border-b border-cream-300 pb-4 lg:mt-5">
        {items.map((item) => (
          <li
            key={item.lineId}
            className="flex items-start justify-between gap-3 text-body-sm"
          >
            <span className="text-brown-700">
              {item.name}
              {item.variantLabel ? ` (${item.variantLabel})` : ""} ×{" "}
              {item.quantity}
            </span>
            <span className="shrink-0 font-medium text-brown-900">
              {formatLinePrice(item.price * item.quantity)}
            </span>
          </li>
        ))}
      </ul>

      {showCoupon ? (
        <div className="mt-4 space-y-2 border-b border-cream-300 pb-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-caption font-semibold tracking-[0.14em] text-olive-800 uppercase">
              Coupon
            </p>
            {!appliedCoupon ? (
              <button
                type="button"
                onClick={onViewAvailable}
                className="focus-ring text-[0.65rem] font-semibold tracking-wider text-olive-800 uppercase hover:text-olive-950"
              >
                View available
              </button>
            ) : null}
          </div>
          {appliedCoupon ? (
            <div className="flex items-start justify-between gap-3 rounded-md border border-olive-200 bg-olive-50/80 px-3 py-2.5">
              <div className="min-w-0">
                <p className="font-mono text-body-sm font-semibold tracking-wide text-olive-900">
                  {appliedCoupon.code}
                </p>
                <p className="mt-0.5 text-xs text-olive-700">
                  {appliedCoupon.message || "Coupon applied"}
                </p>
              </div>
              <button
                type="button"
                onClick={onClearCoupon}
                className="focus-ring shrink-0 text-[0.65rem] font-semibold tracking-wider text-terracotta-600 uppercase hover:text-terracotta-700"
              >
                Remove
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                className={inputClassName("font-mono tracking-wider")}
                value={couponInput}
                onChange={(e) => onCouponInputChange(e.target.value)}
                placeholder="Enter code"
                autoComplete="off"
                disabled={couponLoading}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    onApplyCoupon();
                  }
                }}
              />
              <button
                type="button"
                onClick={onApplyCoupon}
                disabled={couponLoading || !couponInput.trim()}
                className="btn btn-primary shrink-0 px-4 py-2.5 text-[0.68rem] disabled:opacity-60"
              >
                {couponLoading ? "..." : "Apply"}
              </button>
            </div>
          )}
          {couponError ? (
            <p className="text-xs text-terracotta-600">{couponError}</p>
          ) : null}
        </div>
      ) : null}

      <dl className="mt-4 space-y-3 text-body-sm">
        <div className="flex items-center justify-between text-brown-600">
          <dt>Items ({itemCount})</dt>
          <dd className="font-medium text-brown-800">{subtotalDisplay}</dd>
        </div>
        {appliedCoupon && Number(appliedCoupon.discountAmount) > 0 ? (
          <div className="flex items-center justify-between text-olive-800">
            <dt>Discount ({appliedCoupon.code})</dt>
            <dd className="font-medium">−{discountDisplay}</dd>
          </div>
        ) : null}
        <div className="flex items-center justify-between border-t border-cream-300 pt-3">
          <dt className="font-display text-base font-semibold text-brown-900">
            {appliedCoupon ? "Total" : "Subtotal"}
          </dt>
          <dd className="font-display text-xl font-semibold text-olive-800">
            {appliedCoupon ? payableDisplay : subtotalDisplay}
          </dd>
        </div>
      </dl>

      <Link
        to="/cart"
        className="btn focus-ring mt-5 flex w-full items-center justify-center border border-cream-300 bg-white px-6 py-3 text-center text-brown-800 hover:border-olive-500 hover:text-olive-800"
      >
        Back to Cart
      </Link>
    </>
  );
}
