import { Fragment } from "react";
import { motion } from "motion/react";
import { ArrowDown, ArrowRight } from "lucide-react";
import LeafMark from "../icons/LeafMark";
import { iconProps } from "../../lib/icons";
import {
  defaultTransition,
  fadeUp,
  springSnappy,
  staggerContainer,
  viewportOnce,
} from "../../lib/motion";

function ArrowConnector({ direction = "right" }) {
  const isRight = direction === "right";

  return (
    <div
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center text-brown-700/55 ${
        isRight
          ? "process-arrow-connector hidden px-1 lg:flex lg:px-2 xl:px-3"
          : "py-2 lg:hidden"
      }`}
    >
      {isRight ? (
        <ArrowRight {...iconProps(20)} className="h-4 w-5 xl:h-5 xl:w-6" />
      ) : (
        <ArrowDown {...iconProps(20)} className="h-5 w-4" />
      )}
    </div>
  );
}

const STEPS = [
  {
    title: "Handpicked Ingredients",
    description: "We source the finest herbs & grains.",
    image: "/process/handpicked_anp.webp",
  },
  {
    title: "Traditional Preparation",
    description: "Prepared using ancient Natural methods.",
    image: "/process/traditionalprep_anp.webp",
  },
  {
    title: "Natural Drying",
    description: "Sun-dried to retain maximum nutrients.",
    image: "/process/natural_anp.webp",
  },
  {
    title: "Quality Testing",
    description: "Every batch is tested for purity & safety.",
    image: "/process/quality_anp.webp",
  },
  {
    title: "Packed with Care",
    description: "Hygienically packed and ready for you.",
    image: "/process/packed_anp.webp",
  },
];

const stepPop = {
  hidden: { opacity: 0, scale: 0.82, y: 24 },
  visible: { opacity: 1, scale: 1, y: 0 },
};

function ProcessStep({ step, index }) {
  return (
    <motion.article
      className="process-step group flex max-w-[11rem] flex-col items-center text-center sm:max-w-[12rem] lg:max-w-none lg:flex-1"
      variants={stepPop}
      transition={{ ...springSnappy, delay: index * 0.1 }}
    >
      <motion.div
        className="process-step-ring mb-4 sm:mb-5"
        whileHover={{ scale: 1.08, y: -6 }}
        transition={springSnappy}
      >
        <div className="process-step-icon-wrap overflow-hidden rounded-full">
          <img
            src={step.image}
            alt={step.title}
            className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-110"
          />
        </div>
      </motion.div>

      <h3 className="font-display mb-2 text-base leading-snug font-semibold text-brown-900 sm:text-lg">
        {index + 1}. {step.title}
      </h3>
      <p className="text-[0.78rem] leading-relaxed font-medium text-brown-600 sm:text-body-sm">
        {step.description}
      </p>
    </motion.article>
  );
}

export default function Process() {
  return (
    <section
      id="process"
      className="relative overflow-hidden bg-cream-100 section-padding"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 30%, rgb(107 130 86 / 0.08), transparent 45%), radial-gradient(circle at 80% 70%, rgb(196 163 90 / 0.1), transparent 40%)",
        }}
      />

      <div className="container-ashwini relative">
        <motion.header
          className="mb-10 text-center sm:mb-12 lg:mb-14"
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={staggerContainer}
        >
          <motion.div
            className="flex items-center justify-center gap-3 sm:gap-4"
            variants={fadeUp}
            transition={defaultTransition}
          >
            <LeafMark className="h-4 w-4 text-olive-700 sm:h-5 sm:w-5" />
            <h2 className="font-display text-lg tracking-[0.22em] text-brown-900 uppercase sm:text-xl lg:text-2xl">
              Our Traditional Process
            </h2>
            <LeafMark className="h-4 w-4 text-olive-700 sm:h-5 sm:w-5" />
          </motion.div>
        </motion.header>

        <motion.div
          className="flex flex-col items-center lg:flex-row lg:items-start lg:justify-between"
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={staggerContainer}
        >
          {STEPS.map((step, index) => (
            <Fragment key={step.title}>
              <ProcessStep step={step} index={index} />
              {index < STEPS.length - 1 && (
                <>
                  <ArrowConnector direction="right" />
                  <ArrowConnector direction="down" />
                </>
              )}
            </Fragment>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
