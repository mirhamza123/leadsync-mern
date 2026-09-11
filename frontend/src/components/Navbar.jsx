import logo from "../assets/leadsync-logo.png";

export default function Navbar() {
  return (
    <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <img
          src={logo}
          alt="LeadSync B2B"
          className="h-10 w-auto object-contain"
        />
        <span className="text-xs bg-blue-50 text-blue-600 font-medium px-2 py-1 rounded-md">
          SaaS v2.4
        </span>
        <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-1 rounded-md">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          Extension Connected · Port 5000
        </span>
      </div>

      <nav className="flex items-center gap-1 text-sm font-medium text-slate-500">
        <button className="bg-blue-600 text-white px-3 py-1.5 rounded-md">
          Lead Feed
        </button>
        <button className="px-3 py-1.5 rounded-md hover:bg-slate-50">
          Campaigns
        </button>
        <button className="px-3 py-1.5 rounded-md hover:bg-slate-50">
          Scraper Rules
        </button>
        <button className="px-3 py-1.5 rounded-md hover:bg-slate-50">
          Analytics
        </button>
        <button className="px-3 py-1.5 rounded-md hover:bg-slate-50">
          Integrations
        </button>
      </nav>

      <div className="flex items-center gap-4">
        <button className="relative w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-50">
          🔔
          <span className="absolute top-1 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
        <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-50">
          ❓
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-orange-300"></div>
          <div className="leading-tight text-left">
            <div className="text-sm font-semibold text-slate-800">
              Sarah Jenkins
            </div>
            <div className="text-xs text-slate-400">Growth Lead</div>
          </div>
          <span className="text-slate-400 text-xs">▾</span>
        </div>
      </div>
    </header>
  );
}
