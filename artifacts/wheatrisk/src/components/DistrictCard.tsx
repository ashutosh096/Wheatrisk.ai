import { DistrictRisk } from "@workspace/api-client-react";
import { LayerType, getCategoryColor } from "../lib/colorUtils";
import { getBlocksForDistrict } from "../lib/blocksData";
import { getDistrictBlockSummary } from "../lib/blockSampleData";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis,
  LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip,
  ResponsiveContainer, ReferenceLine, Area, AreaChart,
} from "recharts";
import { TrendingUp, ShieldAlert, AlertCircle, X, Info, TriangleAlert } from "lucide-react";

interface DistrictCardProps {
  data: DistrictRisk;
  activeLayer: LayerType;
  onClose?: () => void;
}

export function DistrictCard({ data, activeLayer, onClose }: DistrictCardProps) {

  let displayCategory = "";
  let metricLabel = "";
  let metricValue = "";

  if (activeLayer === "wheat_risk") {
    displayCategory = data.risk.level;
    metricLabel = "Composite CHI";
    metricValue = data.risk.mean_chi.toFixed(1);
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
  const blocks = getBlocksForDistrict(data.district);
  const summary = getDistrictBlockSummary(data.district, blocks, data.risk.mean_chi);

  const radarData = [
    { subject: "Drought",    A: data.risk.dna.drought    },
    { subject: "Tail Risk",  A: data.risk.dna.tail_risk  },
    { subject: "Volatility", A: data.risk.dna.volatility },
    { subject: "Floor",      A: data.risk.dna.floor      },
    { subject: "Premium",    A: data.risk.dna.premium    },
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

  const pctLabel = summary.highVhCount > 0
    ? `${summary.highVhCount} of ${summary.total} blocks (${Math.round((summary.highVhCount / summary.total) * 100)}%) rated High/Very High risk`
    : `All ${summary.total} blocks rated Low or Very Low risk`;

  const worstBlock = summary.worstBlock;
  const tierAbove = worstBlock ? Math.max(0, Math.round(worstBlock.chi - data.risk.mean_chi)) : 0;

  return (
    <div className="flex flex-col rounded-xl overflow-hidden"
      style={{ background: "#fff", border: "1px solid #e8ecf0", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>

      {/* colour bar */}
      <div className="h-1 w-full" style={{ background: categoryColor }} />

      {/* ── Header ── */}
      <div className="px-4 pt-3 pb-3" style={{ borderBottom: "1px solid #f0f3f6" }}>
        <div className="flex items-start justify-between gap-2 mb-0.5">
          <div className="min-w-0">
            <div className="text-[9px] font-bold uppercase tracking-[0.14em] mb-0.5" style={{ color: "#0d9488" }}>
              District View
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none">{data.district}</h2>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
              {data.state} &middot; 1 composite score
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0 mt-0.5">
            <span
              className="text-[10px] font-black uppercase tracking-wide text-white px-2.5 py-1 rounded-full"
              style={{ background: categoryColor }}
            >
              {displayCategory}
            </span>
            {onClose && (
              <button onClick={onClose} className="text-slate-300 hover:text-slate-500 transition-colors">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Composite CHI + Percentile row */}
        <div className="grid grid-cols-2 gap-2 mt-3">
          <div className="rounded-lg px-3 py-2" style={{ background: "#f8fafc", border: "1px solid #f0f3f6" }}>
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
              {metricLabel}
            </div>
            <div className="text-2xl font-black tabular-nums leading-none" style={{ color: categoryColor }}>
              {metricValue}
            </div>
          </div>
          <div className="rounded-lg px-3 py-2" style={{ background: "#f8fafc", border: "1px solid #f0f3f6" }}>
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
              Percentile rank (of 75)
            </div>
            <div className="text-2xl font-black text-slate-800 tabular-nums leading-none">
              {summary.percentileRank}
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-y-auto light-scroll p-3 space-y-3">

        {/* ── IF PRICED ON DISTRICT DATA ALONE ── */}
        <div className="rounded-xl p-3 space-y-2" style={{ background: "#f0f9ff", border: "1px solid #bae6fd" }}>
          <div className="flex items-center gap-1.5">
            <Info className="w-3 h-3 text-sky-500 shrink-0" />
            <span className="text-[9px] font-bold text-sky-600 uppercase tracking-widest">
              If priced on district data alone
            </span>
          </div>
          <p className="text-xs leading-relaxed text-slate-600">{data.recommendation.text}</p>
          <div className="flex gap-2">
            <AdjBadge label="PD" value={data.recommendation.pd_adjustment_pct} suffix="%" light />
            <AdjBadge label="LGD" value={data.recommendation.lgd_adjustment_pct} suffix="%" light />
          </div>
        </div>

        {/* ── WHAT THIS NUMBER HIDES — BLOCK LEVEL ── */}
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #f0f3f6" }}>
          <div className="px-3 py-2" style={{ background: "#f8fafc", borderBottom: "1px solid #f0f3f6" }}>
            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
              What this number hides — Block Level
            </span>
          </div>
          <div className="p-3 bg-white">
            {/* Counts */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div>
                <div className="text-2xl font-black text-slate-800 tabular-nums leading-none">
                  {summary.total}
                </div>
                <div className="text-[10px] text-slate-400 font-semibold mt-0.5">Blocks underneath</div>
              </div>
              <div>
                <div
                  className="text-2xl font-black tabular-nums leading-none"
                  style={{ color: summary.highVhCount > 0 ? "#f97316" : "#10b981" }}
                >
                  {summary.highVhCount}
                </div>
                <div className="text-[10px] text-slate-400 font-semibold mt-0.5">High / Very High blocks</div>
              </div>
            </div>

            {/* Dot plot */}
            <BlockDotPlot
              blocks={summary.blockChiValues}
              districtAvg={summary.districtAvgChi}
              chiMin={summary.chiMin}
              chiMax={summary.chiMax}
            />

            {/* Warning banner */}
            {summary.highVhCount > 0 && worstBlock && (
              <div
                className="flex gap-2 rounded-lg p-2.5 mt-2.5"
                style={{ background: "#fff7ed", border: "1px solid #fed7aa" }}
              >
                <TriangleAlert className="w-3.5 h-3.5 text-orange-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-[10px] font-bold text-orange-700 leading-tight">
                    {pctLabel}
                  </div>
                  <div className="text-[10px] text-slate-500 leading-relaxed mt-0.5">
                    Worst block <strong className="text-slate-700">{worstBlock.block}</strong> carries
                    CHI {worstBlock.chi.toFixed(1)}
                    {tierAbove > 0 && ` — ${tierAbove} pts higher than the district average`}.
                    A loan book concentrated in this block would be under-priced by district-only data.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Risk Metrics 2×2 ── */}
        <Section icon={<ActivityIcon />} label="Risk Metrics">
          <div className="grid grid-cols-2 gap-1.5">
            <MetricTile label="Mean CHI"   value={data.risk.mean_chi.toFixed(2)}    />
            <MetricTile label="P95 Tail"   value={data.risk.p95_tail.toFixed(2)}    />
            <MetricTile label="P5 Floor"   value={data.risk.p5_floor.toFixed(2)}    />
            <MetricTile label="Volatility" value={data.risk.volatility.toFixed(2)}  />
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
              <div className="w-3 h-0.5" style={{ borderTop: "1.5px dashed #cbd5e1" }} />
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
            <AdjBadge label="PD" value={data.recommendation.pd_adjustment_pct} suffix="%" />
            <AdjBadge label="LGD" value={data.recommendation.lgd_adjustment_pct} suffix="%" />
          </div>
        </div>

      </div>
    </div>
  );
}

/* ── Block dot plot ── */
function BlockDotPlot({
  blocks,
  districtAvg,
  chiMin,
  chiMax,
}: {
  blocks: { block: string; chi: number; level: string }[];
  districtAvg: number;
  chiMin: number;
  chiMax: number;
}) {
  const range = Math.max(chiMax - chiMin, 1);
  const pct = (v: number) => ((v - chiMin) / range) * 100;

  const colorForLevel: Record<string, string> = {
    "Very Low": "#14b8a6",
    "Low":      "#06b6d4",
    "Moderate": "#eab308",
    "High":     "#f97316",
    "Very High":"#ef4444",
  };

  return (
    <div className="mt-1">
      <div className="relative h-8 mb-1">
        {/* axis line */}
        <div
          className="absolute top-1/2 left-0 right-0 h-px"
          style={{ background: "#e2e8f0", transform: "translateY(-50%)" }}
        />
        {/* district avg marker */}
        <div
          className="absolute top-0 bottom-0 flex flex-col items-center"
          style={{ left: `${pct(districtAvg)}%`, transform: "translateX(-50%)" }}
        >
          <div className="text-[7px] font-bold text-slate-400 leading-none mb-0.5" style={{ marginTop: -1 }}>
            DIST AVG
          </div>
          <div className="w-px flex-1 bg-slate-300" style={{ borderLeft: "1px dashed #94a3b8" }} />
        </div>
        {/* block dots */}
        {blocks.map((b) => (
          <div
            key={b.block}
            className="absolute w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm"
            style={{
              background: colorForLevel[b.level] ?? "#94a3b8",
              left: `${pct(b.chi)}%`,
              top: "50%",
              transform: "translate(-50%, -50%)",
            }}
            title={`${b.block}: CHI ${b.chi}`}
          />
        ))}
      </div>
      <div className="flex items-center justify-between text-[9px] text-slate-400 font-mono tabular-nums">
        <span>{chiMin.toFixed(1)}</span>
        <span className="text-[8px] italic text-slate-300">Each dot = one block&apos;s mean CHI</span>
        <span>{chiMax.toFixed(1)}</span>
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

function AdjBadge({ label, value, suffix, light }: { label: string; value: number; suffix: string; light?: boolean }) {
  const positive = value > 0;
  return (
    <div
      className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5"
      style={{
        background: light ? "#e0f2f1" : "rgba(255,255,255,0.05)",
        border: light ? "1px solid #b2dfdb" : "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <span className={`text-[9px] font-bold uppercase tracking-wider ${light ? "text-slate-500" : "text-slate-500"}`}>{label}</span>
      <span className={`text-xs font-black ${positive ? "text-red-500" : "text-emerald-600"}`}>
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
