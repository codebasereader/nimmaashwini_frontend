import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  clearInvoiceSettingsErrors,
  loadInvoiceSettings,
  saveInvoiceSettings,
} from "../../../store/slices/invoiceSettingsSlice";
import {
  INVOICE_NUMBER_FORMAT_HINT,
  getInvoicePrefix,
  parseInvoiceNumber,
  validateNextInvoiceSequence,
} from "../../../lib/invoiceNumber";
import { AdminField, AdminInput } from "../../components/AdminFormFields";

export default function InvoiceSettingsPage() {
  const dispatch = useDispatch();
  const { settings, status, error, mutationStatus, mutationError } =
    useSelector((state) => state.invoiceSettings);

  // The month-year prefix is fixed; admins only edit the number after it.
  const prefix = getInvoicePrefix();
  const [draft, setDraft] = useState(null);
  const [fieldError, setFieldError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    dispatch(clearInvoiceSettingsErrors());
    dispatch(loadInvoiceSettings());
  }, [dispatch]);

  const savedSequence = parseInvoiceNumber(settings?.nextInvoiceNumber)?.sequence;
  const nextSequence = draft ?? (savedSequence != null ? String(savedSequence) : "");

  const saving = mutationStatus === "loading";
  const loading = status === "loading";

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSuccessMessage(null);
    dispatch(clearInvoiceSettingsErrors());

    const result = validateNextInvoiceSequence(nextSequence);
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
      setDraft(null);
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
              <div className="flex items-stretch gap-2">
                <span className="flex items-center rounded-md border border-cream-300 bg-cream-100 px-3 font-mono tracking-wide text-brown-700 select-none">
                  {prefix}
                </span>
                <AdminInput
                  value={nextSequence}
                  onChange={(event) => {
                    setDraft(event.target.value.replace(/[^0-9]/g, ""));
                    setFieldError(null);
                    setSuccessMessage(null);
                  }}
                  placeholder="9176"
                  inputMode="numeric"
                  autoComplete="off"
                  className="font-mono tracking-wide"
                  disabled={saving}
                />
              </div>
            </AdminField>

            <p className="text-xs text-brown-500">
              Format: <span className="font-mono">{INVOICE_NUMBER_FORMAT_HINT}</span>.
              The month and year are fixed to the current month; edit only the
              number. It is the next one assigned; after that, invoices continue
              +1 (manual and online).
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
