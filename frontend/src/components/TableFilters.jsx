export default function TableFilters({
  filter,
  setFilter,
  search,
  setSearch,
  counts,
  onClearAll,
}) {
  const tabs = [
    { key: "All", label: `All Leads ${counts.all}` },
    { key: "New", label: `New ${counts.new}` },
    { key: "Contacted", label: `Contacted ${counts.contacted}` },
    { key: "Converted", label: `Converted ${counts.converted}` },
  ];

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-50 rounded-lg p-1">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setFilter(t.key)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-md ${filter === t.key ? "bg-blue-600 text-white" : "text-slate-500 hover:bg-white"}`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={onClearAll}
            className="text-xs font-semibold text-red-600 border border-red-200 rounded-md px-2.5 py-1.5 hover:bg-red-50"
          >
            Clear History
          </button>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Scraping 1 Post Active
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search leads by name, title, or comment keyword..."
          className="flex-1 bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-600 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
        <select className="text-xs text-slate-500 border border-slate-200 rounded-md px-2 py-2 bg-white">
          <option>Intent Tier: All</option>
          <option>High Intent</option>
          <option>Medium Intent</option>
        </select>
        <select className="text-xs text-slate-500 border border-slate-200 rounded-md px-2 py-2 bg-white">
          <option>Post: Scale ARR to ...</option>
        </select>
      </div>
    </>
  );
}
