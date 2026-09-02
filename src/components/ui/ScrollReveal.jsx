import { motion } from "motion/react";
import {
  defaultTransition,
  fadeUp,
  viewportOnce,
} from "../../lib/motion";

export default function ScrollReveal({
  children,
  className = "",
  delay = 0,
  variants = fadeUp,
  as = "div",
  ...props
}) {
  const Component = motion[as] ?? motion.div;

  return (
    <Component
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      variants={variants}
      transition={{ ...defaultTransition, delay }}
      {...props}
    >
      {children}
    </Component>
  );
}
