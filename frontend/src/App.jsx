import { useEffect, useMemo, useState } from "react";
import Navbar from "./components/Navbar";
import HeaderActions from "./components/HeaderActions";
import MetricCards from "./components/MetricCards";
import LeadTable from "./components/LeadTable";
import ManualInput from "./components/ManualInput";
import KeywordTags from "./components/KeywordTags";
import {
  clearAllLeads,
  deleteLead,
  getKeywords,
  getLeads,
  getStats,
  updateLead,
} from "./services/api";

export default function App() {
  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState(null);
  const [keywords, setKeywords] = useState([]);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const loadAll = async () => {
    try {
      const [leadsRes, statsRes, keywordsRes] = await Promise.all([
        getLeads({}),
        getStats(),
        getKeywords(),
      ]);
      setLeads(leadsRes.data);
      setStats(statsRes.data);
      setKeywords(keywordsRes.data);
    } catch (err) {
      console.error("Failed to load dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // Auto-refresh every 30s to match "Auto-Refresh: ON (30s)" badge
    const interval = setInterval(loadAll, 30000);
    return () => clearInterval(interval);
  }, []);

  const handlePushToCrm = async (lead) => {
    try {
      const { data } = await updateLead(lead._id, {
        status: "Contacted",
        contactedBy: "Sarah",
        contactedAt: new Date(),
      });
      setLeads((prev) => prev.map((l) => (l._id === data._id ? data : l)));
    } catch (err) {
      console.error(err);
    }
  };

  const handleLeadCreated = (lead) => {
    setLeads((prev) => [lead, ...prev]);
  };

  const handleDeleteLead = async (lead) => {
    try {
      await deleteLead(lead._id);
      setLeads((prev) => prev.filter((item) => item._id !== lead._id));
      const { data } = await getStats();
      setStats(data);
    } catch (err) {
      console.error("Failed to delete lead", err);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm("Are you sure you want to delete all leads?")) return;

    try {
      await clearAllLeads();
      setLeads([]);
      setStats({
        totalScanned: 0,
        qualified: 0,
        qualificationRate: 0,
        contacted: 0,
        outreachRate: 0,
        converted: 0,
        pipelineValue: 0,
        avgDealSize: 0,
      });
    } catch (err) {
      console.error("Failed to clear leads", err);
    }
  };

  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      const matchesFilter = filter === "All" || l.status === filter;
      const matchesSearch =
        !search ||
        l.name?.toLowerCase().includes(search.toLowerCase()) ||
        l.title?.toLowerCase().includes(search.toLowerCase()) ||
        l.commentSnippet?.toLowerCase().includes(search.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [leads, filter, search]);

  const counts = useMemo(
    () => ({
      all: leads.length,
      new: leads.filter((l) => l.status === "New").length,
      contacted: leads.filter((l) => l.status === "Contacted").length,
      converted: leads.filter((l) => l.status === "Converted").length,
    }),
    [leads],
  );

  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar />

      <div className="px-6 pt-5 pb-4">
        <div className="text-xs text-slate-400 mb-2">
          Workspaces &nbsp;›&nbsp; Q3 Outbound Growth &nbsp;›&nbsp; Post
          Analysis
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              LinkedIn Lead Intent Dashboard
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Real-time AI comment extraction, sentiment scoring, and lead
              qualification
            </p>
          </div>
          <HeaderActions />
        </div>
      </div>

      {loading ? (
        <div className="px-6 py-10 text-slate-400 text-sm">
          Loading dashboard...
        </div>
      ) : (
        <>
          <MetricCards stats={stats} />

          <div className="px-6 grid grid-cols-3 gap-4 pb-8">
            <LeadTable
              leads={filteredLeads}
              filter={filter}
              setFilter={setFilter}
              search={search}
              setSearch={setSearch}
              counts={counts}
              onPushToCrm={handlePushToCrm}
              onDeleteLead={handleDeleteLead}
              onClearAll={handleClearAll}
            />

            <div className="flex flex-col gap-4">
              <ManualInput onLeadCreated={handleLeadCreated} />
              <KeywordTags keywords={keywords} setKeywords={setKeywords} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
