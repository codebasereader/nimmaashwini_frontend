export function AdminField({ label, required, error, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-caption font-semibold tracking-[0.14em] text-olive-800 uppercase">
        {label}
        {required && <span className="text-terracotta-500"> *</span>}
      </label>
      {children}
      {error && <p className="text-xs text-terracotta-600">{error}</p>}
    </div>
  );
}

export function AdminInput({ className = "", ...props }) {
  return (
    <input
      className={`focus-ring w-full rounded-md border border-cream-300 bg-white px-3.5 py-2.5 text-body-sm text-brown-900 placeholder:text-brown-400 transition-colors focus:border-olive-500 ${className}`}
      {...props}
    />
  );
}

export function AdminTextarea({ className = "", rows = 4, ...props }) {
  return (
    <textarea
      rows={rows}
      className={`focus-ring w-full resize-y rounded-md border border-cream-300 bg-white px-3.5 py-2.5 text-body-sm text-brown-900 placeholder:text-brown-400 transition-colors focus:border-olive-500 ${className}`}
      {...props}
    />
  );
}

export function AdminSelect({ className = "", children, ...props }) {
  return (
    <select
      className={`focus-ring w-full rounded-md border border-cream-300 bg-white px-3.5 py-2.5 text-body-sm text-brown-900 transition-colors focus:border-olive-500 ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

export function AdminToggle({ checked, onChange, label }) {
  return (
    <label className="flex cursor-pointer items-center gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`focus-ring relative h-6 w-11 rounded-full transition-colors ${
          checked ? "bg-olive-700" : "bg-cream-400"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
      {label ? (
        <span className="text-body-sm text-brown-700">{label}</span>
      ) : null}
    </label>
  );
}
