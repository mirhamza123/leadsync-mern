import { useState } from "react";
import { addKeyword, removeKeyword } from "../services/api";

export default function KeywordTags({ keywords, setKeywords }) {
  const [newTerm, setNewTerm] = useState("");
  const handleAdd = async () => {
    if (!newTerm.trim()) return;
    try {
      const { data } = await addKeyword(newTerm.trim());
      setKeywords((prev) => [...prev, data]);
      setNewTerm("");
    } catch (err) {
      console.error(err);
    }
  };
  const handleRemove = async (id) => {
    try {
      await removeKeyword(id);
      setKeywords((prev) => prev.filter((k) => k._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
          Active Intent Keywords{" "}
          <span className="text-slate-300 text-xs">ⓘ</span>
        </span>
        <button className="text-xs text-blue-600 font-medium">
          Manage Dictionary
        </button>
      </div>
      <p className="text-xs text-slate-500 mb-3">
        Keywords currently triggering automated lead tagging, Slack webhook
        pings, and CRM sync.
      </p>
      <div className="flex flex-wrap gap-2 mb-3">
        {keywords.map((k) => (
          <span
            key={k._id}
            className="bg-blue-50 text-blue-600 text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1"
          >
            {k.term} ({k.matchCount})
            <button
              onClick={() => handleRemove(k._id)}
              className="text-blue-300 hover:text-blue-500"
            >
              ✕
            </button>
          </span>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <input
          value={newTerm}
          onChange={(e) => setNewTerm(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          type="text"
          placeholder="e.g. quote, budget..."
          className="flex-1 text-xs border border-slate-200 rounded-md px-2 py-1.5 text-slate-600 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
        <button
          onClick={handleAdd}
          className="text-xs font-medium text-slate-500 border border-slate-200 px-3 py-1.5 rounded-md whitespace-nowrap hover:bg-slate-50"
        >
          + Add Tag
        </button>
      </div>
    </div>
  );
}
