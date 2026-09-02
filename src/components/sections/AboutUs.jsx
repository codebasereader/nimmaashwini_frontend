import { motion } from "motion/react";
import { ShieldCheck } from "lucide-react";
import LeafMark from "../icons/LeafMark";
import { iconProps } from "../../lib/icons";

import {
  defaultTransition,
  fadeUp,
  scaleIn,
  smoothEase,
  staggerContainer,
  viewportOnce,
} from "../../lib/motion";
import TrustBadge from "../ui/TrustBadge";

const VALUE_BADGES = [
  { label: "Natural Ingredients", image: "/about/pure_anp.webp" },
  { label: "Natural Wisdom", image: "/about/ayurvedic_anp.webp" },
  {
    label: "Safe & Effective",
    icon: (
      <ShieldCheck
        {...iconProps(28)}
        className="h-7 w-7 text-olive-700 sm:h-8 sm:w-8"
      />
    ),
  },
];

function SideDecor({ side }) {
  const isLeft = side === "left";

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-y-0 z-0 hidden w-[clamp(3rem,12vw,10rem)] md:block ${
        isLeft ? "left-0" : "right-0"
      }`}
    >
      <img
        src={isLeft ? "/traditionalleft_anp.webp" : "/traditionright_anp.webp"}
        alt=""
        className={`h-full w-full object-cover ${
          isLeft
            ? "why-choose-side-decor object-left"
            : "why-choose-side-decor-right object-right"
        }`}
      />
    </div>
  );
}

function AboutDivider() {
  return (
    <div
      aria-hidden="true"
      className="mt-5 flex items-center gap-3 sm:mt-6 lg:max-w-md"
    >
      <span className="h-px flex-1 bg-linear-to-r from-transparent via-olive-600/70 to-olive-600/30" />
      <svg
        className="h-4 w-8 shrink-0 text-olive-700"
        fill="none"
        viewBox="0 0 32 16"
        stroke="currentColor"
        strokeWidth="1.25"
      >
        <path
          d="M2 8c4-4 8-4 12 0s8 4 12 0"
          strokeLinecap="round"
        />
        <circle cx="16" cy="8" fill="currentColor" r="1.5" stroke="none" />
      </svg>
      <span className="h-px flex-1 bg-linear-to-l from-transparent via-olive-600/70 to-olive-600/30" />
    </div>
  );
}

export default function AboutUs() {
  return (
    <section id="about" className="relative overflow-hidden bg-cream-100">
      <SideDecor side="left" />
      <SideDecor side="right" />

      <div className="container-ashwini relative z-10 section-padding">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-12 xl:gap-16">
          <motion.div
            className="mx-auto max-w-xl text-center lg:mx-0 lg:text-left"
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            variants={staggerContainer}
          >
            <motion.header variants={fadeUp} transition={defaultTransition}>
              <p className="section-label mb-4 flex items-center justify-center gap-2 sm:mb-5 lg:justify-start">
                <LeafMark />
                <span>About Us</span>
                <LeafMark />
              </p>

              <h2 className="text-display-sm sm:text-display-md text-balance text-brown-900">
                Rooted in Tradition. Committed to Nature.
              </h2>

              <AboutDivider />
            </motion.header>

            <motion.p
              className="mt-5 text-[1.0625rem] leading-[1.85] font-medium text-brown-700 sm:mt-6 sm:text-[1.125rem] lg:text-[1.1875rem]"
              variants={fadeUp}
              transition={defaultTransition}
            >
              At Nimma Ashwini, we believe in the timeless wisdom of Nature
              and the healing power of nature. Our products are crafted with
              pure, natural ingredients to nourish your hair and body in the
              traditional way.
            </motion.p>

            <motion.div
              className="mt-10 flex flex-wrap items-start justify-center gap-8 sm:mt-12 sm:gap-10 lg:justify-start"
              variants={staggerContainer}
            >
              {VALUE_BADGES.map((badge) => (
                <motion.div
                  key={badge.label}
                  variants={scaleIn}
                  transition={defaultTransition}
                >
                  <TrustBadge
                    image={badge.image}
                    icon={badge.icon}
                    label={badge.label}
                  />
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          <motion.div
            className="flex justify-center lg:justify-end"
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={viewportOnce}
            transition={{ duration: 0.85, ease: smoothEase }}
          >
            <div className="relative w-full max-w-[min(100%,20rem)] sm:max-w-md lg:max-w-lg">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-[6%] rounded-full border border-olive-300/35"
              />
              <img
                src="/aboutimage.webp"
                alt="A woman in traditional attire surrounded by Natural herbs and natural ingredients"
                width={640}
                height={640}
                className="hero-image-blend aspect-square w-full object-contain object-center"
                decoding="async"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
