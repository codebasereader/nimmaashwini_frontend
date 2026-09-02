import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { formatPrice } from "../lib/product";
import {
  createCartLineId,
  loadCartItems,
  saveCartItems,
} from "../lib/cartStorage";

const CartContext = createContext(null);

function getProductImage(product) {
  const first = product.images?.[0];
  if (!first) return null;
  return typeof first === "string" ? first : first.url;
}

function clampQuantity(quantity, maxQuantity) {
  return Math.max(1, Math.min(quantity, maxQuantity));
}

function mergeCartItem(prev, product, options = {}) {
  const { quantity = 1, variant } = options;
  const variantId = variant?.id ?? "default";
  const maxQuantity =
    variant?.maxQuantityPerOrder ?? product.maxQuantityPerOrder ?? 99;
  const lineId = createCartLineId(product.id, variantId);
  const unitPrice = variant?.price ?? product.price ?? 0;

  const existing = prev.find((item) => item.lineId === lineId);

  if (existing) {
    return prev.map((item) =>
      item.lineId === lineId
        ? {
            ...item,
            quantity: clampQuantity(
              item.quantity + quantity,
              item.maxQuantity,
            ),
          }
        : item,
    );
  }

  return [
    ...prev,
    {
      lineId,
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image: getProductImage(product),
      variantId,
      variantLabel: variant?.label ?? null,
      price: unitPrice,
      priceDisplay: variant?.priceDisplay ?? formatPrice(unitPrice),
      quantity: clampQuantity(quantity, maxQuantity),
      maxQuantity,
    },
  ];
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => loadCartItems());

  useEffect(() => {
    saveCartItems(items);
  }, [items]);

  const addItem = useCallback((product, options = {}) => {
    let nextItems = [];
    setItems((prev) => {
      nextItems = mergeCartItem(prev, product, options);
      return nextItems;
    });
    return nextItems;
  }, []);

  const updateQuantity = useCallback((lineId, nextQuantity) => {
    setItems((prev) =>
      prev.map((item) =>
        item.lineId === lineId
          ? {
              ...item,
              quantity: clampQuantity(nextQuantity, item.maxQuantity),
            }
          : item,
      ),
    );
  }, []);

  const removeItem = useCallback((lineId) => {
    setItems((prev) => prev.filter((item) => item.lineId !== lineId));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const itemCount = useMemo(
    () => items.reduce((total, item) => total + item.quantity, 0),
    [items],
  );

  const subtotal = useMemo(
    () => items.reduce((total, item) => total + item.price * item.quantity, 0),
    [items],
  );

  const value = useMemo(
    () => ({
      items,
      itemCount,
      subtotal,
      subtotalDisplay: formatPrice(subtotal),
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
    }),
    [
      items,
      itemCount,
      subtotal,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }

  return context;
}
