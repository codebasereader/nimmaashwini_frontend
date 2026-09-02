import { motion } from "motion/react";
import { springSnappy } from "../../lib/motion";

export default function TrustBadge({ icon, image, label }) {
  return (
    <motion.div
      className="flex flex-col items-center gap-2.5 text-center sm:gap-3"
      whileHover={{ y: -4 }}
      transition={springSnappy}
    >
      <motion.div
        className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border border-olive-300/70 bg-cream-50/80 p-2 text-olive-700 shadow-soft backdrop-blur-sm sm:h-16 sm:w-16 sm:p-2.5"
        whileHover={{ scale: 1.06, borderColor: "var(--color-olive-500)" }}
        transition={springSnappy}
      >
        {image ? (
          <img src={image} alt="" className="h-full w-full object-contain" />
        ) : (
          icon
        )}
      </motion.div>
      <span className="max-w-[6.5rem] text-[0.7rem] leading-snug font-medium tracking-wide text-brown-700 sm:max-w-none sm:text-body-sm">
        {label}
      </span>
    </motion.div>
  );
}
