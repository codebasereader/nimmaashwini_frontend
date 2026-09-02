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

/** Master inventory products (pricing, stock, HSN). */
export function fetchMasterProducts(params = {}, token) {
  return apiRequest(`/admin/master-products${buildQuery(params)}`, { token });
}

export function searchMasterProducts(query, token) {
  return fetchMasterProducts({ search: query, limit: 20 }, token);
}

export function fetchMasterProductById(id, token) {
  return apiRequest(`/admin/master-products/${id}`, { token });
}

export function createMasterProduct(payload, token) {
  return apiRequest("/admin/master-products", {
    method: "POST",
    body: payload,
    token,
  });
}

export function updateMasterProduct(id, payload, token) {
  return apiRequest(`/admin/master-products/${id}`, {
    method: "PUT",
    body: payload,
    token,
  });
}

export function deleteMasterProduct(id, token) {
  return apiRequest(`/admin/master-products/${id}`, {
    method: "DELETE",
    token,
  });
}
