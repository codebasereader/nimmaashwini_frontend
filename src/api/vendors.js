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

export function fetchVendors(params = {}, token) {
  return apiRequest(`/admin/vendors${buildQuery(params)}`, { token });
}

export function searchVendors(query, token) {
  return fetchVendors({ search: query, limit: 20 }, token);
}

export function fetchVendorById(id, token) {
  return apiRequest(`/admin/vendors/${id}`, { token });
}

export function createVendor(payload, token) {
  return apiRequest("/admin/vendors", {
    method: "POST",
    body: payload,
    token,
  });
}

export function updateVendor(id, payload, token) {
  return apiRequest(`/admin/vendors/${id}`, {
    method: "PUT",
    body: payload,
    token,
  });
}

export function deleteVendor(id, token) {
  return apiRequest(`/admin/vendors/${id}`, {
    method: "DELETE",
    token,
  });
}
