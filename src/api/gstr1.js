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

/** One row per dispatched order (Receiver, Invoice #, Place of Supply, CGST/SGST/IGST). */
export function fetchGstr1Consolidated(params = {}, token) {
  return apiRequest(`/admin/gstr1/consolidated${buildQuery(params)}`, { token });
}

/** Grouped by Place of Supply (State) + Tax Rate. */
export function fetchGstr1B2cs(params = {}, token) {
  return apiRequest(`/admin/gstr1/b2cs${buildQuery(params)}`, { token });
}

/** Grouped by Product/Catalogue Name (snapshot at time of sale). */
export function fetchGstr1HsnSummary(params = {}, token) {
  return apiRequest(`/admin/gstr1/hsn-summary${buildQuery(params)}`, { token });
}
