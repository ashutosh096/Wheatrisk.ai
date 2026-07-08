import { LayerType } from "../lib/colorUtils";
import {
  useListSeasons,
  useListGrowthStages,
  getListSeasonsQueryKey,
  getListGrowthStagesQueryKey,
} from "@workspace/api-client-react";
import { ChevronDown, Search, Layers2, Database } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface FilterSidebarProps {
  season: string;
  setSeason: (val: string) => void;
  growthStage: string;
  setGrowthStage: (val: string) => void;
  activeLayer: LayerType;
  setActiveLayer: (val: LayerType) => void;
}

const LAYER_CONFIG: { id: LayerType; label: string; color: string; dot: string }[] = [
  { id: "wheat_risk",     label: "Wheat Risk Index",       color: "#06b6d4", dot: "#06b6d4" },
  { id: "drought_stress", label: "Drought Stress",         color: "#f97316", dot: "#f97316" },
  { id: "heat_stress",    label: "Heat Stress at Flowering", color: "#ef4444", dot: "#ef4444" },
];

export function FilterSidebar({
  season, setSeason,
  growthStage, setGrowthStage,
  activeLayer, setActiveLayer,
}: FilterSidebarProps) {
  const { data: seasons = [] }     = useListSeasons({ query: { queryKey: getListSeasonsQueryKey() } });
  const { data: growthStages = [] } = useListGrowthStages({ query: { queryKey: getListGrowthStagesQueryKey() } });

  const currentStage = growthStages.find((g) => g.id === growthStage);

  const fallbackSeasons     = ["2023-24", "2024-25", "2025-26"];
  const displaySeasons      = seasons.length > 0 ? seasons : fallbackSeasons;
  const fallbackStages = [
    { id: "sowing",         label: "Sowing",         period: "Oct–Nov" },
    { id: "tillering",      label: "Tillering",      period: "Dec" },
    { id: "stem_extension", label: "Stem Extension", period: "Jan" },
    { id: "flowering",      label: "Flowering",      period: "Feb" },
    { id: "grain_filling",  label: "Grain Filling",  period: "Mar" },
    { id: "harvest",        label: "Harvest",        period: "Apr" },
  ];
  const displayStages = growthStages.length > 0 ? growthStages : fallbackStages;

  return (
    <div
      className="w-[228px] shrink-0 flex flex-col h-full z-10 overflow-y-auto light-scroll"
      style={{ background: "#0e1621", borderRight: "1px solid rgba(255,255,255,0.06)" }}
    >
      {/* ── WHEN ──────────────────────────── */}
      <SectionHeader label="When" />
      <div className="px-3 pb-3 space-y-3">
        <DarkSelect
          label="Season / Year"
          value={season}
          onChange={setSeason}
          options={displaySeasons.map((s) => ({ value: s, label: s }))}
        />
        <DarkSelect
          label="Growth Stage"
          value={growthStage}
          onChange={setGrowthStage}
          options={displayStages.map((g) => ({ value: g.id, label: `${g.label} (${g.period})` }))}
        />

        {/* Reporting period info chip */}
        <div className="rounded-md px-2.5 py-2" style={{ background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.2)" }}>
          <div className="text-[9px] font-bold uppercase tracking-widest text-cyan-500/70 mb-0.5">Reporting Period</div>
          <div className="text-xs font-semibold text-cyan-300">
            {currentStage?.period ?? displayStages.find(g => g.id === growthStage)?.period ?? "Current"}
          </div>
        </div>
      </div>

      <Divider />

      {/* ── WHERE ──────────────────────────── */}
      <SectionHeader label="Where" />
      <div className="px-3 pb-3 space-y-3">
        {/* State — fixed */}
        <div className="space-y-1">
          <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">State</label>
          <div className="h-8 rounded-md px-3 flex items-center text-xs font-medium text-slate-300 select-none"
            style={{ background: "#162030", border: "1px solid rgba(255,255,255,0.07)" }}>
            Uttar Pradesh
          </div>
        </div>

        {/* District search */}
        <div className="space-y-1">
          <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">District (75)</label>
          <div className="relative">
            <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            <input
              className="h-8 w-full rounded-md pl-7 pr-3 text-xs text-slate-300 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500/40"
              style={{ background: "#162030", border: "1px solid rgba(255,255,255,0.07)" }}
              placeholder="All Districts"
              readOnly
            />
          </div>
        </div>
      </div>

      <Divider />

      {/* ── LAYERS ──────────────────────────── */}
      <SectionHeader label="Layers · Choose One" icon={<Layers2 className="w-3 h-3 text-slate-500" />} />
      <div className="px-3 pb-3 space-y-1.5">
        {LAYER_CONFIG.map((layer) => {
          const active = activeLayer === layer.id;
          return (
            <button
              key={layer.id}
              onClick={() => setActiveLayer(layer.id)}
              className="w-full text-left flex items-center gap-2.5 px-2.5 py-2.5 rounded-md text-xs font-medium transition-all duration-150"
              style={{
                background: active ? "rgba(6,182,212,0.12)" : "transparent",
                border: active ? "1px solid rgba(6,182,212,0.3)" : "1px solid transparent",
                color: active ? "#e2e8f0" : "#94a3b8",
              }}
            >
              {/* color swatch */}
              <div className="w-3 h-3 rounded-[3px] shrink-0" style={{ background: layer.color, opacity: active ? 1 : 0.6 }} />
              <span className="leading-tight">{layer.label}</span>
              {active && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      {/* ── Footer ──────────────────────────── */}
      <div className="mt-auto">
        <Divider />
        <div className="px-3 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-slate-600 text-[10px] font-medium">
            <Database className="w-3 h-3" />
            <span>Demo Data</span>
          </div>
          <button className="text-[10px] font-semibold text-cyan-600 hover:text-cyan-400 uppercase tracking-wider transition-colors">
            Connect API →
          </button>
        </div>
      </div>
    </div>
  );
}

/* ────── small helpers ────── */

function SectionHeader({ label, icon }: { label: string; icon?: React.ReactNode }) {
  return (
    <div className="px-3 pt-3 pb-1.5 flex items-center gap-1.5">
      {icon}
      <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-600">{label}</span>
    </div>
  );
}

function Divider() {
  return <div className="mx-3 border-t" style={{ borderColor: "rgba(255,255,255,0.05)" }} />;
}

interface SelectOption { value: string; label: string }

function DarkSelect({ label, value, onChange, options }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: SelectOption[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = options.find((o) => o.value === value);

  return (
    <div className="space-y-1" ref={ref}>
      <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{label}</label>
      <div className="relative">
        <button
          onClick={() => setOpen((p) => !p)}
          className="h-8 w-full rounded-md px-2.5 flex items-center justify-between text-xs font-medium text-slate-200 transition-colors hover:border-cyan-500/30"
          style={{ background: "#162030", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <span className="truncate">{selected?.label ?? value}</span>
          <ChevronDown className={`w-3.5 h-3.5 text-slate-500 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>

        {open && (
          <div
            className="absolute top-full left-0 right-0 mt-1 z-50 rounded-md overflow-hidden shadow-xl py-1"
            style={{ background: "#1a2535", border: "1px solid rgba(255,255,255,0.10)" }}
          >
            {options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className="w-full text-left px-2.5 py-1.5 text-xs transition-colors"
                style={{
                  color: opt.value === value ? "#22d3ee" : "#94a3b8",
                  background: opt.value === value ? "rgba(6,182,212,0.1)" : "transparent",
                }}
                onMouseEnter={(e) => { if (opt.value !== value) (e.target as HTMLElement).style.background = "rgba(255,255,255,0.04)"; }}
                onMouseLeave={(e) => { if (opt.value !== value) (e.target as HTMLElement).style.background = "transparent"; }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
