import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Plus } from "lucide-react";
import {
  clearAdminUserCurrent,
  clearAdminUserErrors,
  loadAdminUserById,
  loadAdminUsers,
  removeAdminUser,
} from "../../store/slices/adminUsersSlice";
import { iconProps } from "../../lib/icons";
import { getRowId } from "../lib/entityId";
import { useAdminEditById } from "../lib/useAdminEditById";
import AdminDataTable, { StatusPill } from "../components/AdminDataTable";
import ConfirmDialog from "../components/ConfirmDialog";
import UserFormDrawer from "../components/UserFormDrawer";

export default function UsersPage() {
  const dispatch = useDispatch();
  const {
    items,
    current,
    status,
    error,
    detailStatus,
    detailError,
    mutationStatus,
  } = useSelector((state) => state.adminUsers);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const {
    drawerOpen,
    isEditing,
    localDetailError,
    openCreate,
    openEdit,
    closeDrawer,
  } = useAdminEditById({
    loadById: loadAdminUserById,
    clearErrors: clearAdminUserErrors,
    clearCurrent: clearAdminUserCurrent,
  });

  useEffect(() => {
    dispatch(loadAdminUsers());
  }, [dispatch]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const result = await dispatch(removeAdminUser(getRowId(deleteTarget)));
    if (result.meta.requestStatus === "fulfilled") {
      setDeleteTarget(null);
    }
  };

  const columns = [
    { key: "name", label: "Name", render: (row) => row.name || "—" },
    { key: "email", label: "Email", render: (row) => row.email || "—" },
    { key: "phone", label: "Phone", render: (row) => row.phone || "—" },
    {
      key: "role",
      label: "Role",
      render: (row) => (
        <span className="capitalize">{row.role || "—"}</span>
      ),
    },
    {
      key: "isActive",
      label: "Status",
      render: (row) => (
        <StatusPill status={row.isActive === false ? "inactive" : "active"} />
      ),
    },
    {
      key: "actions",
      label: "Actions",
      align: "right",
      render: (row) => (
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              openEdit(row);
            }}
            className="focus-ring rounded-sm px-3 py-1.5 text-[0.65rem] font-semibold tracking-wider text-olive-800 uppercase hover:bg-olive-100"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setDeleteTarget(row);
            }}
            className="focus-ring rounded-sm px-3 py-1.5 text-[0.65rem] font-semibold tracking-wider text-terracotta-600 uppercase hover:bg-terracotta-500/10"
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="section-label mb-2">Master Data</p>
          <h1 className="font-display text-display-sm text-brown-900">Users</h1>
          <p className="mt-1 text-body-sm text-brown-500">
            Manage admin panel users and roles
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="btn btn-primary shrink-0 px-4 py-2.5 text-[0.68rem]"
        >
          <Plus {...iconProps(16)} />
          Add
        </button>
      </div>

      {status === "loading" && (
        <div className="card flex items-center justify-center py-16">
          <p className="text-body-sm text-brown-500">Loading users...</p>
        </div>
      )}

      {status === "failed" && (
        <div className="rounded-lg border border-terracotta-400/40 bg-terracotta-500/10 px-4 py-3 text-body-sm text-terracotta-600">
          {error}
        </div>
      )}

      {status === "succeeded" && (
        <AdminDataTable
          columns={columns}
          rows={items}
          emptyMessage="No users yet. Click Add to create one."
        />
      )}

      <UserFormDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        user={isEditing ? current : null}
        detailLoading={isEditing && detailStatus === "loading"}
        detailError={isEditing ? localDetailError || detailError : null}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete user?"
        message={`"${deleteTarget?.name || deleteTarget?.email}" will be permanently removed.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={mutationStatus === "loading"}
      />
    </>
  );
}
