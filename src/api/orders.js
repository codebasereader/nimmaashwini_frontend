import { apiRequest } from "./client";

export function createOrder(payload) {
  return apiRequest("/orders", {
    method: "POST",
    body: payload,
  });
}

/**
 * Public order confirmation after PhonePe redirect.
 * GET /api/orders/confirmation?merchantOrderId=...
 */
export function fetchOrderConfirmation(merchantOrderId) {
  const id = encodeURIComponent(String(merchantOrderId || "").trim());
  return apiRequest(`/orders/confirmation?merchantOrderId=${id}`);
}

/**
 * Restart PhonePe payment for an existing unpaid order.
 * POST /api/orders/retry-payment
 * @param {{ merchantOrderId: string }} payload
 */
export function retryOrderPayment(payload) {
  return apiRequest("/orders/retry-payment", {
    method: "POST",
    body: payload,
  });
}
