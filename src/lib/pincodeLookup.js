const PINCODE_RE = /^[1-9][0-9]{5}$/;
const LOOKUP_URL = "https://api.postalpincode.in/pincode";

const cache = new Map();

export function isValidIndianPincode(value) {
  return PINCODE_RE.test(String(value || "").trim());
}

function cleanField(value) {
  const text = String(value || "").trim();
  if (!text || text.toUpperCase() === "NA") return "";
  return text;
}

/**
 * Prefer Block as city/town when present; otherwise post-office Name;
 * fall back to District so autofill never leaves city empty.
 */
function pickCity(office) {
  return (
    cleanField(office.Block) ||
    cleanField(office.Name) ||
    cleanField(office.District)
  );
}

/**
 * Look up city, district, and state for an Indian pincode via India Post API.
 * Results are cached in-memory for the session.
 *
 * @param {string} pincode
 * @returns {Promise<{ city: string, district: string, state: string, offices: object[] }>}
 */
export async function lookupPincode(pincode) {
  const pin = String(pincode || "").trim();
  if (!isValidIndianPincode(pin)) {
    throw new Error("Enter a valid 6-digit Indian pincode");
  }

  if (cache.has(pin)) {
    return cache.get(pin);
  }

  const response = await fetch(`${LOOKUP_URL}/${pin}`);
  if (!response.ok) {
    throw new Error("Could not look up pincode. Try again.");
  }

  const payload = await response.json();
  const entry = Array.isArray(payload) ? payload[0] : payload;

  if (!entry || entry.Status !== "Success" || !Array.isArray(entry.PostOffice)) {
    throw new Error("Pincode not found");
  }

  const office =
    entry.PostOffice.find((item) => item?.District && item?.State) ||
    entry.PostOffice[0];

  const city = pickCity(office);
  const district = cleanField(office?.District);
  const state = cleanField(office?.State);

  if (!city || !district || !state) {
    throw new Error("Pincode not found");
  }

  const result = {
    city,
    district,
    state,
    offices: entry.PostOffice,
  };

  cache.set(pin, result);
  return result;
}
