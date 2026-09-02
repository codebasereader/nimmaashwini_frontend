import { Fragment } from "react";
import { motion } from "motion/react";
import LeafMark from "../icons/LeafMark";
import {
  defaultTransition,
  fadeUp,
  scaleIn,
  springSnappy,
  staggerContainer,
  viewportOnce,
} from "../../lib/motion";

const PILLARS = [
  {
    title: "100% Natural",
    description: "No harmful chemicals or toxins.",
    image: "/whychoose/Naturall_anp.webp",
  },
  {
    title: "Handcrafted",
    description: "Made in small batches with care & love.",
    image: "/whychoose/Handcrafted_anp.webp",
  },
  {
    title: "Natural",
    description: "Inspired by ancient Natural wisdom.",
    image: "/whychoose/Ayurvedicc_anp.webp",
  },
  {
    title: "Holistic Wellness",
    description: "For healthy hair, naturally.",
    image: "/whychoose/Holistic_Wellness_anp.webp",
  },
  {
    title: "Sustainable",
    description: "Eco-friendly practices for a better tomorrow.",
    image: "/whychoose/Sustainable_anp.webp",
  },
];

function SideDecor({ side }) {
  const isLeft = side === "left";

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-y-0 z-0 hidden w-[clamp(3rem,14vw,11rem)] md:block ${
        isLeft ? "left-0" : "right-0"
      }`}
    >
      <img
        src={isLeft ? "/traditionalleft_anp.webp" : "/traditionright_anp.webp"}
        alt=""
        loading="lazy"
        decoding="async"
        className={`h-full w-full object-cover ${
          isLeft
            ? "why-choose-side-decor object-left"
            : "why-choose-side-decor-right object-right"
        }`}
      />
    </div>
  );
}

function PillarCard({ pillar, index }) {
  return (
    <motion.div
      className="why-choose-pillar group relative flex flex-col items-center px-3 text-center sm:px-4"
      variants={fadeUp}
      transition={{ ...defaultTransition, delay: index * 0.06 }}
    >
      <motion.div
        className="why-choose-icon-ring mb-4 flex h-[4.5rem] w-[4.5rem] items-center justify-center text-gold-300 sm:mb-5 sm:h-20 sm:w-20"
        whileHover={{ scale: 1.06, rotate: 3 }}
        transition={springSnappy}
      >
        <img
          src={pillar.image}
          alt=""
          loading="lazy"
          className="relative z-10 h-14 w-14 object-contain sm:h-16 sm:w-16"
        />
      </motion.div>

      <h3 className="mb-2 text-sm font-semibold tracking-wide text-gold-200 uppercase sm:text-[0.9rem]">
        {pillar.title}
      </h3>
      <p className="max-w-[11rem] text-[0.72rem] leading-relaxed text-gold-300/75 sm:max-w-[12rem] sm:text-body-sm">
        {pillar.description}
      </p>
    </motion.div>
  );
}

function PillarDivider() {
  return (
    <div
      aria-hidden="true"
      className="why-choose-divider mx-auto hidden h-px w-full max-w-[4rem] lg:mx-0 lg:block lg:h-auto lg:min-h-[7.5rem] lg:w-px lg:max-w-none lg:self-center"
    />
  );
}

export default function WhyChoose() {
  return (
    <section
      id="why-choose"
      className="why-choose-section relative overflow-hidden"
    >
      <div
        aria-hidden="true"
        className="why-choose-glow pointer-events-none absolute inset-0"
      />

      <SideDecor side="left" />
      <SideDecor side="right" />

      <div className="container-ashwini relative z-10 py-10 sm:py-12 lg:py-14">
        <motion.header
          className="mb-9 text-center sm:mb-10 lg:mb-12"
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
            <span className="why-choose-heading-line hidden sm:block" />
            <LeafMark className="h-4 w-4 text-gold-400 sm:h-5 sm:w-5" />
            <h2 className="font-display text-lg tracking-[0.22em] text-gold-200 uppercase sm:text-xl lg:text-2xl">
              Why Choose Ashwini?
            </h2>
            <LeafMark className="h-4 w-4 text-gold-400 sm:h-5 sm:w-5" />
            <span className="why-choose-heading-line hidden sm:block" />
          </motion.div>
        </motion.header>

        <motion.div
          className="flex flex-col gap-8 sm:grid sm:grid-cols-2 sm:gap-x-8 sm:gap-y-10 lg:flex lg:flex-row lg:items-stretch lg:justify-between lg:gap-0"
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={staggerContainer}
        >
          {PILLARS.map((pillar, index) => (
            <Fragment key={pillar.title}>
              <div className="lg:flex lg:flex-1 lg:justify-center">
                <PillarCard pillar={pillar} index={index} />
              </div>
              {index < PILLARS.length - 1 && <PillarDivider />}
            </Fragment>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
