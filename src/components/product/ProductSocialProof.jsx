import { useEffect, useMemo, useState } from "react";
import { Eye, Sprout, Star, TrendingUp, Users } from "lucide-react";
import { iconProps } from "../../lib/icons";
import { isMultigrainMaltSlug } from "../../lib/product";

const HAIR_OIL_SLUG = "herbal-hair-oil";

const MALT_PROOF = {
  primary: {
    icon: Users,
      label: "80,000+ customers reviewed this product",
  },
  secondary: {
    icon: Star,
    label: "Trusted for everyday family wellness",
  },
  viewers: { min: 12, max: 28, base: 18 },
};

const PROOF_BY_SLUG = {
  [HAIR_OIL_SLUG]: {
    primary: {
      icon: TrendingUp,
      label: "5,000+ customers reported reduced hair fall",
    },
    secondary: {
      icon: Sprout,
      label: "Natural growth care with herbal oils",
    },
    viewers: { min: 9, max: 22, base: 14 },
  },
};

const DEFAULT_PROOF = {
  primary: {
    icon: Users,
    label: "Loved by families across India",
  },
  secondary: {
    icon: Star,
    label: "Crafted the traditional way",
  },
  viewers: { min: 6, max: 16, base: 10 },
};

function hashSlug(slug = "") {
  let hash = 0;
  for (let i = 0; i < slug.length; i += 1) {
    hash = (hash * 31 + slug.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function useLiveViewerCount(slug, range) {
  const initial = useMemo(() => {
    const span = Math.max(1, range.max - range.min);
    return range.min + (hashSlug(slug) % (span + 1));
  }, [slug, range.min, range.max]);

  const [count, setCount] = useState(initial);

  useEffect(() => {
    setCount(initial);
    const timer = window.setInterval(() => {
      setCount((current) => {
        const delta = Math.random() > 0.55 ? 1 : -1;
        const next = current + delta;
        if (next < range.min) return range.min;
        if (next > range.max) return range.max;
        return next;
      });
    }, 4500);
    return () => window.clearInterval(timer);
  }, [initial, range.min, range.max]);

  return count;
}

function ProofRow({ icon: Icon, label }) {
  return (
    <div className="flex items-start gap-2.5 text-body-sm text-brown-700">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-olive-100 text-olive-800">
        <Icon {...iconProps(14)} />
      </span>
      <span className="leading-snug">{label}</span>
    </div>
  );
}

/**
 * Minimal social-proof block for product detail hero.
 */
export default function ProductSocialProof({ slug }) {
  const proof = isMultigrainMaltSlug(slug)
    ? MALT_PROOF
    : PROOF_BY_SLUG[slug] || DEFAULT_PROOF;
  const viewers = useLiveViewerCount(slug, proof.viewers);

  return (
    <div className="mt-5 space-y-3 border-y border-cream-300/90 py-4">
      <ProofRow icon={proof.primary.icon} label={proof.primary.label} />
      <ProofRow icon={proof.secondary.icon} label={proof.secondary.label} />
      <div className="flex items-center gap-2.5 text-body-sm text-olive-800">
        <span className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gold-100 text-olive-800">
          <Eye {...iconProps(14)} />
          <span
            aria-hidden="true"
            className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-olive-600"
          />
        </span>
        <span className="leading-snug">
          <span className="font-semibold tabular-nums">{viewers}</span> people are
          viewing this right now
        </span>
      </div>
    </div>
  );
}
