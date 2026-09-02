import { apiRequest } from "./client";

export function fetchInvoiceSettings(token) {
  return apiRequest("/admin/invoice-settings", { token });
}

export function updateInvoiceSettings(payload, token) {
  return apiRequest("/admin/invoice-settings", {
    method: "PUT",
    body: payload,
    token,
  });
}
