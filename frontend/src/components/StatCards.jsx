export default function StatCards({ stats }) {
  if (!stats) return null;

  const cards = [
    {
      label: "Total Scanned Comments",
      icon: "💬",
      value: stats.totalScanned.toLocaleString(),
      sub: `↑ vs last post`,
      subColor: "text-emerald-600",
    },
    {
      label: "Qualified Intent Leads",
      icon: "🎯",
      value: stats.qualified,
      sub: `${stats.qualificationRate}% qualification rate`,
      subColor: "text-blue-600",
    },
    {
      label: "Contacted Leads",
      icon: "✉️",
      value: stats.contacted,
      sub: `${stats.outreachRate}% outreach rate (24h SLA)`,
      subColor: "text-emerald-600",
    },
    {
      label: "Converted Deals",
      icon: "💰",
      value: (
        <>
          {stats.converted}{" "}
          <span className="text-emerald-600 text-sm font-semibold">
            (${stats.pipelineValue.toLocaleString()} Pipeline)
          </span>
        </>
      ),
      sub: `↗ Avg Deal Size $${stats.avgDealSize.toLocaleString()}`,
      subColor: "text-slate-500",
    },
  ];

  return (
    <div className="px-6 grid grid-cols-4 gap-4 mb-4">
      {cards.map((c) => (
        <div key={c.label} className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-start justify-between">
            <span className="text-xs text-slate-500 font-medium">{c.label}</span>
            <span className="text-slate-300">{c.icon}</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{c.value}</div>
          <div className={`text-xs font-medium mt-1 ${c.subColor}`}>{c.sub}</div>
        </div>
      ))}
    </div>
  );
}
