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

export function fetchCoupons(params = {}, token) {
  return apiRequest(`/admin/coupons${buildQuery(params)}`, { token });
}

export function fetchCouponById(id, token) {
  return apiRequest(`/admin/coupons/${id}`, { token });
}

export function createCoupon(payload, token) {
  return apiRequest("/admin/coupons", {
    method: "POST",
    body: payload,
    token,
  });
}

export function updateCoupon(id, payload, token) {
  return apiRequest(`/admin/coupons/${id}`, {
    method: "PUT",
    body: payload,
    token,
  });
}

export function deleteCoupon(id, token) {
  return apiRequest(`/admin/coupons/${id}`, {
    method: "DELETE",
    token,
  });
}

/**
 * Public validate — no auth.
 * @param {{ code: string, items: Array<{ productId: string, quantity: number, unitPrice: number }> }} payload
 */
export function validateCoupon(payload) {
  return apiRequest("/coupons/validate", {
    method: "POST",
    body: payload,
  });
}

/**
 * Public available coupons for the current cart — no auth.
 * @param {{ items: Array<{ productId: string, quantity: number, unitPrice: number }> }} payload
 */
export function fetchAvailableCoupons(payload) {
  return apiRequest("/coupons/available", {
    method: "POST",
    body: payload,
  });
}
