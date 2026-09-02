import { motion } from "motion/react";
import { Star } from "lucide-react";
import LeafMark from "../icons/LeafMark";
import {
  defaultTransition,
  fadeUp,
  scaleIn,
  staggerContainer,
  viewportOnce,
} from "../../lib/motion";
import { iconProps } from "../../lib/icons";

function StarRow({ rating = 5, className = "" }) {
  return (
    <div className={`flex gap-0.5 ${className}`} aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          {...iconProps(14)}
          className={`sm:h-4 sm:w-4 ${
            i < rating ? "fill-gold-500 text-gold-500" : "fill-cream-300 text-cream-300"
          }`}
        />
      ))}
    </div>
  );
}

const MARQUEE_REVIEWS = [
  { name: "Lakshmi D.", text: "My grandmother used to prepare hair oil at home — Ashwini carries that same warmth." },
  { name: "Priya N.", text: "Ragi malt tastes earthy and honest, like something made in a kitchen." },
  { name: "Rashmi P.", text: "Authentic Natural feel in every drop." },
  { name: "Geetha M.", text: "Packaging is beautiful — gift-worthy quality." },
  { name: "Nandini V.", text: "No sulphates, no regrets. Scalp feels balanced." },
  { name: "Shwetha B.", text: "Ragi malt keeps me full till lunch, naturally." },
  { name: "Ananya R.", text: "Finally a shampoo that doesn't strip my scalp dry." },
  { name: "Aparna J.", text: "Third reorder — that says everything." },
  { name: "Vidya T.", text: "Hair feels thicker along the hairline. Pleasant surprise." },
  { name: "Suma L.", text: "Love supporting a brand rooted in tradition." },
  { name: "Bhavya N.", text: "Chemical-free and it actually works. Rare combo." },
  { name: "Meera K.", text: "Visible shine after the third wash. No sticky residue." },
];

function MarqueeRow({ reverse = false }) {
  const items = reverse ? [...MARQUEE_REVIEWS].reverse() : MARQUEE_REVIEWS;
  const track = [...items, ...items];

  return (
    <div className="reviews-marquee-mask overflow-hidden py-1">
      <div
        className={`reviews-marquee-track flex w-max gap-4 ${reverse ? "reviews-marquee-reverse" : ""}`}
      >
        {track.map((item, i) => (
          <div key={`${item.name}-${i}`} className="reviews-marquee-chip shrink-0">
            <StarRow rating={5} className="mb-2" />
            <p className="text-[0.8rem] leading-relaxed text-brown-700">
              &ldquo;{item.text}&rdquo;
            </p>
            <p className="mt-2 text-[0.7rem] font-semibold tracking-wide text-olive-700 uppercase">
              — {item.name}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Reviews() {
  return (
    <section id="reviews" className="reviews-section relative overflow-hidden section-padding">
      <div aria-hidden="true" className="reviews-glow pointer-events-none absolute inset-0" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[36rem] -translate-x-1/2 rounded-full bg-olive-300/10 blur-3xl"
      />

      <div className="container-ashwini relative">
        <motion.header
          className="mb-8 text-center sm:mb-10"
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={staggerContainer}
        >
          <motion.div
            className="mb-4 flex items-center justify-center gap-3 sm:gap-4"
            variants={scaleIn}
            transition={defaultTransition}
          >
            <span className="reviews-heading-line hidden sm:block" />
            <LeafMark className="h-4 w-4 text-olive-600 sm:h-5 sm:w-5" />
            <h2 className="font-display text-lg tracking-[0.22em] text-brown-900 uppercase sm:text-xl lg:text-2xl">
              Voices of Trust
            </h2>
            <LeafMark className="h-4 w-4 text-olive-600 sm:h-5 sm:w-5" />
            <span className="reviews-heading-line hidden sm:block" />
          </motion.div>

          <motion.p
            className="mx-auto max-w-lg text-body-sm text-brown-600 sm:text-body"
            variants={fadeUp}
            transition={defaultTransition}
          >
            Real stories from families who welcomed Nimma Ashwini into their daily rituals.
          </motion.p>
        </motion.header>

        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          transition={defaultTransition}
        >
          <MarqueeRow />
          <MarqueeRow reverse />
        </motion.div>
      </div>
    </section>
  );
}
