import { getBlockData, BlockData } from "../lib/blockSampleData";
import { getCategoryColor } from "../lib/colorUtils";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend
} from "recharts";
import { ArrowLeft, Split, AlertCircle, ShieldAlert, CheckCircle2, ChevronRight } from "lucide-react";

interface ComparePanelProps {
  districtA: string | null;
  blockA: string | null;
  districtB: string | null;
  blockB: string | null;
  onClose: () => void;
}

export function ComparePanel({
  districtA, blockA,
  districtB, blockB,
  onClose
}: ComparePanelProps) {

  const dataA = districtA && blockA ? getBlockData(districtA, blockA) : null;
  const dataB = districtB && blockB ? getBlockData(districtB, blockB) : null;

  // combined radar data
  const radarData = [
    { subject: "Drought",    A: dataA?.risk.dna.drought ?? 0,    B: dataB?.risk.dna.drought ?? 0 },
    { subject: "Tail Risk",  A: dataA?.risk.dna.tail_risk ?? 0,  B: dataB?.risk.dna.tail_risk ?? 0 },
    { subject: "Volatility", A: dataA?.risk.dna.volatility ?? 0, B: dataB?.risk.dna.volatility ?? 0 },
    { subject: "Floor Risk", A: dataA?.risk.dna.floor ?? 0,      B: dataB?.risk.dna.floor ?? 0 },
    { subject: "Premium",    A: dataA?.risk.dna.premium ?? 0,    B: dataB?.risk.dna.premium ?? 0 },
  ];

  const colorA = dataA ? getCategoryColor("wheat_risk", dataA.risk.level) : "#0d9488";
  const colorB = dataB ? getCategoryColor("wheat_risk", dataB.risk.level) : "#06b6d4";

  return (
    <div className="flex-1 min-h-0 overflow-y-auto light-scroll p-6 bg-white block">
      
      {/* Top Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 shrink-0">
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 text-xs font-bold text-teal-600 hover:text-teal-800 transition-colors uppercase tracking-wider"
        >
          <ArrowLeft className="w-4 h-4" />
          Close VS Compare
        </button>
        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
          <Split className="w-3.5 h-3.5 text-teal-500" />
          Side-By-Side Comparison
        </div>
      </div>

      {/* Side by side selections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 shrink-0">
        
        {/* Region A Summary Header */}
        <div className="p-4 rounded-xl border flex flex-col justify-between"
          style={{
            borderColor: dataA ? `${colorA}30` : "#e2e8f0",
            background: dataA ? `${colorA}05` : "#f8fafc",
            borderLeftWidth: "4px",
            borderLeftColor: colorA
          }}
        >
          <div>
            <span className="text-[9px] font-bold text-teal-600 uppercase tracking-widest">Region A</span>
            {dataA ? (
              <>
                <h3 className="text-xl font-black text-slate-900 tracking-tight mt-1">{dataA.block}</h3>
                <p className="text-xs font-semibold text-slate-500">{dataA.district} District</p>
              </>
            ) : (
              <p className="text-sm font-semibold text-slate-400 mt-2">Select a district and block for Region A</p>
            )}
          </div>
          {dataA && (
            <div className="mt-4 flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Risk Level:</span>
              <span className="text-[10px] font-black uppercase text-white px-2 py-0.5 rounded" style={{ background: colorA }}>
                {dataA.risk.level}
              </span>
            </div>
          )}
        </div>

        {/* Region B Summary Header */}
        <div className="p-4 rounded-xl border flex flex-col justify-between"
          style={{
            borderColor: dataB ? `${colorB}30` : "#e2e8f0",
            background: dataB ? `${colorB}05` : "#f8fafc",
            borderLeftWidth: "4px",
            borderLeftColor: colorB
          }}
        >
          <div>
            <span className="text-[9px] font-bold text-cyan-600 uppercase tracking-widest">Region B (VS)</span>
            {dataB ? (
              <>
                <h3 className="text-xl font-black text-slate-900 tracking-tight mt-1">{dataB.block}</h3>
                <p className="text-xs font-semibold text-slate-500">{dataB.district} District</p>
              </>
            ) : (
              <p className="text-sm font-semibold text-slate-400 mt-2">Select a district and block B in the sidebar</p>
            )}
          </div>
          {dataB && (
            <div className="mt-4 flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Risk Level:</span>
              <span className="text-[10px] font-black uppercase text-white px-2 py-0.5 rounded" style={{ background: colorB }}>
                {dataB.risk.level}
              </span>
            </div>
          )}
        </div>

      </div>

      {/* Main Comparison Area */}
      {dataA || dataB ? (
        <div className="space-y-6">
          
          {/* Overlaid Radar Chart Card */}
          <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #f0f3f6" }}>
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Risk DNA Comparison Fingerprint
              </span>
              <span className="text-[9px] text-slate-400 font-semibold">Overlaid Exposure Radar</span>
            </div>
            <div className="p-4 bg-white flex flex-col items-center justify-center min-h-[300px]">
              <div className="flex gap-6 mb-4">
                {dataA && (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: colorA }} />
                    <span className="text-xs font-bold text-slate-700">{dataA.block} (A)</span>
                  </div>
                )}
                {dataB && (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: colorB }} />
                    <span className="text-xs font-bold text-slate-700">{dataB.block} (B)</span>
                  </div>
                )}
              </div>
              
              <div className="w-full max-w-[400px] h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                    <PolarGrid stroke="#f1f5f9" />
                    <PolarAngleAxis
                      dataKey="subject"
                      tick={{ fill: "#64748b", fontSize: 10, fontWeight: 600, fontFamily: "Inter" }}
                    />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 8 }} />
                    {dataA && (
                      <Radar
                        name={dataA.block}
                        dataKey="A"
                        stroke={colorA}
                        fill={colorA}
                        fillOpacity={0.12}
                        strokeWidth={2}
                      />
                    )}
                    {dataB && (
                      <Radar
                        name={dataB.block}
                        dataKey="B"
                        stroke={colorB}
                        fill={colorB}
                        fillOpacity={0.12}
                        strokeWidth={2}
                      />
                    )}
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Metric Comparison Rows */}
          <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #f0f3f6" }}>
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Key Performance Risk Indicators (KPIs)
              </span>
            </div>
            <div className="divide-y divide-slate-100 bg-white">
              
              <KpiCompareRow
                label="Mean Crop Hazard Index (CHI)"
                valA={dataA?.risk.mean_chi}
                valB={dataB?.risk.mean_chi}
                colorA={colorA}
                colorB={colorB}
                desc="Calculated baseline crop failure risk (higher represents higher risk)."
              />

              <KpiCompareRow
                label="P95 Tail Risk"
                valA={dataA?.risk.p95_tail}
                valB={dataB?.risk.p95_tail}
                colorA="#ef4444"
                colorB="#ef4444"
                desc="Extreme heat/drought year risk projection."
              />

              <KpiCompareRow
                label="Volatility Spread"
                valA={dataA?.risk.volatility}
                valB={dataB?.risk.volatility}
                colorA="#f97316"
                colorB="#f97316"
                desc="Difference between extreme bad years and best years."
              />

            </div>
          </div>

          {/* Side by side recommendations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Recommendation A */}
            <div className="rounded-xl p-4 space-y-3 bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4" style={{ color: colorA }} />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  {dataA ? `${dataA.block} Credit Guidance` : "No Region A"}
                </span>
              </div>
              {dataA ? (
                <>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {dataA.recommendation.text}
                  </p>
                  <div className="flex gap-2 pt-2">
                    <AdjBadge label="PD adjustment" value={dataA.recommendation.pd_adjustment_pct} suffix="%" />
                    <AdjBadge label="LGD adjustment" value={dataA.recommendation.lgd_adjustment_pct} suffix="%" />
                  </div>
                </>
              ) : (
                <p className="text-xs text-slate-400">Please select Region A filters</p>
              )}
            </div>

            {/* Recommendation B */}
            <div className="rounded-xl p-4 space-y-3 bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4" style={{ color: colorB }} />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  {dataB ? `${dataB.block} Credit Guidance` : "No Region B"}
                </span>
              </div>
              {dataB ? (
                <>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {dataB.recommendation.text}
                  </p>
                  <div className="flex gap-2 pt-2">
                    <AdjBadge label="PD adjustment" value={dataB.recommendation.pd_adjustment_pct} suffix="%" />
                    <AdjBadge label="LGD adjustment" value={dataB.recommendation.lgd_adjustment_pct} suffix="%" />
                  </div>
                </>
              ) : (
                <p className="text-xs text-slate-400">Please select Region B filters</p>
              )}
            </div>

          </div>

        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-300 gap-2 p-12">
          <Split className="w-8 h-8" />
          <span className="text-xs font-medium text-slate-400">Select Districts and Blocks in the sidebar to compare</span>
        </div>
      )}

    </div>
  );
}

/* ── sub helpers ── */

function KpiCompareRow({
  label, valA, valB, colorA, colorB, desc
}: {
  label: string;
  valA?: number;
  valB?: number;
  colorA: string;
  colorB: string;
  desc: string;
}) {
  return (
    <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="max-w-md">
        <h4 className="text-xs font-bold text-slate-800">{label}</h4>
        <p className="text-[10px] text-slate-400 font-medium mt-0.5">{desc}</p>
      </div>
      <div className="flex items-center gap-8 text-right shrink-0">
        <div className="w-20">
          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">A</div>
          <div className="text-lg font-black tabular-nums" style={{ color: valA ? colorA : "#cbd5e1" }}>
            {valA !== undefined ? valA.toFixed(1) : "—"}
          </div>
        </div>
        <div className="w-20">
          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">B</div>
          <div className="text-lg font-black tabular-nums" style={{ color: valB ? colorB : "#cbd5e1" }}>
            {valB !== undefined ? valB.toFixed(1) : "—"}
          </div>
        </div>
      </div>
    </div>
  );
}

function AdjBadge({ label, value, suffix }: { label: string; value: number; suffix: string }) {
  const isPos = value > 0;
  return (
    <div className="flex items-center gap-1.5 rounded px-2 py-1 bg-white border border-slate-200">
      <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">{label}</span>
      <span className={`text-[10px] font-black ${isPos ? "text-red-500" : "text-emerald-600"}`}>
        {isPos ? "+" : ""}
        {value}
        {suffix}
      </span>
    </div>
  );
}
