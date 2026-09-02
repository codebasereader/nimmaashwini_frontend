import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { getProductPath } from "../lib/product";
import {
  defaultTransition,
  fadeUp,
  staggerContainer,
} from "../lib/motion";

function formatLineTotal(price, quantity) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(price * quantity);
}

function CartLineItem({ item, onUpdateQuantity, onRemove }) {
  return (
    <article className="product-info-panel flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:gap-5 sm:p-5">
      <Link
        to={getProductPath(item.slug)}
        className="focus-ring shrink-0 self-center overflow-hidden rounded-xl border border-cream-300 bg-cream-50 sm:self-start"
      >
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            className="h-24 w-24 object-contain p-2 sm:h-28 sm:w-28"
          />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center text-body-sm text-brown-400 sm:h-28 sm:w-28">
            No image
          </div>
        )}
      </Link>

      <div className="min-w-0 flex-1">
        <Link
          to={getProductPath(item.slug)}
          className="focus-ring font-display text-lg font-semibold text-brown-900 hover:text-olive-800"
        >
          {item.name}
        </Link>
        {item.variantLabel ? (
          <p className="mt-1 text-body-sm text-brown-500">{item.variantLabel}</p>
        ) : null}
        <p className="mt-2 font-display text-base font-semibold text-olive-800">
          {item.priceDisplay}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 sm:flex-col sm:items-end sm:justify-center">
        <div className="inline-flex items-center rounded-full border border-cream-300 bg-white">
          <button
            type="button"
            aria-label="Decrease quantity"
            onClick={() => onUpdateQuantity(item.lineId, item.quantity - 1)}
            disabled={item.quantity <= 1}
            className="focus-ring flex h-9 w-9 items-center justify-center text-lg text-brown-700 hover:text-olive-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            −
          </button>
          <span className="min-w-9 text-center text-body-sm font-semibold text-brown-900">
            {item.quantity}
          </span>
          <button
            type="button"
            aria-label="Increase quantity"
            onClick={() => onUpdateQuantity(item.lineId, item.quantity + 1)}
            disabled={item.quantity >= item.maxQuantity}
            className="focus-ring flex h-9 w-9 items-center justify-center text-lg text-brown-700 hover:text-olive-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            +
          </button>
        </div>

        <p className="font-display text-base font-semibold text-brown-900">
          {formatLineTotal(item.price, item.quantity)}
        </p>

        <button
          type="button"
          onClick={() => onRemove(item.lineId)}
          className="focus-ring text-body-sm font-medium text-terracotta-600 hover:text-terracotta-700"
        >
          Remove
        </button>
      </div>
    </article>
  );
}

function EmptyCart() {
  return (
    <div className="product-info-panel mx-auto max-w-lg p-8 text-center sm:p-10">
      <h2 className="font-display text-2xl text-brown-900">Your cart is empty</h2>
      <p className="mt-3 text-body-sm text-brown-600">
        Browse our natural products and add your favourites to the cart.
      </p>
      <Link
        to="/#products"
        className="btn btn-primary focus-ring mt-8 inline-flex px-8 py-3.5"
      >
        Shop Products
      </Link>
    </div>
  );
}

export default function CartPage() {
  const { items, itemCount, subtotalDisplay, updateQuantity, removeItem, clearCart } =
    useCart();

  return (
    <div className="pb-16 sm:pb-20">
      <div className="border-b border-cream-300/80 bg-cream-100/90 backdrop-blur-sm">
        <div className="container-ashwini py-4">
          <nav aria-label="Breadcrumb" className="text-body-sm text-brown-500">
            <ol className="flex flex-wrap items-center gap-2">
              <li>
                <Link to="/" className="hover:text-olive-800">
                  Home
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="font-medium text-brown-800">Cart</li>
            </ol>
          </nav>
        </div>
      </div>

      <section className="product-hero-bg relative overflow-hidden section-padding">
        <motion.div
          className="container-ashwini relative z-10"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.div variants={fadeUp} transition={defaultTransition}>
            <p className="section-label mb-3 text-olive-700">Your Bag</p>
            <h1 className="font-display text-display-sm sm:text-display-md text-brown-900">
              Shopping Cart
            </h1>
            <p className="mt-2 text-body-sm text-brown-600">
              {itemCount > 0
                ? `${itemCount} item${itemCount !== 1 ? "s" : ""} in your cart`
                : "No items yet"}
            </p>
          </motion.div>

          {items.length === 0 ? (
            <motion.div className="mt-10" variants={fadeUp} transition={defaultTransition}>
              <EmptyCart />
            </motion.div>
          ) : (
            <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_minmax(0,20rem)] lg:items-start lg:gap-10">
              <motion.div
                className="space-y-4"
                variants={fadeUp}
                transition={defaultTransition}
              >
                {items.map((item) => (
                  <CartLineItem
                    key={item.lineId}
                    item={item}
                    onUpdateQuantity={updateQuantity}
                    onRemove={removeItem}
                  />
                ))}
              </motion.div>

              <motion.aside
                className="product-info-panel sticky top-24 p-6 sm:p-7"
                variants={fadeUp}
                transition={{ ...defaultTransition, delay: 0.06 }}
              >
                <h2 className="font-display text-xl font-semibold text-brown-900">
                  Order Summary
                </h2>

                <dl className="mt-5 space-y-3 text-body-sm">
                  <div className="flex items-center justify-between text-brown-600">
                    <dt>Items ({itemCount})</dt>
                    <dd className="font-medium text-brown-800">{subtotalDisplay}</dd>
                  </div>
                  <div className="flex items-center justify-between border-t border-cream-300 pt-3">
                    <dt className="font-display text-base font-semibold text-brown-900">
                      Subtotal
                    </dt>
                    <dd className="font-display text-xl font-semibold text-olive-800">
                      {subtotalDisplay}
                    </dd>
                  </div>
                </dl>

                <p className="mt-4 text-body-sm text-brown-500">
                  Have a coupon? Apply it at checkout.
                </p>

                <div className="mt-4 flex flex-col gap-3">
                  <Link
                    to="/checkout"
                    className="btn btn-primary focus-ring w-full px-4 py-3.5 text-center tracking-widest sm:px-6"
                  >
                    Proceed to Checkout
                  </Link>

                  <Link
                    to="/#products"
                    className="btn focus-ring w-full border border-cream-300 bg-white px-4 py-3.5 text-center tracking-widest text-brown-800 hover:border-olive-500 hover:text-olive-800 sm:px-6"
                  >
                    Continue Shopping
                  </Link>
                </div>

                <button
                  type="button"
                  onClick={clearCart}
                  className="focus-ring mt-4 w-full text-center text-body-sm font-medium text-terracotta-600 hover:text-terracotta-700"
                >
                  Clear cart
                </button>
              </motion.aside>
            </div>
          )}
        </motion.div>
      </section>
    </div>
  );
}
