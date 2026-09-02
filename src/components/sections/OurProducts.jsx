import { motion } from "motion/react";
import { Link } from "react-router-dom";
import LeafMark from "../icons/LeafMark";
import { getProductPath } from "../../data/products";
import {
  defaultTransition,
  fadeUp,
  scaleIn,
  springSnappy,
  staggerContainer,
  viewportOnce,
} from "../../lib/motion";

const LANDING_PRODUCTS = [
  {
    slug: "ragi-malt-powder",
    name: "Ragi Malt Powder",
    titleLines: ["Ragi Malt", "Powder"],
    image: "/landingproducts/ragimal_land.png",
    description:
      "A wholesome blend of millets and grains to boost strength and vitality.",
  },
  {
    slug: "herbal-hair-oil",
    name: "Herbal Hair Oil",
    titleLines: ["Herbal Hair", "Oil"],
    image: "/landingproducts/herbaloil_land.png",
    description:
      "A nourishing blend of herbs that strengthens your hair from root to tip.",
  },
  {
    slug: "herbal-shampoo",
    name: "Herbal Hair Shampoo",
    titleLines: ["Herbal Hair", "Shampoo"],
    image: "/landingproducts/herbalshampoo_land.png",
    description:
      "A gentle cleanser enriched with herbs for strong, healthy, and shiny hair.",
  },
];

function ProductsDivider() {
  return (
    <div
      aria-hidden="true"
      className="mx-auto mt-4 flex max-w-xs items-center gap-3 sm:mt-5"
    >
      <span className="h-px flex-1 bg-linear-to-r from-transparent via-gold-400/60 to-gold-400/25" />
      <LeafMark className="h-3.5 w-3.5 text-gold-400" />
      <span className="h-px flex-1 bg-linear-to-l from-transparent via-gold-400/60 to-gold-400/25" />
    </div>
  );
}

function CardDivider() {
  return (
    <div aria-hidden="true" className="flex items-center gap-2">
      <span className="h-px w-7 bg-olive-700/70 sm:w-8" />
      <LeafMark className="h-3 w-3 text-olive-700" />
      <span className="h-px w-7 bg-olive-700/70 sm:w-8" />
    </div>
  );
}

function ProductOrnateBorder() {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 z-10 h-full w-full text-brown-800"
      preserveAspectRatio="none"
      viewBox="0 0 100 100"
    >
      <path
        d="M 0 9.25 Q 5.4 5.4 9.25 0 H 90.75 Q 94.6 5.4 100 9.25 V 90.75 Q 94.6 94.6 90.75 100 H 9.25 Q 5.4 94.6 0 90.75 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.15"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function ProductOrnateClipPath() {
  return (
    <svg aria-hidden className="absolute h-0 w-0" width="0" height="0">
      <defs>
        <clipPath id="product-ornate-clip" clipPathUnits="objectBoundingBox">
          <path d="M 0 0.0925 Q 0.054 0.054 0.0925 0 H 0.9075 Q 0.946 0.054 1 0.0925 V 0.9075 Q 0.946 0.946 0.9075 1 H 0.0925 Q 0.054 0.946 0 0.9075 Z" />
        </clipPath>
      </defs>
    </svg>
  );
}

function ProductOrnateFrame({ children, className = "" }) {
  return (
    <div className={`product-ornate-frame group ${className}`}>
      <ProductOrnateBorder />
      <div className="relative px-2.5 py-3 sm:px-3 sm:py-3.5 lg:px-3.5 lg:py-4">
        {children}
      </div>
    </div>
  );
}

function ProductCard({ product }) {
  return (
    <motion.article
      variants={scaleIn}
      transition={defaultTransition}
      className="h-full"
    >
      <ProductOrnateFrame className="h-full">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-2.5 lg:gap-3">
          <div className="flex w-full max-w-[10.5rem] shrink-0 items-start justify-center sm:w-[44%] sm:max-w-none lg:w-[46%]">
            <img
              src={product.image}
              alt={product.name}
              className="h-auto w-full max-h-44 object-contain object-top sm:max-h-52 lg:max-h-56 xl:max-h-60"
              loading="lazy"
              decoding="async"
            />
          </div>

          <div className="flex w-full flex-1 flex-col items-center gap-2.5 text-center sm:items-start sm:gap-2 sm:pt-0.5 sm:text-left lg:gap-2.5">
            <h3
              className="font-display text-lg font-semibold leading-tight text-olive-800 sm:text-xl lg:text-[1.35rem]"
              aria-label={product.name}
            >
              {product.titleLines.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </h3>

            <CardDivider />

            <p className="text-body-sm max-w-[15rem] leading-relaxed text-brown-700 sm:max-w-none sm:text-[0.875rem] lg:text-[0.9375rem]">
              {product.description}
            </p>

            <motion.div
              className="mt-0.5 sm:mt-1"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              transition={springSnappy}
            >
              <Link
                to={getProductPath(product.slug)}
                className="btn btn-primary focus-ring inline-flex shrink-0 flex-nowrap items-center gap-1.5 px-4 py-2 text-[0.625rem] tracking-[0.1em] whitespace-nowrap sm:px-4 sm:py-2.5 sm:text-[0.68rem]"
              >
                Shop Now
                <LeafMark className="h-3 w-3 shrink-0 text-white" />
              </Link>
            </motion.div>
          </div>
        </div>
      </ProductOrnateFrame>
    </motion.article>
  );
}

function ProductsBranchDecor({ side }) {
  const isLeft = side === "left";

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute bottom-0 z-0 hidden md:block ${
        isLeft ? "left-0" : "right-0"
      }`}
    >
      <img
        src="/branchesbg_anp.webp"
        alt=""
        loading="lazy"
        className={`products-branches-decor h-[min(38vh,20rem)] w-auto max-w-[min(36vw,18rem)] object-contain lg:h-[min(42vh,24rem)] lg:max-w-[min(32vw,22rem)] ${
          isLeft ? "object-bottom-left" : "scale-x-[-1] object-bottom-right"
        }`}
      />
    </div>
  );
}

export default function OurProducts() {
  return (
    <section id="products" className="relative overflow-hidden bg-olive-900">
      <ProductOrnateClipPath />
      <ProductsBranchDecor side="left" />
      <ProductsBranchDecor side="right" />

      <div className="container-ashwini relative z-10 section-padding">
        <motion.header
          className="mx-auto mb-8 max-w-3xl text-center sm:mb-10 lg:mb-12"
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={staggerContainer}
        >
          <motion.div
            className="mb-3 flex items-center justify-center gap-3 sm:mb-4 sm:gap-4"
            variants={fadeUp}
            transition={defaultTransition}
          >
            <span className="why-choose-heading-line hidden sm:block" />
            <LeafMark />
            <h2 className="font-display text-xl tracking-[0.2em] text-gold-200 uppercase sm:text-2xl lg:text-[1.75rem]">
              Our Products
            </h2>
            <LeafMark />
            <span className="why-choose-heading-line hidden sm:block" />
          </motion.div>

          <motion.p
            className="font-display text-lg text-cream-300 sm:text-xl lg:text-[1.35rem]"
            variants={fadeUp}
            transition={defaultTransition}
          >
            Pure. Natural. Effective.
          </motion.p>

          <motion.div variants={fadeUp} transition={defaultTransition}>
            <ProductsDivider />
          </motion.div>
        </motion.header>

        <motion.div
          className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-6 min-[480px]:grid-cols-2 lg:max-w-7xl lg:grid-cols-3 lg:gap-6 xl:gap-7"
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={staggerContainer}
        >
          {LANDING_PRODUCTS.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
