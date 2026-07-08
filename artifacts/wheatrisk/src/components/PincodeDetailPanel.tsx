import { PincodeData, getPincodeData, getPincodeHistoricalData } from "../lib/pincodeData";
import { LayerType, getCategoryColor } from "../lib/colorUtils";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  Cell, Legend, AreaChart, Area, ComposedChart, Line
} from "recharts";
import { ArrowLeft, ShieldAlert, AlertCircle, FileText, BarChart3, HelpCircle } from "lucide-react";

interface PincodeDetailPanelProps {
  district: string;
  block: string;
  pincode: string;
  onClose: () => void;
}

export function PincodeDetailPanel({ district, block, pincode, onClose }: PincodeDetailPanelProps) {
  const data: PincodeData = getPincodeData(district, block, pincode);
  
  const historicalData = getPincodeHistoricalData(pincode);
  
  // Calculate historical stats
  const temps = historicalData.map(d => d.tempAnomaly);
  const avgTemp = (temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1);
  const peakHeat = Math.max(...temps).toFixed(1);
  const peakHeatYear = historicalData.find(d => d.tempAnomaly === Math.max(...temps))?.year ?? "2024";
  
  const rainDevs = historicalData.map(d => d.rainfallDeviation);
  const worstDroughtDev = Math.min(...rainDevs);
  const worstDroughtYear = historicalData.find(d => d.rainfallDeviation === worstDroughtDev)?.year ?? "2023";
  
  const historicalStats = {
    avgTemp,
    peakHeat,
    peakHeatYear,
    worstDroughtDev,
    worstDroughtYear
  };

  // Radar data
  const seed = parseInt(pincode) || 0;
  const radarData = [
    { subject: "Drought Severity", A: 20 + (seed % 65) },
    { subject: "Tail Risk",        A: 15 + ((seed + 15) % 75) },
    { subject: "Volatility",       A: 10 + ((seed + 30) % 80) },
    { subject: "Low-End Risk",     A: 25 + ((seed + 45) % 55) },
    { subject: "Risk Premium",     A: 30 + ((seed + 60) % 65) },
  ];

  // Bar/Area chart data for villages
  const villageChartData = data.villages.map(v => ({
    name: v.name,
    CHI: v.chi,
    "Area Share (%)": v.areaPct
  }));

  // Determine category color based on weighted mean CHI
  let overallCategory = "Low";
  if (data.weightedMeanChi < 18) overallCategory = "Very Low";
  else if (data.weightedMeanChi < 30) overallCategory = "Low";
  else if (data.weightedMeanChi < 42) overallCategory = "Moderate";
  else if (data.weightedMeanChi < 55) overallCategory = "High";
  else overallCategory = "Very High";

  const themeColor = getCategoryColor("wheat_risk", overallCategory);

  // Custom tooltips
  const CustomBarTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white rounded-lg p-2 shadow-lg text-[11px] font-semibold border border-slate-700">
          <div>{payload[0].payload.name}</div>
          <div className="text-teal-400">CHI: {payload[0].value.toFixed(1)}</div>
          <div className="text-slate-400">Share: {payload[0].payload["Area Share (%)"]}%</div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex-1 min-h-0 overflow-y-auto light-scroll p-6 bg-white block">
      
      {/* ── Top navigation / Back to Map ── */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 shrink-0">
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 text-xs font-bold text-teal-600 hover:text-teal-800 transition-colors uppercase tracking-wider"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to District Map
        </button>
        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
          Granular Pincode View
        </span>
      </div>

      {/* ── Header details matching Image 2 ── */}
      <div className="flex items-start justify-between gap-4 mb-6 shrink-0 bg-teal-50/25 p-4 rounded-xl border border-teal-100/50">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none">
            Pincode {data.pincode}
          </h1>
          <p className="text-xs font-semibold text-slate-500 mt-1.5">
            Block: <strong className="text-slate-700">{data.block}</strong> &middot; District: <strong className="text-slate-700">{data.district}</strong>
          </p>
        </div>
        <div className="flex flex-col items-end shrink-0">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">
            Blended Risk Range
          </span>
          <span
            className="text-xs font-black uppercase tracking-wider text-white px-3.5 py-1.5 rounded-lg shadow-sm"
            style={{ background: themeColor }}
          >
            {data.riskRange}
          </span>
        </div>
      </div>

      {/* ── KPI Row matching Image 2 ── */}
      <div className="grid grid-cols-4 gap-3 mb-6 shrink-0">
        <KpiTile
          label="Weighted Mean CHI"
          value={data.weightedMeanChi.toFixed(1)}
          caption="Area-weighted baseline"
          color={themeColor}
          accent
        />
        <KpiTile
          label="P95 Tail Risk"
          value={data.p95Tail.toFixed(1)}
          caption="Extreme year scenario"
          color="#ef4444"
          accent
        />
        <KpiTile
          label="P5 Lower Bound"
          value={data.p5Floor.toFixed(1)}
          caption="Favourable year"
        />
        <KpiTile
          label="Volatility Spread"
          value={data.spread.toFixed(1)}
          caption="P95 minus P5 range"
          color="#f97316"
          accent
        />
      </div>

      {/* ── Two-column Charts + Recommendations matching Image 2 ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-6">
        
        {/* Left Column: Risk DNA Radar Chart */}
        <div className="lg:col-span-5 flex flex-col rounded-xl overflow-hidden" style={{ border: "1px solid #f0f3f6" }}>
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Risk DNA Fingerprint
            </span>
          </div>
          <div className="p-4 bg-white flex items-center justify-center h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="65%" data={radarData}>
                <PolarGrid stroke="#f1f5f9" />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fill: "#64748b", fontSize: 9, fontWeight: 600, fontFamily: "Inter" }}
                />
                <Radar
                  name="Pincode DNA"
                  dataKey="A"
                  stroke={themeColor}
                  fill={themeColor}
                  fillOpacity={0.16}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Column: HDFC Recommendation Card */}
        <div className="lg:col-span-7 flex flex-col rounded-xl overflow-hidden" style={{ border: "1px solid #f0f3f6" }}>
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              HDFC Branch Recommendation
            </span>
          </div>
          <div className="p-5 flex-1 flex flex-col justify-between bg-white">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4" style={{ color: themeColor }} />
                <span className="text-sm font-black tracking-tight uppercase" style={{ color: themeColor }}>
                  {data.recommendation.title}
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {data.recommendation.text}
              </p>
            </div>

            <div className="flex gap-4 pt-4 border-t border-slate-100 mt-4">
              <AdjustmentBadge label="PD Adjustment" value={data.recommendation.pd_adjustment_pct} suffix="%" />
              <AdjustmentBadge label="LGD Adjustment" value={data.recommendation.lgd_adjustment_pct} suffix="%" />
            </div>
          </div>
        </div>

      </div>

      {/* ── Additional Village Distribution Chart (Live Bar Chart) ── */}
      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #f0f3f6" }}>
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Village Risk & Area Share Distribution
            </span>
          </div>
          <span className="text-[10px] font-semibold text-slate-400">
            Constituent Villages
          </span>
        </div>
        <div className="p-4 bg-white h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={villageChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 10, fontWeight: 500 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomBarTooltip />} cursor={{ fill: "#f8fafc" }} />
              <Bar dataKey="CHI" radius={[4, 4, 0, 0]}>
                {villageChartData.map((entry, index) => {
                  let vColor = "#10b981";
                  if (entry.CHI > 50) vColor = "#ef4444";
                  else if (entry.CHI > 38) vColor = "#f97316";
                  else if (entry.CHI > 24) vColor = "#eab308";
                  return <Cell key={`cell-${index}`} fill={vColor} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── 10-Year Historical Climate Trend (Dual Axis Chart) ── */}
      <div className="rounded-xl overflow-hidden mt-6" style={{ border: "1px solid #f0f3f6" }}>
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              10-Year Historical Climate Trend (2016 – 2026)
            </span>
          </div>
          <span className="text-[10px] font-semibold text-slate-400">
            Time-Series Analysis
          </span>
        </div>
        <div className="p-5 bg-white grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-8 h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={historicalData} margin={{ top: 10, right: -10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRain" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="year" tick={{ fill: "#64748b", fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} />
                {/* Left Y-axis for Rainfall Deviation */}
                <YAxis yAxisId="rain" unit="%" tick={{ fill: "#3b82f6", fontSize: 9, fontWeight: 600 }} axisLine={false} tickLine={false} />
                {/* Right Y-axis for Temp Anomaly */}
                <YAxis yAxisId="temp" orientation="right" unit="°C" tick={{ fill: "#ef4444", fontSize: 9, fontWeight: 600 }} axisLine={false} tickLine={false} />
                <Tooltip
                  content={({ active, payload }: any) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-slate-900 text-white rounded-lg p-2.5 shadow-xl text-[11px] font-semibold border border-slate-700">
                          <div className="mb-1 text-slate-400 font-bold">Year {payload[0].payload.year}</div>
                          <div className="text-blue-400">Rainfall Dev: {payload[0].value}%</div>
                          <div className="text-red-400">Temp Anomaly: +{payload[1].value}°C</div>
                          <div className="text-teal-400 mt-0.5 pt-0.5 border-t border-slate-700">Composite CHI: {payload[0].payload.chi}</div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area yAxisId="rain" type="monotone" dataKey="rainfallDeviation" stroke="#3b82f6" fillOpacity={1} fill="url(#colorRain)" strokeWidth={1.8} name="Rainfall Dev" />
                <Line yAxisId="temp" type="monotone" dataKey="tempAnomaly" stroke="#ef4444" strokeWidth={2.2} dot={{ r: 3 }} name="Temp Anomaly" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="lg:col-span-4 space-y-4">
            <div className="rounded-xl p-3 bg-slate-50 border border-slate-100">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Climate Indicators Overview</h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Avg Temp Anomaly:</span>
                  <strong className="text-slate-800">+{historicalStats.avgTemp}°C</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Worst Drought Year:</span>
                  <strong className="text-red-600">{historicalStats.worstDroughtYear} ({historicalStats.worstDroughtDev}%)</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Peak Heat Anomaly:</span>
                  <strong className="text-red-600">+{historicalStats.peakHeat}°C ({historicalStats.peakHeatYear})</strong>
                </div>
              </div>
            </div>
            <div className="text-[10px] leading-relaxed text-slate-400 font-medium">
              * The historical trend tracks localized crop weather stress indicators since 2016. Spikes in temperature during spring months directly accelerate flowering stage decay.
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

/* ── helper components ── */

function KpiTile({
  label, value, caption, color, accent
}: {
  label: string;
  value: string;
  caption: string;
  color?: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl px-4 py-3 flex flex-col justify-between" style={{ background: "#f8fafc", border: "1px solid #f0f3f6" }}>
      <div>
        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">
          {label}
        </div>
        <div
          className="text-2xl font-black tabular-nums leading-tight"
          style={{ color: accent && color ? color : "#1e293b" }}
        >
          {value}
        </div>
      </div>
      <div className="text-[9px] text-slate-400 font-semibold mt-1">
        {caption}
      </div>
    </div>
  );
}

function AdjustmentBadge({ label, value, suffix }: { label: string; value: number; suffix: string }) {
  const isPos = value > 0;
  return (
    <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
      <span className={`text-xs font-black ${isPos ? "text-red-500" : "text-emerald-600"}`}>
        {isPos ? "+" : ""}
        {value}
        {suffix}
      </span>
    </div>
  );
}
