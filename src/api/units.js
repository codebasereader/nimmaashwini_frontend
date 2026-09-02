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

export function fetchUnits(params = {}, token) {
  return apiRequest(`/admin/units${buildQuery(params)}`, { token });
}

export function createUnit(payload, token) {
  return apiRequest("/admin/units", {
    method: "POST",
    body: payload,
    token,
  });
}

export function updateUnit(id, payload, token) {
  return apiRequest(`/admin/units/${id}`, {
    method: "PUT",
    body: payload,
    token,
  });
}

export function deleteUnit(id, token) {
  return apiRequest(`/admin/units/${id}`, {
    method: "DELETE",
    token,
  });
}
