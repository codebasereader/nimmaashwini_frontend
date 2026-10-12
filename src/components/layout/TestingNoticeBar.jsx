import { TriangleAlert } from "lucide-react";
import { WHATSAPP_DISPLAY } from "../../lib/checkout";
import { TESTING_MODE } from "../../lib/siteNotice";
import { iconProps } from "../../lib/icons";

const PHONE_HREF = `tel:${WHATSAPP_DISPLAY.replace(/\s/g, "")}`;

function Message() {
  return (
    <span className="mx-8 inline-flex items-center gap-2">
      <TriangleAlert {...iconProps(14)} className="shrink-0 text-white" />
      <span>
        Our website is in testing mode — please do not make any payment. To place an order, call
        or WhatsApp{" "}
        <a href={PHONE_HREF} className="font-bold underline underline-offset-2">
          {WHATSAPP_DISPLAY}
        </a>
      </span>
    </span>
  );
}

export default function TestingNoticeBar() {
  if (!TESTING_MODE) return null;

  return (
    <div
      role="status"
      className="relative z-[var(--z-sticky)] overflow-hidden bg-red-600 py-2 text-[0.75rem] font-medium tracking-wide text-white"
    >
      <div className="notice-marquee-track flex w-max whitespace-nowrap">
        <Message />
        <Message />
        <Message />
        <Message />
      </div>
    </div>
  );
}
