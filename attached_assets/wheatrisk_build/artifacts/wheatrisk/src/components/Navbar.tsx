import { Activity, Wifi } from "lucide-react";

export function Navbar() {
  const now = new Date();
  const weekNum = Math.ceil(now.getDate() / 7);
  const monthStr = now.toLocaleString("en-IN", { month: "short" });
  const year = now.getFullYear();

  return (
    <div className="w-full h-11 shrink-0 z-50 flex items-center justify-between px-4"
      style={{ background: "linear-gradient(90deg, #0B1724 0%, #0D2137 60%, #0B1D30 100%)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>

      {/* ── Brand ── */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #0e7490 0%, #0891b2 100%)" }}>
            <Activity className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-bold text-sm tracking-tight">WheatRisk<span className="text-cyan-400">.ai</span></span>
        </div>

        <div className="h-4 w-px bg-white/10" />

        <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 hidden sm:block">
          Uttar Pradesh &nbsp;·&nbsp; Wheat (Rabi) &nbsp;·&nbsp; 2015–2024 Baseline
        </div>
      </div>

      {/* ── Right side ── */}
      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-1.5 text-slate-400 text-[10px] font-semibold uppercase tracking-widest">
          <span>Rabi Season</span>
          <span className="text-slate-600">·</span>
          <span>Reporting Week&nbsp;{weekNum}&nbsp;·&nbsp;{monthStr}&nbsp;{year}</span>
        </div>

        <div className="h-4 w-px bg-white/10 hidden md:block" />

        <div className="text-[10px] text-slate-500 hidden lg:block font-medium">
          powered by&nbsp;<span className="text-slate-400">ClimAgro Analytics</span>
        </div>

        <div className="flex items-center gap-1 bg-red-500/15 border border-red-500/30 px-2.5 py-1 rounded-full">
          <Wifi className="w-2.5 h-2.5 text-red-400 animate-pulse" />
          <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Live Demo</span>
        </div>
      </div>
    </div>
  );
}
