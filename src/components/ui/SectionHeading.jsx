import LeafMark from "../icons/LeafMark";

export default function SectionHeading({
  label,
  title,
  className = "",
  titleClassName = "",
  centered = false,
}) {
  return (
    <div className={className}>
      <p
        className={`section-label mb-4 flex items-center gap-2 sm:mb-5 ${
          centered ? "justify-center" : ""
        }`}
      >
        <span className="text-olive-700" aria-hidden="true">
          »
        </span>
        <span>{label}</span>
        <LeafMark />
      </p>
      <h2
        className={`text-display-sm sm:text-display-md max-w-xl text-balance text-brown-900 ${
          centered ? "mx-auto text-center" : ""
        } ${titleClassName}`}
      >
        {title}
      </h2>
    </div>
  );
}
