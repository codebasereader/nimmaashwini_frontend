import { motion } from "motion/react";
import LeafMark from "../icons/LeafMark";
import TraditionalSectionDecor from "./TraditionalSectionDecor";
import {
  defaultTransition,
  fadeUp,
  staggerContainer,
  viewportOnce,
} from "../../lib/motion";

export const INSTAGRAM_REVIEWS_URL =
  "https://www.instagram.com/ashwininaturalproducts?igsh=MTNueTExMGQ2OGNlag==";

function InstagramIcon({ className = "h-5 w-5" }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );
}

/**
 * Shared Customer Reviews CTA — Instagram — used on all product detail pages.
 */
export default function ProductCustomerReviews({ productName }) {
  return (
    <section className="relative overflow-hidden border-t border-cream-300/80 bg-cream-50 section-padding">
      <TraditionalSectionDecor motif="paisley" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 right-0 h-40 w-40 rounded-full bg-gold-200/25 blur-3xl"
      />
      <motion.div
        className="container-ashwini relative"
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        variants={staggerContainer}
      >
        <motion.div variants={fadeUp} transition={defaultTransition}>
          <p className="section-label mb-3 flex items-center gap-2">
            <LeafMark size={14} className="h-3.5 w-3.5 text-olive-600" />
            <span>Testimonials</span>
          </p>
          <h2 className="font-display text-display-sm text-brown-900 sm:text-display-md">
            Customer Reviews
          </h2>
          <p className="mt-3 max-w-2xl text-body-sm text-brown-600 sm:text-body">
            For customer reviews &amp; feedback
            {productName ? ` on ${productName}` : ""}, please follow our official
            Instagram account.
          </p>
        </motion.div>

        <motion.div
          className="mt-8"
          variants={fadeUp}
          transition={{ ...defaultTransition, delay: 0.06 }}
        >
          <a
            href={INSTAGRAM_REVIEWS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group focus-ring inline-flex max-w-full flex-col gap-4 rounded-2xl border border-cream-300 bg-white p-5 shadow-soft transition-colors hover:border-olive-500 sm:flex-row sm:items-center sm:gap-6 sm:p-6"
          >
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-olive-800 text-cream-100 transition-colors group-hover:bg-olive-700">
              <InstagramIcon className="h-6 w-6" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-display text-lg font-semibold text-brown-900 sm:text-xl">
                @ashwininaturalproducts
              </span>
              <span className="mt-1 block text-body-sm leading-relaxed text-brown-600">
                For Customer Reviews &amp; Feedback Please Follow our Official
                Instagram Account
              </span>
            </span>
            <span className="btn btn-primary shrink-0 self-start px-5 py-2.5 text-[0.68rem] sm:self-center">
              View on Instagram
            </span>
          </a>
        </motion.div>
      </motion.div>
    </section>
  );
}
