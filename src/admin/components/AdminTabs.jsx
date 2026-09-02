/**
 * Simple pill-style tab switcher shared across admin report pages.
 * `tabs`: [{ id, label }]
 */
export default function AdminTabs({ tabs = [], activeId, onChange, className = "" }) {
  return (
    <div
      role="tablist"
      className={`flex flex-wrap gap-2 border-b border-cream-300 pb-3 ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeId;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`focus-ring rounded-sm border px-4 py-2 text-[0.68rem] font-semibold tracking-[0.12em] uppercase transition-colors ${
              isActive
                ? "border-olive-800 bg-olive-800 text-white"
                : "border-cream-300 bg-white text-brown-700 hover:bg-olive-100 hover:text-olive-800"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
