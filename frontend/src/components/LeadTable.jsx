import TableFilters from "./TableFilters";

const tierIcon = {
  "High Intent": "🔵",
  "Medium Intent": "🟣",
  "Low Intent": "⚪",
};

const statusStyle = {
  New: "bg-emerald-50 text-emerald-600",
  Contacted: "bg-blue-50 text-blue-600",
  Converted: "bg-emerald-50 text-emerald-600",
};

function timeAgo(date) {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
  if (diff < 60) return `${diff} mins ago`;
  const hrs = Math.floor(diff / 60);
  return `${hrs} hour${hrs > 1 ? "s" : ""} ago`;
}

export default function LeadTable({
  leads,
  filter,
  setFilter,
  search,
  setSearch,
  counts,
  onPushToCrm,
  onDeleteLead,
  onClearAll,
}) {
  return (
    <div className="col-span-2 bg-white rounded-xl border border-slate-200 p-4">
      <TableFilters
        filter={filter}
        setFilter={setFilter}
        search={search}
        setSearch={setSearch}
        counts={counts}
        onClearAll={onClearAll}
      />

      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-slate-400 border-b border-slate-100">
            <th className="pb-2 pl-1 w-8">
              <input type="checkbox" className="rounded" />
            </th>
            <th className="pb-2 font-medium">LEAD PROFILE</th>
            <th className="pb-2 font-medium">INTENT COMMENT SNIPPET</th>
            <th className="pb-2 font-medium">INTENT TAG</th>
            <th className="pb-2 font-medium">STATUS</th>
            <th className="pb-2 font-medium text-right pr-1">ACTIONS</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {leads.length === 0 && (
            <tr>
              <td
                colSpan={6}
                className="py-8 text-center text-slate-400 text-sm"
              >
                No leads match this view yet.
              </td>
            </tr>
          )}
          {leads.map((lead) => (
            <tr key={lead._id}>
              <td className="py-3 pl-1">
                <input type="checkbox" className="rounded" />
              </td>
              <td className="py-3">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full ${lead.avatarColor || "bg-blue-600"} text-white text-xs font-semibold flex items-center justify-center`}
                  >
                    {lead.avatarInitials ||
                      lead.name?.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-800 flex items-center gap-1">
                      {lead.name}{" "}
                      <span className="text-blue-500 text-xs">🔗</span>
                    </div>
                    <div className="text-xs text-slate-400">
                      {lead.title} · {lead.company}
                    </div>
                  </div>
                </div>
              </td>
              <td className="py-3 text-slate-600 max-w-[160px]">
                "{lead.commentSnippet}"
                <div className="text-xs text-slate-400">
                  {timeAgo(lead.commentTimestamp)}
                </div>
              </td>
              <td className="py-3">
                <div className="text-xs font-semibold text-slate-700">
                  {tierIcon[lead.intentTier] || "⚪"} {lead.intentTier} /
                </div>
                <div className="text-xs font-semibold text-slate-700">
                  {lead.intentTag}
                </div>
                <div className="text-xs text-slate-400">
                  ⏱ {lead.matchScore}% Match
                </div>
              </td>
              <td className="py-3">
                <span
                  className={`text-xs font-semibold px-2 py-1 rounded-md ${statusStyle[lead.status]}`}
                >
                  {lead.status}
                  {lead.status === "Converted" ? " (Demo Booked)" : ""}
                </span>
                {lead.status === "Contacted" && lead.contactedBy && (
                  <div className="text-xs text-slate-400 mt-0.5">
                    by {lead.contactedBy}
                  </div>
                )}
              </td>
              <td className="py-3 text-right pr-1">
                <div className="flex items-center justify-end gap-2">
                  {lead.status === "New" ? (
                    <button
                      onClick={() => onPushToCrm(lead)}
                      className="text-xs bg-blue-600 text-white font-semibold px-3 py-1.5 rounded-md hover:bg-blue-700"
                    >
                      Push to CRM
                    </button>
                  ) : (
                    <button className="text-xs text-slate-500 border border-slate-200 font-semibold px-3 py-1.5 rounded-md hover:bg-slate-50">
                      {lead.status === "Converted" ? "View Opp" : "View Thread"}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onDeleteLead(lead)}
                    aria-label={`Delete ${lead.name}`}
                    title="Delete lead"
                    className="text-slate-400 hover:text-red-600 text-lg leading-none px-1"
                  >
                    ✕
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
