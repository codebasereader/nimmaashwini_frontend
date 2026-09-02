import { motion } from "motion/react";
import { Leaf, Truck } from "lucide-react";
import { fadeDown, defaultTransition } from "../../lib/motion";
import { iconProps } from "../../lib/icons";

export default function AnnouncementBar() {
  return (
    <motion.div
      className="bg-olive-900 text-white"
      initial="hidden"
      animate="visible"
      variants={fadeDown}
      transition={{ ...defaultTransition, duration: 0.5 }}
    >
      <div className="container-ashwini flex flex-col items-center justify-between gap-2 py-2.5 text-[0.7rem] font-medium tracking-[0.14em] uppercase sm:flex-row sm:text-caption">
        <p className="flex items-center gap-2 text-center sm:text-left">
          <Leaf {...iconProps(14)} className="shrink-0 text-olive-300" />
          <span>Pure Ingredients. Honest Practices. Timeless Wellness.</span>
        </p>
        <p className="flex items-center gap-2 text-center sm:text-right">
          <Truck {...iconProps(14)} className="shrink-0 text-olive-300" />
          <span>Free Shipping on all orders above ₹999</span>
        </p>
      </div>
    </motion.div>
  );
}
