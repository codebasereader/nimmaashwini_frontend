import {
  GrainMotif,
  KolamMotif,
  MandalaMotif,
  OilDropMotif,
  PaisleyMotif,
  VineMotif,
} from "./motifs/TraditionalMotifs";

const MOTIFS = {
  kolam: KolamMotif,
  paisley: PaisleyMotif,
  vine: VineMotif,
  mandala: MandalaMotif,
  grain: GrainMotif,
  oil: OilDropMotif,
};

/**
 * Distinct SVG traditional décor per section — no repeated photo leaf strips.
 *
 * @param {"kolam"|"paisley"|"vine"|"mandala"|"grain"|"oil"} motif
 * @param {"sides"|"corners"} layout
 */
export default function TraditionalSectionDecor({
  motif = "kolam",
  layout = "sides",
  className = "",
} = {}) {
  const Motif = MOTIFS[motif] || KolamMotif;

  if (layout === "corners") {
    return (
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 overflow-hidden text-olive-700/25 ${className}`}
      >
        <MandalaMotif className="absolute -top-10 -left-10 h-40 w-40 sm:h-48 sm:w-48" />
        <MandalaMotif className="absolute -right-10 -bottom-10 h-40 w-40 rotate-180 sm:h-48 sm:w-48" />
        <MandalaMotif className="absolute top-1/2 -right-16 hidden h-36 w-36 -translate-y-1/2 opacity-70 lg:block" />
      </div>
    );
  }

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden text-olive-700/30 ${className}`}
    >
      <Motif className="absolute top-1/2 left-0 hidden h-[min(70%,22rem)] w-16 -translate-y-1/2 sm:w-20 md:block lg:w-24" />
      <Motif className="absolute top-1/2 right-0 hidden h-[min(70%,22rem)] w-16 -translate-y-1/2 scale-x-[-1] sm:w-20 md:block lg:w-24" />
      <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-olive-600/20 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-linear-to-r from-transparent via-gold-500/20 to-transparent" />
    </div>
  );
}
