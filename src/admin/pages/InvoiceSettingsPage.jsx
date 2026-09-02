import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  clearInvoiceSettingsErrors,
  loadInvoiceSettings,
  saveInvoiceSettings,
} from "../../store/slices/invoiceSettingsSlice";
import {
  INVOICE_NUMBER_FORMAT_HINT,
  validateNextInvoiceNumber,
} from "../../lib/invoiceNumber";
import { AdminField, AdminInput } from "../components/AdminFormFields";

export default function InvoiceSettingsPage() {
  const dispatch = useDispatch();
  const { settings, status, error, mutationStatus, mutationError } =
    useSelector((state) => state.invoiceSettings);

  const [nextInvoiceNumber, setNextInvoiceNumber] = useState("");
  const [fieldError, setFieldError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    dispatch(clearInvoiceSettingsErrors());
    dispatch(loadInvoiceSettings());
  }, [dispatch]);

  useEffect(() => {
    if (settings?.nextInvoiceNumber) {
      setNextInvoiceNumber(settings.nextInvoiceNumber);
    }
  }, [settings?.nextInvoiceNumber]);

  const saving = mutationStatus === "loading";
  const loading = status === "loading";

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSuccessMessage(null);
    dispatch(clearInvoiceSettingsErrors());

    const result = validateNextInvoiceNumber(nextInvoiceNumber);
    if (!result.ok) {
      setFieldError(result.message);
      return;
    }

    setFieldError(null);
    const action = await dispatch(
      saveInvoiceSettings({ nextInvoiceNumber: result.value }),
    );
    if (action.meta.requestStatus === "fulfilled") {
      setSuccessMessage(
        `Next invoice number set to ${action.payload?.nextInvoiceNumber || result.value}. New online and manual orders will continue from this number upwards.`,
      );
    }
  };

  return (
    <>
      <div className="mb-6">
        <p className="section-label mb-2">Master Data</p>
        <h1 className="font-display text-display-sm text-brown-900">
          Invoice Number
        </h1>
        <p className="mt-1 max-w-2xl text-body-sm text-brown-500">
          Set the next invoice number. Online checkout and admin manual orders
          share one sequence and continue upwards in this format only.
        </p>
      </div>

      {loading && (
        <div className="card flex items-center justify-center py-16">
          <p className="text-body-sm text-brown-500">
            Loading invoice settings...
          </p>
        </div>
      )}

      {status === "failed" && (
        <div className="rounded-lg border border-terracotta-400/40 bg-terracotta-500/10 px-4 py-3 text-body-sm text-terracotta-600">
          {error}
        </div>
      )}

      {status === "succeeded" && (
        <div className="card max-w-xl space-y-6 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-md border border-cream-300 bg-cream-50 px-4 py-3">
              <p className="text-[0.65rem] font-semibold tracking-[0.14em] text-olive-800 uppercase">
                Last issued
              </p>
              <p className="mt-1 font-mono text-body text-brown-900">
                {settings.lastIssuedInvoiceNumber || "—"}
              </p>
            </div>
            <div className="rounded-md border border-cream-300 bg-cream-50 px-4 py-3">
              <p className="text-[0.65rem] font-semibold tracking-[0.14em] text-olive-800 uppercase">
                Next to issue
              </p>
              <p className="mt-1 font-mono text-body text-brown-900">
                {settings.nextInvoiceNumber || "—"}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <AdminField
              label="Next invoice number"
              required
              error={fieldError}
            >
              <AdminInput
                value={nextInvoiceNumber}
                onChange={(event) => {
                  setNextInvoiceNumber(event.target.value.toUpperCase());
                  setFieldError(null);
                  setSuccessMessage(null);
                }}
                placeholder="NA-2026-00001"
                autoComplete="off"
                spellCheck={false}
                className="font-mono tracking-wide"
                disabled={saving}
              />
            </AdminField>

            <p className="text-xs text-brown-500">
              Format: <span className="font-mono">{INVOICE_NUMBER_FORMAT_HINT}</span>.
              The number you save is the next one assigned; after that, invoices
              continue +1 (manual and online).
            </p>

            {(mutationError || successMessage) && (
              <div
                className={`rounded-md border px-3 py-2 text-body-sm ${
                  mutationError
                    ? "border-terracotta-400/40 bg-terracotta-500/10 text-terracotta-600"
                    : "border-olive-400/40 bg-olive-100 text-olive-800"
                }`}
              >
                {mutationError || successMessage}
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="btn btn-primary px-5 py-2.5 text-[0.68rem] disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save next number"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
