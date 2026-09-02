import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { smoothEase } from "../../lib/motion";

export default function ProductCarousel({
  images,
  alt,
  autoPlayMs = 4500,
  compact = false,
  className = "",
}) {
  const [index, setIndex] = useState(0);

  const goTo = useCallback(
    (next) => {
      setIndex((next + images.length) % images.length);
    },
    [images.length],
  );

  useEffect(() => {
    if (images.length <= 1) return undefined;

    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % images.length);
    }, autoPlayMs);

    return () => window.clearInterval(timer);
  }, [images.length, autoPlayMs]);

  return (
    <div className={`flex flex-col ${className}`}>
      <div
        className={`relative w-full overflow-hidden ${
          compact ? "aspect-5/4 max-h-36 sm:max-h-40" : "aspect-4/3"
        }`}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.img
            key={images[index]}
            src={images[index]}
            alt={alt}
            className={`absolute inset-0 h-full w-full object-contain object-center ${
              compact ? "p-1.5 sm:p-2" : "p-2 sm:p-3"
            }`}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.45, ease: smoothEase }}
          />
        </AnimatePresence>
      </div>

      {images.length > 1 && (
        <div
          className={`flex items-center justify-center gap-1.5 ${compact ? "mt-2" : "mt-3"}`}
          role="tablist"
          aria-label={`${alt} image carousel`}
        >
          {images.map((_, dotIndex) => {
            const isActive = dotIndex === index;
            return (
              <button
                key={dotIndex}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-label={`Show image ${dotIndex + 1} of ${images.length}`}
                onClick={() => goTo(dotIndex)}
                className={`focus-ring h-2 w-2 rounded-full transition-all duration-300 ${
                  isActive
                    ? "scale-110 bg-olive-700"
                    : "bg-cream-400 hover:bg-olive-400"
                }`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
