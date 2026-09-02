import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { COUNTRY_OPTIONS, DOMESTIC_COUNTRY } from "../../../lib/checkout";
import { validateCheckoutForm } from "../../../lib/order";
import { usePincodeAutofill } from "../../../hooks/usePincodeAutofill";
import { loadInvoiceSettings } from "../../../store/slices/invoiceSettingsSlice";
import AdminDrawer from "../../components/AdminDrawer";
import {
  AdminField,
  AdminInput,
  AdminSelect,
  AdminTextarea,
} from "../../components/AdminFormFields";
import OrderProductLineEditor from "./OrderProductLineEditor";
import {
  calcOrderTotals,
  formatINR,
  gstSplitLabel,
  recomputeOrderLine,
  TAX_TYPE_IGST,
  todayISODate,
} from "./orderMath";

const EMPTY_CUSTOMER = {
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

export default function OrderFormDrawer({
  open,
  onClose,
  onSave,
  saving = false,
  error = null,
}) {
  const dispatch = useDispatch();
  const nextInvoiceNumber = useSelector(
    (state) => state.invoiceSettings.settings?.nextInvoiceNumber,
  );
  const invoiceSettingsStatus = useSelector(
    (state) => state.invoiceSettings.status,
  );

  const [orderDate, setOrderDate] = useState(todayISODate);
  const [customer, setCustomer] = useState(() => ({ ...EMPTY_CUSTOMER }));
  const [lines, setLines] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});
  const [validationError, setValidationError] = useState(null);

  useEffect(() => {
    if (open) {
      dispatch(loadInvoiceSettings());
    }
  }, [open, dispatch]);

  const place = useMemo(
    () => ({ customerState: customer.state }),
    [customer.state],
  );

  const totals = useMemo(() => calcOrderTotals(lines), [lines]);
  const isIgst = totals.taxType === TAX_TYPE_IGST;

  // When customer state changes, re-split included GST (CGST/SGST vs IGST).
  useEffect(() => {
    setLines((prev) => {
      if (!prev.length) return prev;
      return prev.map((line) => recomputeOrderLine(line, {}, place));
    });
  }, [place]);

  const updateCustomer = (field, value) => {
    setCustomer((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    setValidationError(null);
  };

  const handlePincodeResolved = useCallback(({ city, district, state }) => {
    setCustomer((prev) => ({ ...prev, city, district, state }));
    setFieldErrors((prev) => ({
      ...prev,
      city: undefined,
      district: undefined,
      state: undefined,
      pincode: undefined,
    }));
  }, []);

  const pincodeLookup = usePincodeAutofill({
    pincode: customer.pincode,
    enabled: open && customer.country === DOMESTIC_COUNTRY,
    onResolved: handlePincodeResolved,
  });

  const buildPayload = () => {
    const isInternational = customer.country !== DOMESTIC_COUNTRY;
    return {
      orderDate,
      customer: {
        name: customer.name.trim(),
        contactNumber: customer.contactNumber.trim(),
        alternateNumber: customer.alternateNumber?.trim() || undefined,
        address: customer.address.trim(),
        landmark: customer.landmark?.trim() || undefined,
        pincode: customer.pincode.trim(),
        city: customer.city.trim(),
        district: customer.district.trim(),
        state: customer.state.trim(),
        country: customer.country.trim(),
      },
      items: lines.map((line) => ({
        productId: line.productId,
        slug: line.slug,
        name: line.name,
        variantId: line.variantId,
        variantLabel: line.variantLabel,
        quantity: Number(line.quantity) || 0,
        unitPrice: Number(line.unitPrice) || 0,
        taxRate: Number(line.taxRate) || 5,
        taxType: line.taxType || totals.taxType,
        taxable: Number(line.taxable) || 0,
        taxAmount: Number(line.taxAmount) || 0,
        cgstRate: Number(line.cgstRate) || 0,
        sgstRate: Number(line.sgstRate) || 0,
        igstRate: Number(line.igstRate) || 0,
        cgstAmount: Number(line.cgstAmount) || 0,
        sgstAmount: Number(line.sgstAmount) || 0,
        igstAmount: Number(line.igstAmount) || 0,
        lineTotal: Number(line.lineTotal) || 0,
      })),
      taxableAmount: totals.taxableAmount,
      taxAmount: totals.taxAmount,
      taxType: totals.taxType,
      cgstAmount: totals.cgstAmount,
      sgstAmount: totals.sgstAmount,
      igstAmount: totals.igstAmount,
      cgstRate: totals.cgstRate,
      sgstRate: totals.sgstRate,
      igstRate: totals.igstRate,
      taxRate: totals.taxRate,
      subtotal: totals.subtotal,
      totalAmount: totals.totalAmount,
      currency: "INR",
      orderType: isInternational ? "international" : "domestic",
      status: "completed",
      paymentStatus: "COMPLETED",
      manual_entry: true,
    };
  };

  const handleSave = async () => {
    const errors = validateCheckoutForm(customer, { isInternational: false });
    // Admin manual orders require full delivery details even if country changes.
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setValidationError("Please fix the customer details before saving.");
      return;
    }
    if (!lines.length) {
      setValidationError("Add at least one product line before saving.");
      return;
    }
    if (lines.some((line) => !(Number(line.quantity) > 0))) {
      setValidationError("Every line must have a quantity greater than zero.");
      return;
    }

    setValidationError(null);
    setFieldErrors({});
    await onSave?.(buildPayload());
  };

  return (
    <AdminDrawer
      open={open}
      onClose={onClose}
      title="Add Order"
      subtitle="Manual entry · prices incl. 5% GST · marked completed"
      size="wide"
      footer={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="font-display text-xl text-brown-900">
              TOTAL{" "}
              <span className="text-olive-800">
                {formatINR(totals.totalAmount)}
              </span>
            </p>
            <p className="text-xs text-brown-500">
              Taxable {formatINR(totals.taxableAmount)}
              {isIgst ? (
                <>
                  {" "}
                  · IGST {formatINR(totals.igstAmount)}
                </>
              ) : (
                <>
                  {" "}
                  · CGST {formatINR(totals.cgstAmount)} · SGST{" "}
                  {formatINR(totals.sgstAmount)}
                </>
              )}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={onClose}
              className="btn btn-secondary px-4 py-2.5 text-[0.68rem] disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
              className="btn btn-primary px-5 py-2.5 text-[0.68rem] disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Order"}
            </button>
          </div>
        </div>
      }
    >
        <div className="mx-auto max-w-6xl space-y-6">
        {(validationError || error) && (
          <div className="rounded-md border border-terracotta-400/40 bg-terracotta-500/10 px-3 py-2 text-body-sm text-terracotta-600">
            {validationError || error}
          </div>
        )}

        <form
          autoComplete="off"
          onSubmit={(event) => {
            event.preventDefault();
            handleSave();
          }}
          className="space-y-6"
        >
        <div className="rounded-lg border border-cream-300 bg-white p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <AdminField label="Order Date" required>
              <AdminInput
                type="date"
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
                className="max-w-xs"
                name="manual-order-date"
                autoComplete="off"
              />
            </AdminField>
            <AdminField label="Invoice number (auto)">
              <AdminInput
                value={
                  invoiceSettingsStatus === "loading" && !nextInvoiceNumber
                    ? "Loading…"
                    : nextInvoiceNumber || "—"
                }
                readOnly
                disabled
                className="max-w-xs font-mono tracking-wide"
                name="manual-order-invoice"
                aria-live="polite"
              />
            </AdminField>
          </div>
          <p className="mt-2 text-xs text-brown-500">
            Invoice continues from Master Data → Invoice Number (same series as
            online orders). Saved as{" "}
            <span className="font-medium">completed</span> with payment{" "}
            <span className="font-medium">COMPLETED</span> and{" "}
            <span className="font-medium">manual_entry: true</span>. Amount is
            counted in revenue. GST split follows customer state (Karnataka =
            CGST+SGST, other states = IGST).
          </p>
        </div>

        <section className="space-y-4 rounded-lg border border-cream-300 bg-white p-4">
          <h3 className="text-caption font-semibold tracking-[0.14em] text-olive-800 uppercase">
            Customer
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <AdminField label="Name" required error={fieldErrors.name}>
              <AdminInput
                value={customer.name}
                onChange={(e) => updateCustomer("name", e.target.value)}
                name="manual-order-name"
                autoComplete="off"
              />
            </AdminField>
            <AdminField
              label="Contact Number"
              required
              error={fieldErrors.contactNumber}
            >
              <AdminInput
                value={customer.contactNumber}
                onChange={(e) =>
                  updateCustomer("contactNumber", e.target.value)
                }
                name="manual-order-phone"
                autoComplete="off"
              />
            </AdminField>
            <AdminField
              label="Alternate Number"
              error={fieldErrors.alternateNumber}
            >
              <AdminInput
                value={customer.alternateNumber}
                onChange={(e) =>
                  updateCustomer("alternateNumber", e.target.value)
                }
                name="manual-order-alt-phone"
                autoComplete="off"
              />
            </AdminField>
            <AdminField label="Country" required>
              <AdminSelect
                value={customer.country}
                onChange={(e) => updateCustomer("country", e.target.value)}
                name="manual-order-country"
              >
                {COUNTRY_OPTIONS.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </AdminSelect>
            </AdminField>
          </div>
          <AdminField label="Address" required error={fieldErrors.address}>
            <AdminTextarea
              value={customer.address}
              onChange={(e) => updateCustomer("address", e.target.value)}
              rows={2}
              name="manual-order-address"
              autoComplete="off"
            />
          </AdminField>
          <AdminField label="Landmark" error={fieldErrors.landmark}>
            <AdminInput
              value={customer.landmark}
              onChange={(e) => updateCustomer("landmark", e.target.value)}
              name="manual-order-landmark"
              autoComplete="off"
            />
          </AdminField>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <AdminField label="Pincode" required error={fieldErrors.pincode}>
              <AdminInput
                value={customer.pincode}
                onChange={(e) =>
                  updateCustomer(
                    "pincode",
                    e.target.value.replace(/\D/g, "").slice(0, 6),
                  )
                }
                placeholder="Enter Pincode"
                name="manual-order-pincode"
                autoComplete="off"
                inputMode="numeric"
                maxLength={6}
              />
              {!fieldErrors.pincode && pincodeLookup.message ? (
                <p
                  className={`mt-1.5 text-xs ${
                    pincodeLookup.status === "error"
                      ? "text-terracotta-600"
                      : "text-olive-700"
                  }`}
                >
                  {pincodeLookup.message}
                </p>
              ) : null}
            </AdminField>
            <AdminField label="City" required error={fieldErrors.city}>
              <AdminInput
                value={customer.city}
                onChange={(e) => updateCustomer("city", e.target.value)}
                placeholder="City will autofill based on pincode"
                name="manual-order-city"
                autoComplete="off"
              />
            </AdminField>
            <AdminField label="District" required error={fieldErrors.district}>
              <AdminInput
                value={customer.district}
                onChange={(e) => updateCustomer("district", e.target.value)}
                placeholder="District will autofill based on pincode"
                name="manual-order-district"
                autoComplete="off"
              />
            </AdminField>
            <AdminField label="State" required error={fieldErrors.state}>
              <AdminInput
                value={customer.state}
                onChange={(e) => updateCustomer("state", e.target.value)}
                placeholder="State will autofill based on pincode"
                name="manual-order-state"
                autoComplete="off"
              />
            </AdminField>
          </div>
        </section>

        <section className="rounded-lg border border-cream-300 bg-white p-4">
          <OrderProductLineEditor
            lines={lines}
            onChange={setLines}
            customerState={customer.state}
          />

          {lines.length > 0 && (
            <div className="mt-4 flex flex-col items-end gap-1 border-t border-cream-300 pt-4 text-body-sm">
              <div className="flex min-w-[16rem] justify-between gap-8 text-brown-600">
                <span>Taxable amount</span>
                <span>{formatINR(totals.taxableAmount)}</span>
              </div>
              {isIgst ? (
                <div className="flex min-w-[16rem] justify-between gap-8 text-brown-600">
                  <span>IGST ({totals.igstRate}%)</span>
                  <span>{formatINR(totals.igstAmount)}</span>
                </div>
              ) : (
                <>
                  <div className="flex min-w-[16rem] justify-between gap-8 text-brown-600">
                    <span>CGST ({totals.cgstRate}%)</span>
                    <span>{formatINR(totals.cgstAmount)}</span>
                  </div>
                  <div className="flex min-w-[16rem] justify-between gap-8 text-brown-600">
                    <span>SGST ({totals.sgstRate}%)</span>
                    <span>{formatINR(totals.sgstAmount)}</span>
                  </div>
                </>
              )}
              <p className="w-full max-w-[16rem] text-right text-[0.65rem] text-brown-400">
                {gstSplitLabel(totals.taxType, totals.taxRate)} · included in
                price
              </p>
              <div className="flex min-w-[16rem] justify-between gap-8 font-semibold text-brown-900">
                <span>Grand total</span>
                <span>{formatINR(totals.totalAmount)}</span>
              </div>
            </div>
          )}
        </section>
        </form>
      </div>
    </AdminDrawer>
  );
}
