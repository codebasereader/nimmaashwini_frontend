export const WHATSAPP_NUMBER = "916363250586";
export const WHATSAPP_DISPLAY = "+91 63632 50586";
export const DOMESTIC_COUNTRY = "India";

export const COUNTRY_OPTIONS = [
  "India",
  "United States",
  "United Kingdom",
  "United Arab Emirates",
  "Singapore",
  "Canada",
  "Australia",
  "Other",
];

export function buildWhatsAppUrl(message) {
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`;
}

export function buildInternationalOrderMessage(items) {
  const lines = items.map(
    (item) =>
      `• ${item.name}${item.variantLabel ? ` (${item.variantLabel})` : ""} × ${item.quantity}`,
  );

  return [
    "Hello Nimma Ashwini, I would like to place an international order:",
    "",
    ...lines,
    "",
    "Please share shipping and payment details.",
  ].join("\n");
}
