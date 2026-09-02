import { apiRequest } from "./client";

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

/** List customers (phone-keyed CRM). */
export function fetchCustomers(params = {}, token) {
  return apiRequest(`/admin/customers${buildQuery(params)}`, { token });
}

/** Full customer profile + orders + product aggregates. */
export function fetchCustomerById(id, token) {
  return apiRequest(`/admin/customers/${id}`, { token });
}

/** Idempotent rebuild of customers from existing orders. */
export function backfillCustomers(token) {
  return apiRequest("/admin/customers/backfill", {
    method: "POST",
    token,
  });
}
