import { getRowId } from "../lib/entityId";

export default function AdminDataTable({
  columns,
  rows,
  emptyMessage = "No records found",
  rowKey = (row) => getRowId(row) || JSON.stringify(row),
  onRowClick,
}) {
  if (!rows?.length) {
    return (
      <div className="card flex flex-col items-center justify-center py-16 text-center">
        <p className="text-body-sm text-brown-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-cream-300 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-body-sm">
          <thead className="border-b border-cream-300 bg-cream-100">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-[0.65rem] font-semibold tracking-[0.12em] text-olive-800 uppercase ${
                    col.align === "right" ? "text-right" : ""
                  } ${col.className || ""}`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={`border-b border-cream-200 last:border-b-0 hover:bg-cream-50/80 ${
                  onRowClick ? "cursor-pointer" : ""
                }`}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-4 py-3 text-brown-800 ${
                      col.align === "right" ? "text-right" : ""
                    } ${col.className || ""}`}
                  >
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function StatusPill({ status }) {
  const normalized = String(status || "").toLowerCase();
  const styles =
    normalized === "final" ||
    normalized === "active" ||
    normalized === "confirmed" ||
    normalized === "delivered" ||
    normalized === "completed" ||
    normalized === "paid"
      ? "bg-olive-100 text-olive-800"
      : normalized === "draft" ||
          normalized === "pending" ||
          normalized === "initiated" ||
          normalized === "unpaid"
        ? "bg-amber-100 text-amber-800"
        : normalized === "shipped"
          ? "bg-sky-100 text-sky-800"
          : normalized === "cancelled" || normalized === "failed" || normalized === "inactive"
            ? "bg-terracotta-500/15 text-terracotta-600"
            : "bg-cream-300 text-brown-600";

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-[0.62rem] font-semibold tracking-wider uppercase ${styles}`}
    >
      {status || "—"}
    </span>
  );
}
