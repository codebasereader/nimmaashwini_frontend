import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

const LOAD_DURATION_MS = 2400;

export default function LogoLoader({ onComplete }) {
  const [progress, setProgress] = useState(0);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    let rafId = 0;
    const start = performance.now();

    const tick = (now) => {
      const elapsed = now - start;
      const next = Math.min(
        100,
        Math.round((elapsed / LOAD_DURATION_MS) * 100),
      );
      setProgress(next);

      if (next < 100) {
        rafId = requestAnimationFrame(tick);
      } else {
        window.setTimeout(() => setExiting(true), 350);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafId);
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <AnimatePresence onExitComplete={onComplete}>
      {!exiting && (
        <motion.div
          className="logo-loader fixed inset-0 z-[500] flex items-center justify-center bg-cream-100"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
        >
          <div className="flex w-full max-w-md flex-col items-center px-6 sm:max-w-lg">
            <motion.img
              src="/anp_logo.webp"
              alt="Nimma Ashwini"
              className="h-44 w-auto object-contain sm:h-56 lg:h-64"
              initial={{ opacity: 0, scale: 0.92, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
            />

            <div className="mt-10 w-full sm:mt-12">
              <div
                className="logo-loader-track h-1.5 w-full overflow-hidden rounded-full"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={progress}
                aria-label="Loading"
              >
                <motion.div
                  className="logo-loader-fill h-full rounded-full"
                  initial={{ width: "0%" }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.15, ease: "linear" }}
                />
              </div>

              <p className="mt-3 text-center text-caption font-semibold tracking-[0.2em] text-olive-700 uppercase">
                {progress}%
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
