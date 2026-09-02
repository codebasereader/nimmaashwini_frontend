/**
 * Shared Prev/Next pagination footer for admin list/report tables.
 * `pagination`: { page, totalPages, total, hasPrevPage, hasNextPage }
 */
export default function AdminPagination({ pagination, onPrev, onNext, className = "" }) {
  if (!pagination || pagination.totalPages <= 1) return null;

  return (
    <div
      className={`mt-4 flex flex-wrap items-center justify-between gap-3 ${className}`}
    >
      <p className="text-body-sm text-brown-500">
        Page {pagination.page} of {pagination.totalPages}
        <span className="ml-2 text-brown-400">({pagination.total} total)</span>
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={!pagination.hasPrevPage}
          onClick={onPrev}
          className="focus-ring rounded-sm border border-cream-300 bg-white px-3 py-1.5 text-[0.65rem] font-semibold tracking-wider text-olive-800 uppercase transition-colors hover:bg-olive-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Previous
        </button>
        <button
          type="button"
          disabled={!pagination.hasNextPage}
          onClick={onNext}
          className="focus-ring rounded-sm border border-cream-300 bg-white px-3 py-1.5 text-[0.65rem] font-semibold tracking-wider text-olive-800 uppercase transition-colors hover:bg-olive-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}
