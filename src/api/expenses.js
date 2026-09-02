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

export function fetchExpenses(params = {}, token) {
  return apiRequest(`/admin/expenses${buildQuery(params)}`, { token });
}

/**
 * Server export — same filters as list. format: "xlsx" | "pdf"
 * @see docs/EXPENSE_FILTERS_EXPORT_SCHEMA.md
 */
export function downloadExpensesExport(params = {}, token) {
  const { format = "xlsx", ...filters } = params;
  const fallbackFilename = `expenses_export.${format === "pdf" ? "pdf" : "xlsx"}`;
  return apiDownload(`/admin/expenses/export${buildQuery({ format, ...filters })}`, {
    token,
    fallbackFilename,
  });
}

export function fetchExpenseById(id, token) {
  return apiRequest(`/admin/expenses/${id}`, { token });
}

export function createExpense(payload, token) {
  return apiRequest("/admin/expenses", {
    method: "POST",
    body: payload,
    token,
  });
}

export function updateExpense(id, payload, token) {
  return apiRequest(`/admin/expenses/${id}`, {
    method: "PUT",
    body: payload,
    token,
  });
}

export function deleteExpense(id, token) {
  return apiRequest(`/admin/expenses/${id}`, {
    method: "DELETE",
    token,
  });
}
