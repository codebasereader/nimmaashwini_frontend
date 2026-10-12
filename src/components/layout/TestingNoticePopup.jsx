import { Phone, TriangleAlert, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { WHATSAPP_DISPLAY } from "../../lib/checkout";
import { iconProps } from "../../lib/icons";
import { TESTING_MODE } from "../../lib/siteNotice";

const SEEN_KEY = "testing-notice-seen";

function wasSeen() {
  try {
    return sessionStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

export default function TestingNoticePopup() {
  const [open, setOpen] = useState(() => TESTING_MODE && !wasSeen());

  const close = () => {
    setOpen(false);
    try {
      sessionStorage.setItem(SEEN_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            className="fixed inset-0 z-[340] bg-olive-950/55"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Website in testing mode"
            className="fixed top-1/2 left-1/2 z-[350] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-xl border border-red-200 bg-white text-center shadow-[var(--shadow-card-hover)]"
            initial={{ opacity: 0, scale: 0.96, y: "-45%" }}
            animate={{ opacity: 1, scale: 1, y: "-50%" }}
            exit={{ opacity: 0, scale: 0.96, y: "-45%" }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
          >
            <div className="bg-red-600 px-5 py-4 text-white">
              <TriangleAlert {...iconProps(28)} className="mx-auto" />
              <h3 className="mt-2 font-display text-xl">Website in testing mode</h3>
            </div>
            <div className="px-6 py-5">
              <p className="text-body text-brown-700">
                Our website is currently under testing. <strong>Please do not make any payment.</strong>
              </p>
              <p className="mt-3 text-body text-brown-700">
                To place an order, please contact us:
              </p>
              <a
                href={`tel:${WHATSAPP_DISPLAY.replace(/\s/g, "")}`}
                className="btn btn-primary focus-ring mt-3 inline-flex items-center gap-2 px-6 py-3"
              >
                <Phone {...iconProps(16)} />
                {WHATSAPP_DISPLAY}
              </a>
              <button
                type="button"
                onClick={close}
                className="focus-ring mt-4 block w-full text-body-sm text-brown-500 underline hover:text-brown-800"
              >
                I understand, continue browsing
              </button>
            </div>
            <button
              type="button"
              onClick={close}
              aria-label="Close"
              className="focus-ring absolute top-2 right-2 rounded-md p-1.5 text-white/90 hover:bg-white/15"
            >
              <X {...iconProps(18)} />
            </button>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
