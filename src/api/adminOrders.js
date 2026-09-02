import { apiDownload, apiRequest } from "./client";

function buildQuery(params = {}) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, String(value));
    }
  });
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export function fetchAdminOrders(params = {}, token) {
  return apiRequest(`/admin/orders${buildQuery(params)}`, { token });
}

/**
 * Server export — same filters as list. format: "xlsx".
 * @see docs/ADMIN_ORDERS_EXPORT_SCHEMA.md
 */
export function downloadAdminOrdersExport(params = {}, token) {
  const { format = "xlsx", ...filters } = params;
  return apiDownload(`/admin/orders/export${buildQuery({ format, ...filters })}`, {
    token,
    fallbackFilename: `orders_export.${format}`,
  });
}

export function fetchAdminOrderById(id, token) {
  return apiRequest(`/admin/orders/${id}`, { token });
}

export function updateAdminOrderStatus(id, payload, token) {
  return apiRequest(`/admin/orders/${id}/status`, {
    method: "PUT",
    body: payload,
    token,
  });
}

/** Create a manual / offline order from the admin panel. */
export function createAdminOrder(payload, token) {
  return apiRequest("/admin/orders", {
    method: "POST",
    body: payload,
    token,
  });
}
