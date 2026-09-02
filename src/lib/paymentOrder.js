/**
 * PhonePe / backend may send the order id under different query names.
 * Prefer merchantOrderId (PhonePe merchant order id = our order id).
 */
export function getMerchantOrderIdFromSearchParams(params) {
  if (!params) return "";

  const candidates = [
    params.get("merchantOrderId"),
    params.get("merchant_order_id"),
    params.get("orderId"),
    params.get("order_id"),
    params.get("id"),
  ];

  for (const value of candidates) {
    const trimmed = String(value || "").trim();
    if (trimmed) return trimmed;
  }

  return "";
}

export function formatOrderMoney(amount, currency = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);
}

export function formatOrderDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function formatCustomerAddress(customer = {}) {
  return [
    customer.address,
    customer.landmark,
    [customer.city, customer.district, customer.state]
      .filter(Boolean)
      .join(", "),
    customer.pincode,
    customer.country,
  ]
    .filter(Boolean)
    .join("\n");
}
