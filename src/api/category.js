import { apiRequest } from "./client";

export function fetchCategories(params = {}, token) {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.isActive !== undefined) {
    searchParams.set("isActive", String(params.isActive));
  }

  const query = searchParams.toString();
  return apiRequest(`/categories${query ? `?${query}` : ""}`, { token });
}

export function fetchCategoryById(id, token) {
  return apiRequest(`/categories/${id}`, { token });
}

export function createCategory(payload, token) {
  return apiRequest("/admin/categories", {
    method: "POST",
    body: payload,
    token,
  });
}

export function updateCategory(id, payload, token) {
  return apiRequest(`/admin/categories/${id}`, {
    method: "PUT",
    body: payload,
    token,
  });
}

export function deleteCategory(id, token) {
  return apiRequest(`/admin/categories/${id}`, {
    method: "DELETE",
    token,
  });
}
