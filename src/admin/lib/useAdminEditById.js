import { useState } from "react";
import { useDispatch } from "react-redux";
import { getRowId } from "./entityId";

/**
 * Shared create/edit drawer flow: Edit always calls GET /:id with the row id.
 */
export function useAdminEditById({
  loadById,
  clearErrors,
  clearCurrent,
}) {
  const dispatch = useDispatch();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [localDetailError, setLocalDetailError] = useState(null);

  const openCreate = () => {
    dispatch(clearErrors());
    dispatch(clearCurrent());
    setLocalDetailError(null);
    setIsEditing(false);
    setDrawerOpen(true);
  };

  const openEdit = async (row) => {
    const id = getRowId(row);

    dispatch(clearErrors());
    dispatch(clearCurrent());
    setLocalDetailError(null);
    setIsEditing(true);
    setDrawerOpen(true);

    if (!id) {
      const message =
        "Cannot load details: this row has no id/_id. List API must return id (or _id) on every item.";
      setLocalDetailError(message);
      console.error("[admin edit] missing id on list row", row);
      return;
    }

    const result = await dispatch(loadById(id));
    if (result.meta.requestStatus === "rejected") {
      console.error("[admin edit] GET by id failed", id, result.payload);
    }
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setIsEditing(false);
    setLocalDetailError(null);
    dispatch(clearCurrent());
  };

  return {
    drawerOpen,
    isEditing,
    localDetailError,
    openCreate,
    openEdit,
    closeDrawer,
    setLocalDetailError,
  };
}
