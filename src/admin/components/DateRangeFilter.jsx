import { CalendarRange } from "lucide-react";
import { iconProps } from "../../lib/icons";

/**
 * Start / end date filter used on Insights sections.
 */
export default function DateRangeFilter({
  fromDate,
  toDate,
  onFromChange,
  onToChange,
  onApply,
  applying = false,
  className = "",
}) {
  const invalid = Boolean(fromDate && toDate && fromDate > toDate);

  return (
    <div
      className={`flex flex-wrap items-center gap-2 ${className}`}
    >
      <div className="flex items-center gap-2 rounded-md border border-cream-300 bg-white px-2.5 py-1.5">
        <CalendarRange
          {...iconProps(16)}
          className="shrink-0 text-brown-400"
        />
        <input
          type="date"
          value={fromDate}
          onChange={(e) => onFromChange(e.target.value)}
          className="focus-ring border-0 bg-transparent py-1 text-body-sm text-brown-800 outline-none"
          aria-label="Start date"
        />
        <span className="text-caption text-brown-400">→</span>
        <input
          type="date"
          value={toDate}
          min={fromDate || undefined}
          onChange={(e) => onToChange(e.target.value)}
          className="focus-ring border-0 bg-transparent py-1 text-body-sm text-brown-800 outline-none"
          aria-label="End date"
        />
      </div>
      {onApply && (
        <button
          type="button"
          onClick={onApply}
          disabled={applying || invalid || !fromDate || !toDate}
          className="btn btn-secondary px-3 py-2 text-[0.62rem]"
        >
          {applying ? "Loading..." : "Apply"}
        </button>
      )}
      {invalid && (
        <p className="text-xs text-terracotta-600">
          Start date must be before end date
        </p>
      )}
    </div>
  );
}

export function defaultMonthRange(reference = new Date()) {
  const year = reference.getFullYear();
  const month = reference.getMonth();
  const from = new Date(year, month, 1);
  const to = new Date(year, month + 1, 0);
  return {
    fromDate: toISODate(from),
    toDate: toISODate(to),
  };
}

export function lastNDaysRange(days = 7, reference = new Date()) {
  const to = new Date(reference);
  const from = new Date(reference);
  from.setDate(from.getDate() - (days - 1));
  return {
    fromDate: toISODate(from),
    toDate: toISODate(to),
  };
}

function toISODate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
