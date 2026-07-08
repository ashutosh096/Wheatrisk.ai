import { PincodeData, getPincodeData } from "../lib/pincodeData";
import { getCategoryColor } from "../lib/colorUtils";
import { Info, X, ShieldAlert, AlertTriangle, AlertCircle } from "lucide-react";

interface PincodeCardProps {
  district: string;
  block: string;
  pincode: string;
  onClose: () => void;
}

export function PincodeCard({ district, block, pincode, onClose }: PincodeCardProps) {
  const data: PincodeData = getPincodeData(district, block, pincode);

  // Determine category color based on weighted mean CHI
  let overallCategory = "Low";
  if (data.weightedMeanChi < 18) overallCategory = "Very Low";
  else if (data.weightedMeanChi < 30) overallCategory = "Low";
  else if (data.weightedMeanChi < 42) overallCategory = "Moderate";
  else if (data.weightedMeanChi < 55) overallCategory = "High";
  else overallCategory = "Very High";

  const themeColor = getCategoryColor("wheat_risk", overallCategory);

  return (
    <div className="flex flex-col rounded-xl overflow-hidden h-full"
      style={{ background: "#fff", border: "1px solid #e8ecf0", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
      
      {/* color bar */}
      <div className="h-1 w-full" style={{ background: themeColor }} />

      {/* Header */}
      <div className="px-4 pt-3 pb-3 border-b border-slate-100 shrink-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[9px] font-bold uppercase tracking-[0.14em] mb-0.5" style={{ color: "#0d9488" }}>
              Pincode View
            </div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight leading-none">
              Pincode {data.pincode}
            </h2>
            <p className="text-[10px] font-semibold text-slate-400 mt-1">
              Blends <strong className="text-slate-600">{data.villages.length} villages</strong> across {data.block} block, {data.district} district
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
            <span
              className="text-[9px] font-black uppercase tracking-wide text-white px-2 py-1 rounded"
              style={{ background: themeColor }}
            >
              {data.riskRange}
            </span>
            <button onClick={onClose} className="text-slate-300 hover:text-slate-500 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto light-scroll p-3 space-y-3">
        
        {/* Confidence Card Alert matching Image 1 */}
        <div className="rounded-xl p-3 space-y-1.5" style={{ background: "#f0f9ff", border: "1px solid #bae6fd" }}>
          <div className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-sky-500 shrink-0" />
            <span className="text-[9px] font-bold text-sky-600 uppercase tracking-widest">
              {data.confidence}
            </span>
          </div>
          <p className="text-[11px] leading-relaxed text-sky-700">
            Medium confidence blend — risk varies sharply between the constituent villages. Weighted mean may understate tail exposure.
          </p>
        </div>

        {/* 4-KPI Grid matching Image 1 */}
        <div className="grid grid-cols-2 gap-2">
          <KpiTile
            label="Weighted Mean CHI"
            value={data.weightedMeanChi.toFixed(1)}
            caption="Area-weighted, constituent villages"
          />
          <KpiTile
            label="P95 Tail Risk"
            value={data.p95Tail.toFixed(1)}
            caption={`Driven by ${data.villages[0]?.name}`}
            color="#ef4444"
          />
          <KpiTile
            label="P5 Lower Bound"
            value={data.p5Floor.toFixed(1)}
            caption="Favourable year, best village"
          />
          <KpiTile
            label="Spread across villages"
            value={data.spread.toFixed(1)}
            caption="P95 minus P5"
            color="#f97316"
          />
        </div>

        {/* Constituent Villages List matching Image 1 */}
        <div className="rounded-xl border border-slate-100 overflow-hidden">
          <div className="px-3 py-2 bg-slate-50 border-b border-slate-100">
            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
              Constituent villages
            </span>
          </div>
          <div className="divide-y divide-slate-100 bg-white">
            {data.villages.map((v) => {
              const vColor = getCategoryColor("wheat_risk", v.level);
              return (
                <div key={v.name} className="px-3 py-2 flex items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-bold text-slate-800">{v.name}</div>
                    <div className="text-[9px] text-slate-400 font-semibold mt-0.5">
                      {v.block} block &middot; {v.areaPct}% of pincode area
                    </div>
                  </div>
                  <span
                    className="text-[9px] font-extrabold px-2 py-0.5 rounded shrink-0"
                    style={{ background: `${vColor}15`, color: vColor, border: `1px solid ${vColor}25` }}
                  >
                    {v.level} - CHI {v.chi.toFixed(1)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* HDFC Recommendation Box matching Image 1 */}
        <div className="rounded-xl p-3 space-y-2" style={{ background: "#fffbeb", border: "1px solid #fde68a" }}>
          <div className="flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="text-[9px] font-bold text-amber-700 uppercase tracking-widest">
              HDFC BRANCH RECOMMENDATION
            </span>
          </div>
          <div>
            <h4 className="text-xs font-bold text-amber-800 leading-tight">
              {data.recommendation.title}
            </h4>
            <p className="text-[11px] leading-relaxed text-amber-700 mt-1">
              {data.recommendation.text}
            </p>
          </div>
          <div className="flex gap-2 pt-1">
            <AdjBadge label="PD adjustment" value={data.recommendation.pd_adjustment_pct} suffix="%" />
            <AdjBadge label="LGD adjustment" value={data.recommendation.lgd_adjustment_pct} suffix="%" />
          </div>
        </div>

      </div>

    </div>
  );
}

/* ── micro helper elements ── */

function KpiTile({ label, value, caption, color }: { label: string; value: string; caption: string; color?: string }) {
  return (
    <div className="rounded-lg p-2.5 flex flex-col justify-between" style={{ background: "#f8fafc", border: "1px solid #f0f3f6" }}>
      <div>
        <div className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{label}</div>
        <div className="text-lg font-black leading-none tabular-nums" style={{ color: color ?? "#1e293b" }}>{value}</div>
      </div>
      <div className="text-[8px] text-slate-400 font-semibold mt-1 leading-normal">{caption}</div>
    </div>
  );
}

function AdjBadge({ label, value, suffix }: { label: string; value: number; suffix: string }) {
  const isPos = value > 0;
  return (
    <div className="flex items-center gap-1.5 rounded px-2 py-1 bg-white border border-amber-200">
      <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">{label}</span>
      <span className={`text-[10px] font-black ${isPos ? "text-amber-600" : "text-emerald-600"}`}>
        {isPos ? "+" : ""}
        {value}
        {suffix}
      </span>
    </div>
  );
}
