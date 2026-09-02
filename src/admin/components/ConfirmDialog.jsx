import { AnimatePresence, motion } from "motion/react";

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Delete",
  onConfirm,
  onCancel,
  loading = false,
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[340] bg-olive-950/45"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
          />
          <motion.div
            className="fixed top-1/2 left-1/2 z-[350] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-cream-300 bg-white p-6 shadow-[var(--shadow-card-hover)]"
            initial={{ opacity: 0, scale: 0.96, y: "-45%" }}
            animate={{ opacity: 1, scale: 1, y: "-50%" }}
            exit={{ opacity: 0, scale: 0.96, y: "-45%" }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
          >
            <h3 className="font-display text-xl text-brown-900">{title}</h3>
            <p className="mt-2 text-body-sm text-brown-600">{message}</p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={onCancel}
                disabled={loading}
                className="btn btn-secondary px-5 py-2.5 text-[0.7rem]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={loading}
                className="btn rounded-sm bg-terracotta-600 px-5 py-2.5 text-[0.7rem] text-white hover:bg-terracotta-500 disabled:opacity-60"
              >
                {loading ? "Deleting..." : confirmLabel}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
