import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  addVendor,
  clearVendorErrors,
  editVendor,
} from "../../store/slices/vendorsSlice";
import { usePincodeAutofill } from "../../hooks/usePincodeAutofill";
import { DOMESTIC_COUNTRY } from "../../lib/checkout";
import AdminDrawer from "./AdminDrawer";
import {
  AdminField,
  AdminInput,
  AdminTextarea,
} from "./AdminFormFields";

const EMPTY_FORM = {
  name: "",
  phone: "",
  email: "",
  company: "",
  gstin: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  district: "",
  state: "",
  pincode: "",
  country: "India",
  notes: "",
  tags: "",
};

export default function VendorFormDrawer({
  open,
  onClose,
  vendor,
  onSaved,
  detailLoading = false,
  detailError = null,
  nested = false,
}) {
  const dispatch = useDispatch();
  const mutationStatus = useSelector((state) => state.vendors.mutationStatus);
  const mutationError = useSelector((state) => state.vendors.mutationError);
  const isEditing = Boolean(vendor);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (!open) return;
    dispatch(clearVendorErrors());
    if (detailLoading) return;
    if (vendor) {
      setForm({
        name: vendor.name || "",
        phone: vendor.phone || "",
        email: vendor.email || "",
        company: vendor.company || "",
        gstin: vendor.gstin || "",
        addressLine1: vendor.billingAddress?.line1 || vendor.addressLine1 || "",
        addressLine2: vendor.billingAddress?.line2 || vendor.addressLine2 || "",
        city: vendor.billingAddress?.city || vendor.city || "",
        district: vendor.billingAddress?.district || vendor.district || "",
        state: vendor.billingAddress?.state || vendor.state || "",
        pincode: vendor.billingAddress?.pincode || vendor.pincode || "",
        country: vendor.billingAddress?.country || vendor.country || "India",
        notes: vendor.notes || "",
        tags: Array.isArray(vendor.tags) ? vendor.tags.join(", ") : vendor.tags || "",
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [open, vendor, detailLoading, dispatch]);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handlePincodeResolved = useCallback(({ city, district, state }) => {
    setForm((prev) => ({ ...prev, city, district, state }));
  }, []);

  const pincodeLookup = usePincodeAutofill({
    pincode: form.pincode,
    enabled:
      open &&
      String(form.country || "")
        .trim()
        .toLowerCase() === DOMESTIC_COUNTRY.toLowerCase(),
    onResolved: handlePincodeResolved,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim() || undefined,
      email: form.email.trim() || undefined,
      company: form.company.trim() || undefined,
      gstin: form.gstin.trim() || undefined,
      notes: form.notes.trim() || undefined,
      tags: form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      billingAddress: {
        line1: form.addressLine1.trim() || undefined,
        line2: form.addressLine2.trim() || undefined,
        city: form.city.trim() || undefined,
        district: form.district.trim() || undefined,
        state: form.state.trim() || undefined,
        pincode: form.pincode.trim() || undefined,
        country: form.country.trim() || "India",
      },
    };

    const action = isEditing
      ? await dispatch(editVendor({ id: vendor.id, payload }))
      : await dispatch(addVendor(payload));

    if (action.meta.requestStatus === "fulfilled") {
      onSaved?.(action.payload);
      onClose();
    }
  };

  const saving = mutationStatus === "loading";

  return (
    <AdminDrawer
      open={open}
      onClose={onClose}
      title={isEditing ? "Edit Vendor" : "Add Vendor"}
      size="lg"
      nested={nested}
      headerActions={
        <button
          type="submit"
          form="vendor-form"
          disabled={saving || !form.name.trim()}
          className="btn btn-primary px-4 py-2 text-[0.68rem]"
        >
          {saving ? "Saving..." : isEditing ? "Save" : "Add Vendor"}
        </button>
      }
    >
      <form id="vendor-form" onSubmit={handleSubmit} className="space-y-5">
        {detailLoading && (
          <p className="text-body-sm text-brown-500">Loading vendor details...</p>
        )}
        {detailError && (
          <div className="rounded-md border border-terracotta-400/40 bg-terracotta-500/10 px-3 py-2 text-body-sm text-terracotta-600">
            {detailError}
          </div>
        )}
        {mutationError && (
          <div className="rounded-md border border-terracotta-400/40 bg-terracotta-500/10 px-3 py-2 text-body-sm text-terracotta-600">
            {mutationError}
          </div>
        )}

        <fieldset disabled={detailLoading} className="space-y-5 border-0 p-0">
        <section className="space-y-4">
          <h3 className="text-caption font-semibold tracking-[0.14em] text-olive-800 uppercase">
            Basic Details
          </h3>
          <AdminField label="Name" required>
            <AdminInput
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              required
            />
          </AdminField>
          <div className="grid gap-4 sm:grid-cols-2">
            <AdminField label="Phone">
              <AdminInput
                value={form.phone}
                onChange={(e) => updateField("phone", e.target.value)}
              />
            </AdminField>
            <AdminField label="Email">
              <AdminInput
                type="email"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
              />
            </AdminField>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-caption font-semibold tracking-[0.14em] text-olive-800 uppercase">
            Company Details
          </h3>
          <AdminField label="Company">
            <AdminInput
              value={form.company}
              onChange={(e) => updateField("company", e.target.value)}
            />
          </AdminField>
          <AdminField label="GSTIN">
            <AdminInput
              value={form.gstin}
              onChange={(e) => updateField("gstin", e.target.value)}
            />
          </AdminField>
          <AdminField label="Address Line 1">
            <AdminInput
              value={form.addressLine1}
              onChange={(e) => updateField("addressLine1", e.target.value)}
            />
          </AdminField>
          <AdminField label="Address Line 2">
            <AdminInput
              value={form.addressLine2}
              onChange={(e) => updateField("addressLine2", e.target.value)}
            />
          </AdminField>
          <div className="grid gap-4 sm:grid-cols-2">
            <AdminField label="Pincode">
              <AdminInput
                value={form.pincode}
                onChange={(e) =>
                  updateField(
                    "pincode",
                    e.target.value.replace(/\D/g, "").slice(0, 6),
                  )
                }
                inputMode="numeric"
                maxLength={6}
                placeholder="Enter Pincode"
              />
              {pincodeLookup.message ? (
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
            <AdminField label="City">
              <AdminInput
                value={form.city}
                onChange={(e) => updateField("city", e.target.value)}
                placeholder="City will autofill based on pincode"
              />
            </AdminField>
            <AdminField label="District">
              <AdminInput
                value={form.district}
                onChange={(e) => updateField("district", e.target.value)}
                placeholder="District will autofill based on pincode"
              />
            </AdminField>
            <AdminField label="State">
              <AdminInput
                value={form.state}
                onChange={(e) => updateField("state", e.target.value)}
                placeholder="State will autofill based on pincode"
              />
            </AdminField>
            <AdminField label="Country">
              <AdminInput
                value={form.country}
                onChange={(e) => updateField("country", e.target.value)}
              />
            </AdminField>
          </div>
        </section>

        <section className="space-y-4">
          <AdminField label="Tags">
            <AdminInput
              value={form.tags}
              onChange={(e) => updateField("tags", e.target.value)}
              placeholder="Comma separated"
            />
          </AdminField>
          <AdminField label="Notes">
            <AdminTextarea
              value={form.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              rows={3}
            />
          </AdminField>
        </section>
        </fieldset>
      </form>
    </AdminDrawer>
  );
}
