import { BlockData } from "../lib/blockSampleData";
import { getCategoryColor } from "../lib/colorUtils";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer,
} from "recharts";
import { AlertCircle, X } from "lucide-react";

interface BlockCardProps {
  data: BlockData;
  onClose?: () => void;
}

export function BlockCard({ data, onClose }: BlockCardProps) {
  const cat   = data.risk.level;
  const color = getCategoryColor("wheat_risk", cat);

  const radarData = [
    { subject: "Drought",    A: data.risk.dna.drought    },
    { subject: "Tail Risk",  A: data.risk.dna.tail_risk  },
    { subject: "Volatility", A: data.risk.dna.volatility },
    { subject: "Floor",      A: data.risk.dna.floor      },
    { subject: "Premium",    A: data.risk.dna.premium    },
  ];

  return (
    <div
      className="flex flex-col rounded-xl overflow-hidden"
      style={{ background: "#fff", border: "1px solid #e8ecf0", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}
    >
      {/* colour bar */}
      <div className="h-1 w-full" style={{ background: color }} />

      {/* header */}
      <div className="px-4 pt-3 pb-3" style={{ borderBottom: "1px solid #f0f3f6" }}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div
              className="text-[9px] font-bold uppercase tracking-[0.14em] mb-0.5"
              style={{ color: "#0d9488" }}
            >
              Block
            </div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight leading-tight truncate">
              {data.block}
            </h2>
            <p className="text-[11px] font-semibold text-slate-400 mt-0.5">
              {data.district} District
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0 mt-0.5">
            <span
              className="text-[10px] font-black uppercase tracking-wide text-white px-2.5 py-1 rounded-full"
              style={{ background: color }}
            >
              {cat}
            </span>
            {onClose && (
              <button
                onClick={onClose}
                className="text-slate-300 hover:text-slate-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="p-3 space-y-3 overflow-y-auto light-scroll">

        {/* 4-stat grid */}
        <div className="grid grid-cols-2 gap-1.5">
          <StatTile
            label="Mean CHI"
            value={data.risk.mean_chi.toFixed(1)}
            color={color}
            accent
          />
          <StatTile
            label="P95 Tail"
            value={data.risk.p95_tail.toFixed(1)}
            color="#f97316"
            accent
          />
          <StatTile
            label="P5 Floor"
            value={data.risk.p5_floor.toFixed(1)}
          />
          <StatTile
            label="Volatility"
            value={data.risk.volatility.toFixed(1)}
            color="#8b5cf6"
            accent
          />
        </div>

        {/* Risk DNA Fingerprint */}
        <Section label="Risk DNA Fingerprint">
          <div className="h-[148px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="58%" data={radarData}>
                <PolarGrid stroke="#f1f5f9" />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fill: "#64748b", fontSize: 9, fontWeight: 600, fontFamily: "Inter" }}
                />
                <Radar
                  name="Block"
                  dataKey="A"
                  stroke={color}
                  fill={color}
                  fillOpacity={0.18}
                  strokeWidth={1.8}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Section>

        {/* Recommendation */}
        <div
          className="rounded-xl p-3 space-y-2.5"
          style={{ background: "#f0fdfa", border: "1px solid #ccfbf1" }}
        >
          <div className="flex items-center gap-1.5">
            <AlertCircle className="w-3 h-3 text-teal-500 shrink-0" />
            <span className="text-[9px] font-bold text-teal-600 uppercase tracking-widest">
              Lender Recommendation
            </span>
          </div>
          <p className="text-xs leading-relaxed text-slate-600">
            {data.recommendation.text}
          </p>
          <div className="flex gap-2 pt-0.5">
            <AdjBadge label="PD" value={data.recommendation.pd_adjustment_pct} suffix="%" />
            <AdjBadge label="LGD" value={data.recommendation.lgd_adjustment_pct} suffix="%" />
          </div>
        </div>

      </div>
    </div>
  );
}

/* ── atoms ── */

function StatTile({
  label, value, color, accent,
}: {
  label: string; value: string; color?: string; accent?: boolean;
}) {
  return (
    <div
      className="rounded-lg px-2.5 py-2 flex flex-col"
      style={{ background: "#f8fafc", border: "1px solid #f0f3f6" }}
    >
      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
        {label}
      </span>
      <span
        className="text-lg font-black tabular-nums leading-none"
        style={{ color: accent && color ? color : "#1e293b" }}
      >
        {value}
      </span>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #f0f3f6" }}>
      <div
        className="px-3 py-2 flex items-center"
        style={{ background: "#f8fafc", borderBottom: "1px solid #f0f3f6" }}
      >
        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
          {label}
        </span>
      </div>
      <div className="p-2.5 bg-white">{children}</div>
    </div>
  );
}

function AdjBadge({ label, value, suffix }: { label: string; value: number; suffix: string }) {
  const pos = value > 0;
  return (
    <div
      className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5"
      style={{ background: "#e0f2f1", border: "1px solid #b2dfdb" }}
    >
      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">{label}</span>
      <span className={`text-xs font-black ${pos ? "text-red-500" : "text-emerald-600"}`}>
        {pos ? "+" : ""}
        {value}
        {suffix}
      </span>
    </div>
  );
}
