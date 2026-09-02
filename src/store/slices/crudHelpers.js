function normalizeListResponse(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.docs)) return data.docs;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

/**
 * Normalize backend id shapes so Edit always can call GET /:id.
 */
export function getEntityId(item) {
  if (item == null) return null;
  if (typeof item === "string" || typeof item === "number") {
    const asString = String(item).trim();
    return asString && asString !== "[object Object]" ? asString : null;
  }

  const candidates = [
    item.id,
    item._id,
    item.uuid,
    item.Id,
    item.ID,
  ];

  for (const candidate of candidates) {
    const normalized = normalizeIdValue(candidate);
    if (normalized) return normalized;
  }

  return null;
}

function normalizeIdValue(value) {
  if (value == null || value === "") return null;

  if (typeof value === "string" || typeof value === "number") {
    const asString = String(value).trim();
    if (!asString || asString === "[object Object]") return null;
    return asString;
  }

  if (typeof value === "object") {
    if (value.$oid) return normalizeIdValue(value.$oid);
    if (value.oid) return normalizeIdValue(value.oid);
    if (typeof value.toHexString === "function") {
      return normalizeIdValue(value.toHexString());
    }
    if (typeof value.toString === "function") {
      const asString = value.toString();
      if (asString && asString !== "[object Object]") return asString;
    }
  }

  return null;
}

export function createCrudSliceHandlers({
  load,
  add,
  edit,
  remove,
  loadOne,
  getId = getEntityId,
}) {
  return (builder) => {
    builder
      .addCase(load.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(load.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(load.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(add.pending, (state) => {
        state.mutationStatus = "loading";
        state.mutationError = null;
      })
      .addCase(add.fulfilled, (state, action) => {
        state.mutationStatus = "succeeded";
        state.items = [action.payload, ...state.items];
      })
      .addCase(add.rejected, (state, action) => {
        state.mutationStatus = "failed";
        state.mutationError = action.payload;
      })
      .addCase(edit.pending, (state) => {
        state.mutationStatus = "loading";
        state.mutationError = null;
      })
      .addCase(edit.fulfilled, (state, action) => {
        state.mutationStatus = "succeeded";
        const id = getId(action.payload);
        state.items = state.items.map((item) =>
          getId(item) === id ? action.payload : item,
        );
        if (getId(state.current) === id) {
          state.current = action.payload;
        }
      })
      .addCase(edit.rejected, (state, action) => {
        state.mutationStatus = "failed";
        state.mutationError = action.payload;
      })
      .addCase(remove.pending, (state) => {
        state.mutationStatus = "loading";
        state.mutationError = null;
      })
      .addCase(remove.fulfilled, (state, action) => {
        state.mutationStatus = "succeeded";
        state.items = state.items.filter(
          (item) => getId(item) !== action.payload,
        );
        if (getId(state.current) === action.payload) {
          state.current = null;
        }
      })
      .addCase(remove.rejected, (state, action) => {
        state.mutationStatus = "failed";
        state.mutationError = action.payload;
      });

    if (loadOne) {
      builder
        .addCase(loadOne.pending, (state) => {
          state.detailStatus = "loading";
          state.detailError = null;
          state.current = null;
        })
        .addCase(loadOne.fulfilled, (state, action) => {
          state.detailStatus = "succeeded";
          state.current = action.payload;
          const id = getId(action.payload);
          const index = state.items.findIndex((item) => getId(item) === id);
          if (index >= 0) {
            state.items[index] = action.payload;
          }
        })
        .addCase(loadOne.rejected, (state, action) => {
          state.detailStatus = "failed";
          state.detailError = action.payload;
          state.current = null;
        });
    }
  };
}

export { normalizeListResponse };

export const crudInitialState = {
  items: [],
  current: null,
  status: "idle",
  detailStatus: "idle",
  mutationStatus: "idle",
  error: null,
  detailError: null,
  mutationError: null,
};
