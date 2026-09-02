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

export function fetchExpenseCategories(params = {}, token) {
  return apiRequest(`/admin/expense-categories${buildQuery(params)}`, { token });
}

export function fetchExpenseCategoryById(id, token) {
  return apiRequest(`/admin/expense-categories/${id}`, { token });
}

export function createExpenseCategory(payload, token) {
  return apiRequest("/admin/expense-categories", {
    method: "POST",
    body: payload,
    token,
  });
}

export function updateExpenseCategory(id, payload, token) {
  return apiRequest(`/admin/expense-categories/${id}`, {
    method: "PUT",
    body: payload,
    token,
  });
}

export function deleteExpenseCategory(id, token) {
  return apiRequest(`/admin/expense-categories/${id}`, {
    method: "DELETE",
    token,
  });
}
