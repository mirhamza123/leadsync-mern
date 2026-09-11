export default function HeaderActions() {
  return (
    <div className="flex items-center gap-3">
      <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
        Auto-Refresh: ON (30s)
      </span>
      <button className="text-xs font-medium text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-md flex items-center gap-1.5 hover:bg-slate-50">
        🔄 Sync with HubSpot
      </button>
      <button className="text-xs font-medium text-white bg-blue-600 px-3 py-1.5 rounded-md flex items-center gap-1.5 hover:bg-blue-700">
        ⬇ Export All to CSV
      </button>
    </div>
  );
}
