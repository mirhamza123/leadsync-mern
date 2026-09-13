import { useState } from "react";
import { extractLeads } from "../services/api";

export default function ManualInput({ onLeadCreated }) {
  const [raw, setRaw] = useState("");
  const [enrich, setEnrich] = useState(true);
  const [filterSpam, setFilterSpam] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleExtract = async () => {
    if (!raw.trim()) return;
    setLoading(true);
    setError("");
    try {
      const { data } = await extractLeads(raw);
      if (!data.leads.length) {
        setError("No valid commenter and comment found in the pasted text.");
        return;
      }
      data.leads.forEach((lead) => onLeadCreated?.(lead));
      setRaw("");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not extract this comment. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-blue-600">✨</span>
        <span className="font-semibold text-slate-800 text-sm">
          Quick Manual Input
        </span>
      </div>
      <p className="text-xs text-slate-400 mb-3">
        Chrome extension fallback parser
      </p>
      <p className="text-xs text-slate-500 mb-2">
        Paste raw LinkedIn post comments or API exports if not using the
        automated background session:
      </p>
      <textarea
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        className="w-full text-xs border border-slate-200 rounded-md p-2 h-20 mb-3 text-slate-600 placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-200"
        placeholder="e.g. John Doe: 'Interested in a demo, please send pricing details to my DM...'"
      />
      <label className="flex items-center gap-2 text-xs text-slate-500 mb-2">
        <input
          type="checkbox"
          checked={enrich}
          onChange={() => setEnrich(!enrich)}
          className="rounded"
        />
        Auto-enrich company domain via Clearbit
      </label>
      <label className="flex items-center gap-2 text-xs text-slate-500 mb-3">
        <input
          type="checkbox"
          checked={filterSpam}
          onChange={() => setFilterSpam(!filterSpam)}
          className="rounded"
        />
        Filter spam / bot "CFBR" comments
      </label>
      <button
        onClick={handleExtract}
        disabled={loading}
        className="w-full bg-blue-600 text-white text-sm font-semibold py-2 rounded-md flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-50"
      >
        ⚡ {loading ? "Extracting..." : "Extract Leads Now"}
      </button>
      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
    </div>
  );
}
