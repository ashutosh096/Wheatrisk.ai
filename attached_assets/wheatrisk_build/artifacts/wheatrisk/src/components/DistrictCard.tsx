import { DistrictRisk } from "@workspace/api-client-react";
import { LayerType, getCategoryColor } from "../lib/colorUtils";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis,
  LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip,
  ResponsiveContainer, ReferenceLine, Area, AreaChart,
} from "recharts";
import { TrendingUp, ShieldAlert, AlertCircle, ChevronRight } from "lucide-react";

export function DistrictCard({ data, activeLayer }: { data: DistrictRisk; activeLayer: LayerType }) {

  let displayCategory = "";
  let metricLabel = "";
  let metricValue = "";

  if (activeLayer === "wheat_risk") {
    displayCategory = data.risk.level;
    metricLabel = "Composite CHI";
    metricValue = data.risk.mean_chi.toFixed(2);
  } else if (activeLayer === "drought_stress") {
    displayCategory = data.rainfall.category;
    metricLabel = "Rainfall Anomaly";
    metricValue = `${data.rainfall.deviation_pct > 0 ? "+" : ""}${data.rainfall.deviation_pct}%`;
  } else if (activeLayer === "heat_stress") {
    displayCategory = data.temperature.category;
    metricLabel = "Temp Anomaly";
    metricValue = `${data.temperature.anomaly_c > 0 ? "+" : ""}${data.temperature.anomaly_c}°C`;
  }

  const categoryColor = getCategoryColor(activeLayer, displayCategory);

  const radarData = [
    { subject: "Drought",    A: data.risk.dna.drought   },
    { subject: "Tail Risk",  A: data.risk.dna.tail_risk },
    { subject: "Volatility", A: data.risk.dna.volatility },
    { subject: "Floor",      A: data.risk.dna.floor     },
    { subject: "Premium",    A: data.risk.dna.premium   },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload?.length) {
      return (
        <div className="bg-white border border-slate-100 rounded-lg px-2.5 py-1.5 shadow-md text-xs">
          <div className="font-semibold text-slate-600 mb-0.5">{label}</div>
          <div style={{ color: categoryColor }} className="font-bold">Actual: {payload[0]?.value?.toFixed(2)}</div>
          {payload[1] && <div className="text-slate-400">Normal: {payload[1]?.value?.toFixed(2)}</div>}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col bg-white rounded-xl overflow-hidden" style={{ border: "1px solid #e8ecf0", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>

      {/* ── Header ── */}
      <div className="relative px-4 pt-4 pb-3" style={{ borderBottom: "1px solid #f0f3f6" }}>
        {/* Top color bar */}
        <div className="absolute top-0 left-0 right-0 h-1 rounded-t-xl" style={{ background: categoryColor }} />

        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight leading-none">{data.district}</h2>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
              {data.state} &middot; {data.season}
            </p>
          </div>
          <div
            className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-white shrink-0 mt-0.5"
            style={{ background: categoryColor }}
          >
            {displayCategory}
          </div>
        </div>

        {/* Primary metric row */}
        <div className="mt-3 flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2"
          style={{ border: "1px solid #f0f3f6" }}>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{metricLabel}</span>
          <span className="text-sm font-black text-slate-900 tabular-nums">{metricValue}</span>
        </div>
      </div>

      <div className="overflow-y-auto light-scroll p-3 space-y-3">

        {/* ── Risk Metrics 2×2 grid ── */}
        <Section icon={<ActivityIcon />} label="Risk Metrics">
          <div className="grid grid-cols-2 gap-1.5">
            <MetricTile label="Mean CHI"  value={data.risk.mean_chi.toFixed(2)}   />
            <MetricTile label="P95 Tail"  value={data.risk.p95_tail.toFixed(2)}   />
            <MetricTile label="P5 Floor"  value={data.risk.p5_floor.toFixed(2)}   />
            <MetricTile label="Volatility" value={data.risk.volatility.toFixed(2)} />
          </div>
        </Section>

        {/* ── Rainfall / Temp quick stats ── */}
        <div className="grid grid-cols-2 gap-1.5">
          <QuickStat
            label="Rainfall"
            actual={`${data.rainfall.actual_mm.toFixed(1)} mm`}
            normal={`${data.rainfall.normal_mm.toFixed(1)} mm`}
            badge={data.rainfall.category}
            badgeColor={getCategoryColor("drought_stress", data.rainfall.category)}
          />
          <QuickStat
            label="Temperature"
            actual={`${data.temperature.actual_c.toFixed(1)}°C`}
            normal={`${data.temperature.normal_c.toFixed(1)}°C`}
            badge={data.temperature.category}
            badgeColor={getCategoryColor("heat_stress", data.temperature.category)}
          />
        </div>

        {/* ── Risk DNA Radar ── */}
        <Section icon={<ShieldAlert className="w-3 h-3" />} label="Risk DNA">
          <div className="h-[148px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="58%" data={radarData}>
                <PolarGrid stroke="#f1f5f9" />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fill: "#64748b", fontSize: 9, fontWeight: 600, fontFamily: "Inter" }}
                />
                <Radar
                  name="District"
                  dataKey="A"
                  stroke={categoryColor}
                  fill={categoryColor}
                  fillOpacity={0.15}
                  strokeWidth={1.5}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Section>

        {/* ── Trajectory ── */}
        <Section icon={<TrendingUp className="w-3 h-3" />} label="Crop Health Trajectory">
          <div className="h-[120px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.trajectory} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
                <defs>
                  <linearGradient id="trajGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={categoryColor} stopOpacity={0.18} />
                    <stop offset="95%" stopColor={categoryColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="stage" tick={{ fontSize: 8, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 8, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                <RechartsTooltip content={<CustomTooltip />} />
                <ReferenceLine y={(data.trajectory[0]?.normal ?? 0)} stroke="#e2e8f0" strokeDasharray="3 3" />
                <Area type="monotone" dataKey="actual" stroke={categoryColor} strokeWidth={2} fill="url(#trajGrad)" dot={{ r: 2.5, fill: categoryColor, strokeWidth: 0 }} activeDot={{ r: 4 }} />
                <Line type="monotone" dataKey="normal" stroke="#cbd5e1" strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-5 mt-1.5 text-[9px] text-slate-400 font-semibold uppercase tracking-wider">
            <div className="flex items-center gap-1">
              <div className="w-3 h-0.5 rounded" style={{ background: categoryColor }} />
              Actual
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-0.5 bg-slate-300" style={{ borderTop: "1.5px dashed #cbd5e1", background: "transparent" }} />
              Normal
            </div>
          </div>
        </Section>

        {/* ── Lender Recommendation ── */}
        <div className="rounded-xl p-3 space-y-2.5" style={{ background: "#0f1e2d", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-1.5">
            <AlertCircle className="w-3 h-3 text-amber-400 shrink-0" />
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Lender Action</span>
          </div>
          <p className="text-xs leading-relaxed text-slate-300">{data.recommendation.text}</p>
          <div className="flex gap-2 pt-0.5">
            <AdjBadge label="PD Adj" value={data.recommendation.pd_adjustment_pct} suffix="%" />
            <AdjBadge label="LGD Adj" value={data.recommendation.lgd_adjustment_pct} suffix="%" />
          </div>
        </div>

      </div>
    </div>
  );
}

/* ── small UI atoms ── */

function Section({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #f0f3f6" }}>
      <div className="flex items-center gap-1.5 px-3 py-2" style={{ background: "#f8fafc", borderBottom: "1px solid #f0f3f6" }}>
        <span className="text-slate-400">{icon}</span>
        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">{label}</span>
      </div>
      <div className="p-2.5 bg-white">{children}</div>
    </div>
  );
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg px-2.5 py-2 flex flex-col items-center justify-center text-center"
      style={{ background: "#f8fafc", border: "1px solid #f0f3f6" }}>
      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{label}</span>
      <span className="text-sm font-black text-slate-800 tabular-nums">{value}</span>
    </div>
  );
}

function QuickStat({
  label, actual, normal, badge, badgeColor,
}: { label: string; actual: string; normal: string; badge: string; badgeColor: string }) {
  return (
    <div className="rounded-lg px-2.5 py-2" style={{ background: "#f8fafc", border: "1px solid #f0f3f6" }}>
      <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">{label}</div>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-black text-slate-800 tabular-nums">{actual}</div>
          <div className="text-[9px] text-slate-400 tabular-nums">nrml {normal}</div>
        </div>
        <div className="text-[9px] font-bold text-white px-1.5 py-0.5 rounded"
          style={{ background: badgeColor }}>
          {badge}
        </div>
      </div>
    </div>
  );
}

function AdjBadge({ label, value, suffix }: { label: string; value: number; suffix: string }) {
  const positive = value > 0;
  return (
    <div className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">{label}</span>
      <span className={`text-xs font-black ${positive ? "text-red-400" : "text-emerald-400"}`}>
        {positive ? "+" : ""}{value}{suffix}
      </span>
    </div>
  );
}

function ActivityIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}
