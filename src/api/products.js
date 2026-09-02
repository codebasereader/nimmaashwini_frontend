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

export function fetchProducts(params = {}) {
  return apiRequest(`/products${buildQuery(params)}`);
}

export function fetchProductById(id) {
  return apiRequest(`/products/${id}`);
}

export async function fetchProductBySlug(slug) {
  const data = await fetchProducts({ limit: 100 });
  const product = data.items?.find((item) => item.slug === slug);
  if (!product) {
    throw new Error("Product not found");
  }
  return product;
}

export function fetchAdminProducts(params = {}, token) {
  return apiRequest(`/admin/products${buildQuery(params)}`, { token });
}

export function fetchAdminProductById(id, token) {
  return apiRequest(`/admin/products/${id}`, { token });
}

export function createProduct(payload, token) {
  return apiRequest("/admin/products", {
    method: "POST",
    body: payload,
    token,
  });
}

export function updateProduct(id, payload, token) {
  return apiRequest(`/admin/products/${id}`, {
    method: "PUT",
    body: payload,
    token,
  });
}

export function deleteProduct(id, token) {
  return apiRequest(`/admin/products/${id}`, {
    method: "DELETE",
    token,
  });
}
