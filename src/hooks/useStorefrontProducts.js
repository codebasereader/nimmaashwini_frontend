import { useEffect, useState } from "react";
import { fetchProducts } from "../api/products";

let cachedItems = null;
let inflight = null;

async function loadStorefrontProducts() {
  if (cachedItems) return cachedItems;

  if (!inflight) {
    inflight = fetchProducts({ limit: 100 })
      .then((data) => {
        cachedItems = (data.items || []).filter(
          (item) => item.isActive !== false,
        );
        return cachedItems;
      })
      .finally(() => {
        inflight = null;
      });
  }

  return inflight;
}

export function useStorefrontProducts() {
  const [items, setItems] = useState(cachedItems || []);
  const [status, setStatus] = useState(cachedItems ? "success" : "loading");
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    loadStorefrontProducts()
      .then((products) => {
        if (cancelled) return;
        setItems(products);
        setStatus("success");
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message || "Failed to load products");
        setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { items, status, error };
}
