import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  addAdminUser,
  clearAdminUserErrors,
  editAdminUser,
} from "../../store/slices/adminUsersSlice";
import AdminDrawer from "./AdminDrawer";
import {
  AdminField,
  AdminInput,
  AdminSelect,
  AdminToggle,
} from "./AdminFormFields";

const EMPTY_FORM = {
  name: "",
  email: "",
  phone: "",
  role: "staff",
  password: "",
  isActive: true,
};

export default function UserFormDrawer({
  open,
  onClose,
  user,
  detailLoading = false,
  detailError = null,
}) {
  const dispatch = useDispatch();
  const mutationStatus = useSelector((state) => state.adminUsers.mutationStatus);
  const mutationError = useSelector((state) => state.adminUsers.mutationError);
  const isEditing = Boolean(user);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (!open) return;
    dispatch(clearAdminUserErrors());
    if (detailLoading) return;
    if (user) {
      setForm({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        role: user.role || "staff",
        password: "",
        isActive: user.isActive ?? true,
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [open, user, detailLoading, dispatch]);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || undefined,
      role: form.role,
      isActive: form.isActive,
    };
    if (form.password.trim()) {
      payload.password = form.password.trim();
    }

    const action = isEditing
      ? await dispatch(editAdminUser({ id: user.id, payload }))
      : await dispatch(addAdminUser({ ...payload, password: form.password.trim() }));

    if (action.meta.requestStatus === "fulfilled") {
      onClose();
    }
  };

  const saving = mutationStatus === "loading";

  return (
    <AdminDrawer
      open={open}
      onClose={onClose}
      title={isEditing ? "Edit User" : "Add User"}
      headerActions={
        <button
          type="submit"
          form="user-form"
          disabled={
            saving ||
            !form.name.trim() ||
            !form.email.trim() ||
            (!isEditing && !form.password.trim())
          }
          className="btn btn-primary px-4 py-2 text-[0.68rem]"
        >
          {saving ? "Saving..." : isEditing ? "Save" : "Add User"}
        </button>
      }
    >
      <form id="user-form" onSubmit={handleSubmit} className="space-y-5">
        {detailLoading && (
          <p className="text-body-sm text-brown-500">Loading user details...</p>
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
        <AdminField label="Name" required>
          <AdminInput
            value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
            required
          />
        </AdminField>
        <AdminField label="Email" required>
          <AdminInput
            type="email"
            value={form.email}
            onChange={(e) => updateField("email", e.target.value)}
            required
          />
        </AdminField>
        <AdminField label="Phone">
          <AdminInput
            value={form.phone}
            onChange={(e) => updateField("phone", e.target.value)}
          />
        </AdminField>
        <AdminField label="Role">
          <AdminSelect
            value={form.role}
            onChange={(e) => updateField("role", e.target.value)}
          >
            <option value="admin">Admin</option>
            <option value="staff">Staff</option>
            <option value="viewer">Viewer</option>
          </AdminSelect>
        </AdminField>
        <AdminField
          label={isEditing ? "Password (leave blank to keep)" : "Password"}
          required={!isEditing}
        >
          <AdminInput
            type="password"
            value={form.password}
            onChange={(e) => updateField("password", e.target.value)}
            required={!isEditing}
            autoComplete="new-password"
          />
        </AdminField>
        <AdminToggle
          checked={form.isActive}
          onChange={(value) => updateField("isActive", value)}
          label="Active"
        />
        </fieldset>
      </form>
    </AdminDrawer>
  );
}
