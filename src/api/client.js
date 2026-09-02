import { API_URL } from "../../config.js";

function buildApiUrl(path) {
  const base = API_URL.replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}

export class ApiError extends Error {
  constructor(message, status, errors) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }
}

export function getApiBaseUrl() {
  return API_URL.replace(/\/$/, "");
}

let onUnauthorized = null;

export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

export async function apiRequest(path, options = {}) {
  const { token, body, headers: customHeaders, ...fetchOptions } = options;

  const headers = {
    ...customHeaders,
  };

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(buildApiUrl(path), {
    ...fetchOptions,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = { success: false, message: "Invalid server response" };
  }

  if (!response.ok || payload.success === false) {
    if (response.status === 401 && onUnauthorized) {
      onUnauthorized();
    }

    throw new ApiError(
      payload.message || "Request failed",
      response.status,
      payload.errors,
    );
  }

  return payload.data;
}

/**
 * Download a binary file (Excel / PDF) from an admin endpoint.
 * Returns { blob, filename }. Caller should save the blob (e.g. file-saver).
 */
export async function apiDownload(path, options = {}) {
  const { token, headers: customHeaders, fallbackFilename = "download", ...fetchOptions } =
    options;

  const headers = {
    ...customHeaders,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(buildApiUrl(path), {
    ...fetchOptions,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401 && onUnauthorized) {
      onUnauthorized();
    }

    let message = "Download failed";
    let errors;
    try {
      const payload = await response.json();
      message = payload.message || message;
      errors = payload.errors;
    } catch {
      // non-JSON error body
    }
    throw new ApiError(message, response.status, errors);
  }

  const blob = await response.blob();
  const disposition = response.headers.get("Content-Disposition") || "";
  const match = disposition.match(/filename\*?=(?:UTF-8''|")?([^\";]+)/i);
  const filename = match
    ? decodeURIComponent(match[1].replace(/"/g, "").trim())
    : fallbackFilename;

  return { blob, filename };
}
