import { motion } from "motion/react";
import HashScrollLink from "../HashScrollLink";
import LeafMark from "../icons/LeafMark";

import {
  defaultTransition,
  fadeUp,
  springSnappy,
  staggerContainer,
} from "../../lib/motion";

function LeafIcon({ className = "h-4 w-4" }) {
  return <LeafMark className={className} />;
}

function HeroBranchDecor() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute top-0 left-0 z-[2] hidden opacity-25 md:block"
    >
      <img
        src="/herobg_anp.webp"
        alt=""
        className="hero-branches-decor h-[min(40vh,22rem)] w-auto max-w-[min(38vw,20rem)] object-contain object-top-left lg:h-[min(44vh,26rem)] lg:max-w-[min(34vw,24rem)]"
      />
    </div>
  );
}

export default function Hero() {
  return (
    <section
      id="home"
      className="relative overflow-hidden bg-olive-900 md:aspect-[2.5/1]"
    >
      {/* Desktop: full-bleed background behind text */}
      <img
        src="/hersectionbgnew.webp"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 hidden h-full w-full object-cover object-right md:block"
        fetchPriority="high"
        decoding="async"
      />
      <div
        aria-hidden="true"
        className="hero-text-scrim pointer-events-none absolute inset-0 z-[1] hidden md:block"
      />

      <HeroBranchDecor />

      <div className="relative z-10 md:flex md:h-full md:items-center">
        {/* Mobile: image stacked above the copy */}
        <div className="md:hidden">
          <img
            src="/hersectionbgnew.webp"
            alt="Nimma Ashwini Natural essentials"
            className="aspect-[4/3] w-full object-cover object-[72%_center]"
            fetchPriority="high"
            decoding="async"
          />
        </div>

        <div className="container-ashwini py-10 md:py-10 lg:py-12">
          <div className="md:grid md:w-full md:grid-cols-[minmax(0,44%)_1fr] md:items-center">
            <motion.div
              className="relative z-10 max-w-xl"
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
            >
              <motion.p
                className="section-label mb-4 text-gold-400 sm:mb-5"
                variants={fadeUp}
                transition={defaultTransition}
              >
                Nimma Ashwini Be Natural
              </motion.p>

              <motion.h1
                className="text-display-md sm:text-display-lg xl:text-display-xl mb-5 text-balance text-cream-100 sm:mb-6"
                variants={fadeUp}
                transition={defaultTransition}
              >
                Rooted in Tradition.
                <span className="mt-1 block text-gold-300">
                  Made for Modern Life.
                </span>
              </motion.h1>

              <motion.p
                className="text-body-lg mb-8 max-w-md text-cream-300 sm:mb-10"
                variants={fadeUp}
                transition={defaultTransition}
              >
                Handcrafted Natural essentials for healthy hair, strong roots
                &amp; natural living.
              </motion.p>

              <motion.div variants={fadeUp} transition={defaultTransition}>
                <motion.div
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  transition={springSnappy}
                >
                  <HashScrollLink
                    to="/#products"
                    className="btn focus-ring group inline-flex bg-cream-100 text-olive-900 hover:bg-gold-200 hover:text-olive-950"
                  >
                    <LeafIcon className="h-4 w-4 text-olive-800" />
                    Shop Our Products
                  </HashScrollLink>
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
