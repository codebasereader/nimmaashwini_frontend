/**
 * Original minimal traditional SVG motifs for product sections.
 * Inspired by kolam / rangoli geometry, paisley, herbal vines, and soft mandalas
 * (not copied from third-party assets). Brand olive + gold strokes.
 */

const STROKE = "currentColor";

function SvgFrame({ children, className = "" }) {
  return (
    <svg
      viewBox="0 0 120 320"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

/** Geometric kolam / rangoli side — specs */
export function KolamMotif({ className = "" }) {
  return (
    <SvgFrame className={className}>
      <g stroke={STROKE} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="60" cy="60" r="18" />
        <circle cx="60" cy="60" r="8" />
        <path d="M60 30 L72 48 L60 42 L48 48 Z" />
        <path d="M90 60 L72 72 L78 60 L72 48 Z" />
        <path d="M60 90 L48 72 L60 78 L72 72 Z" />
        <path d="M30 60 L48 48 L42 60 L48 72 Z" />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
          const rad = (deg * Math.PI) / 180;
          const x1 = 60 + Math.cos(rad) * 26;
          const y1 = 60 + Math.sin(rad) * 26;
          const x2 = 60 + Math.cos(rad) * 38;
          const y2 = 60 + Math.sin(rad) * 38;
          return <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2} />;
        })}
        <circle cx="60" cy="160" r="14" />
        <path d="M60 140 v40 M40 160 h40" />
        <circle cx="60" cy="160" r="4" fill={STROKE} stroke="none" />
        <path d="M46 146 L74 174 M74 146 L46 174" opacity="0.7" />
        <circle cx="60" cy="250" r="16" />
        <path d="M60 226 C78 238 78 262 60 274 C42 262 42 238 60 226 Z" opacity="0.85" />
        <circle cx="60" cy="250" r="5" />
      </g>
    </SvgFrame>
  );
}

/** Paisley vine — reviews */
export function PaisleyMotif({ className = "" }) {
  return (
    <SvgFrame className={className}>
      <g stroke={STROKE} strokeWidth="1.25" strokeLinecap="round" fill="none">
        <path d="M58 28 C88 48 92 92 62 118 C42 136 38 158 58 178" />
        <path d="M58 28 C40 52 36 86 58 108 C78 128 86 154 58 178" />
        <path d="M58 52 C68 62 70 78 58 90 C50 82 50 66 58 52" opacity="0.75" />
        <path d="M70 70 C82 78 84 94 72 104" opacity="0.65" />
        <path d="M48 200 C78 220 86 256 56 286 C36 304 42 250 48 200 Z" />
        <path d="M52 230 C64 238 66 256 54 268" opacity="0.75" />
        <circle cx="60" cy="150" r="3" fill={STROKE} stroke="none" />
        <path d="M60 120 C60 132 60 140 60 150" opacity="0.5" />
      </g>
    </SvgFrame>
  );
}

/** Herbal vine / leaf trail — videos */
export function VineMotif({ className = "" }) {
  return (
    <SvgFrame className={className}>
      <g stroke={STROKE} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none">
        <path d="M60 20 C60 70 40 90 60 130 C80 170 60 190 60 240 C60 280 70 300 60 310" />
        <path d="M60 55 C42 48 30 58 28 72 C40 70 52 66 60 55" />
        <path d="M60 55 C78 48 90 58 92 72 C80 70 68 66 60 55" />
        <path d="M60 110 C44 104 32 116 34 132 C46 126 54 120 60 110" />
        <path d="M60 110 C76 104 88 116 86 132 C74 126 66 120 60 110" />
        <path d="M60 175 C43 168 34 182 38 198 C48 190 56 182 60 175" />
        <path d="M60 175 C77 168 86 182 82 198 C72 190 64 182 60 175" />
        <path d="M60 235 C45 230 36 242 40 256 C50 250 56 242 60 235" />
        <path d="M60 235 C75 230 84 242 80 256 C70 250 64 242 60 235" />
        <circle cx="60" cy="90" r="2.5" fill={STROKE} stroke="none" />
        <circle cx="60" cy="155" r="2.5" fill={STROKE} stroke="none" />
        <circle cx="60" cy="210" r="2.5" fill={STROKE} stroke="none" />
      </g>
    </SvgFrame>
  );
}

/** Soft corner mandala — FAQ / hero accents */
export function MandalaMotif({ className = "" }) {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <g stroke={STROKE} strokeWidth="1.1" strokeLinecap="round">
        <circle cx="100" cy="100" r="12" />
        <circle cx="100" cy="100" r="28" opacity="0.85" />
        <circle cx="100" cy="100" r="48" opacity="0.55" />
        <circle cx="100" cy="100" r="68" opacity="0.35" />
        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => {
          const rad = (deg * Math.PI) / 180;
          const inner = 18;
          const outer = 62;
          return (
            <g key={deg}>
              <line
                x1={100 + Math.cos(rad) * inner}
                y1={100 + Math.sin(rad) * inner}
                x2={100 + Math.cos(rad) * outer}
                y2={100 + Math.sin(rad) * outer}
                opacity="0.7"
              />
              <circle
                cx={100 + Math.cos(rad) * 40}
                cy={100 + Math.sin(rad) * 40}
                r="3.5"
                opacity="0.8"
              />
            </g>
          );
        })}
        <path
          d="M100 52 C112 68 112 88 100 100 C88 88 88 68 100 52 Z"
          opacity="0.65"
        />
        <path
          d="M148 100 C132 112 112 112 100 100 C112 88 132 88 148 100 Z"
          opacity="0.65"
        />
        <path
          d="M100 148 C88 132 88 112 100 100 C112 112 112 132 100 148 Z"
          opacity="0.65"
        />
        <path
          d="M52 100 C68 88 88 88 100 100 C88 112 68 112 52 100 Z"
          opacity="0.65"
        />
      </g>
    </svg>
  );
}

/** Grain / millet sprig — malt / wellness accents */
export function GrainMotif({ className = "" }) {
  return (
    <SvgFrame className={className}>
      <g stroke={STROKE} strokeWidth="1.2" strokeLinecap="round" fill="none">
        <path d="M60 30 C58 90 58 160 60 300" />
        {[50, 75, 100, 125, 150, 175, 200, 225, 250].map((y, i) => {
          const side = i % 2 === 0 ? -1 : 1;
          return (
            <ellipse
              key={y}
              cx={60 + side * 14}
              cy={y}
              rx="7"
              ry="11"
              transform={`rotate(${side * 28} ${60 + side * 14} ${y})`}
              opacity="0.85"
            />
          );
        })}
        <circle cx="60" cy="40" r="3" fill={STROKE} stroke="none" />
      </g>
    </SvgFrame>
  );
}

/** Oil drop + herb swirl — hair care accents */
export function OilDropMotif({ className = "" }) {
  return (
    <SvgFrame className={className}>
      <g stroke={STROKE} strokeWidth="1.25" strokeLinecap="round" fill="none">
        <path d="M60 36 C60 36 88 78 88 108 C88 128 76 140 60 140 C44 140 32 128 32 108 C32 78 60 36 60 36 Z" />
        <path d="M52 88 C56 96 64 96 68 88" opacity="0.7" />
        <path d="M60 160 C40 178 36 210 60 236 C84 210 80 178 60 160 Z" opacity="0.85" />
        <path d="M60 248 C48 260 46 280 60 298 C74 280 72 260 60 248 Z" opacity="0.75" />
        <path d="M78 170 C96 186 98 214 82 232" opacity="0.55" />
        <path d="M42 170 C24 186 22 214 38 232" opacity="0.55" />
      </g>
    </SvgFrame>
  );
}
