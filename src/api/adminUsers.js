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

export function fetchAdminUsers(params = {}, token) {
  return apiRequest(`/admin/users${buildQuery(params)}`, { token });
}

export function fetchAdminUserById(id, token) {
  return apiRequest(`/admin/users/${id}`, { token });
}

export function createAdminUser(payload, token) {
  return apiRequest("/admin/users", {
    method: "POST",
    body: payload,
    token,
  });
}

export function updateAdminUser(id, payload, token) {
  return apiRequest(`/admin/users/${id}`, {
    method: "PUT",
    body: payload,
    token,
  });
}

export function deleteAdminUser(id, token) {
  return apiRequest(`/admin/users/${id}`, {
    method: "DELETE",
    token,
  });
}
