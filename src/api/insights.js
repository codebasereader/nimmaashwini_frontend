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

/**
 * Overview dashboard for Insights.
 * Query: fromDate, toDate (YYYY-MM-DD)
 */
export function fetchInsightsOverview(params = {}, token) {
  return apiRequest(`/admin/insights${buildQuery(params)}`, { token });
}

/**
 * Product analysis section (separate date range).
 * Query: fromDate, toDate (YYYY-MM-DD)
 */
export function fetchProductAnalysis(params = {}, token) {
  return apiRequest(
    `/admin/insights/product-analysis${buildQuery(params)}`,
    { token },
  );
}
