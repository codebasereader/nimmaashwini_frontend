import { X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { iconProps } from "../../lib/icons";

/**
 * @param {"md" | "lg" | "xl" | "wide" | "full"} [size="md"]
 *   md   — narrow form drawer (default)
 *   lg   — wider overlay (vendor / item forms)
 *   xl   — ~70% viewport width (expenses)
 *   wide — ~90% viewport width (manual order create)
 *   full — full-screen width (purchase order create)
 */
export default function AdminDrawer({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  headerActions,
  size = "md",
  /** When true, stacks above an already-open drawer (e.g. category quick-add). */
  nested = false,
}) {
  const sizeClass =
    size === "full"
      ? "w-full max-w-none"
      : size === "wide"
        ? "w-[90vw] max-w-none"
        : size === "xl"
          ? "w-[70vw] max-w-none"
          : size === "lg"
            ? "w-full max-w-xl"
            : "w-full max-w-lg";
  const overlayZ = nested ? "z-[310]" : "z-[var(--z-overlay)]";
  const panelZ = nested ? "z-[320]" : "z-[var(--z-modal)]";

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            aria-label="Close drawer"
            className={`fixed inset-0 ${overlayZ} bg-olive-950/40 backdrop-blur-[2px]`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className={`fixed top-0 right-0 ${panelZ} flex h-full flex-col border-l border-cream-300 bg-cream-50 shadow-[var(--shadow-card-hover)] ${sizeClass}`}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.32, ease: [0.4, 0, 0.2, 1] }}
            role="dialog"
            aria-modal="true"
            aria-label={title}
          >
            <div className="flex shrink-0 items-center justify-between gap-4 border-b border-cream-300 bg-white px-5 py-4">
              <div className="min-w-0">
                <h2 className="font-display text-display-sm text-brown-900">
                  {title}
                </h2>
                {subtitle && (
                  <p className="mt-0.5 truncate text-body-sm text-brown-500">
                    {subtitle}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {headerActions}
                <button
                  type="button"
                  onClick={onClose}
                  className="focus-ring rounded-sm p-2 text-brown-500 transition-colors hover:text-olive-800"
                  aria-label="Close"
                >
                  <X {...iconProps(20)} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
            {footer && (
              <div className="shrink-0 border-t border-cream-300 bg-white px-5 py-4">
                {footer}
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
