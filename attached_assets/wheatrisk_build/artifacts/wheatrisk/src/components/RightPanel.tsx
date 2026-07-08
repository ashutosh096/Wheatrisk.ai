import {
  useGetDistribution,
  getGetDistributionQueryKey,
  useFetchDistrictDetail,
  getFetchDistrictDetailQueryKey,
} from "@workspace/api-client-react";
import { LayerType, getCategoryColor } from "../lib/colorUtils";
import { DistrictCard } from "./DistrictCard";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { Loader2, MapPin } from "lucide-react";

interface RightPanelProps {
  season: string;
  growthStage: string;
  activeLayer: LayerType;
  selectedDistrict: string | null;
}

export function RightPanel({ season, growthStage, activeLayer, selectedDistrict }: RightPanelProps) {
  const distributionParams = { season, growth_stage: growthStage, layer: activeLayer as any };
  const { data: stats, isLoading: loadingStats } = useGetDistribution(
    distributionParams,
    { query: { queryKey: getGetDistributionQueryKey(distributionParams) } }
  );

  const detailParams = { district: selectedDistrict ?? "", season, growth_stage: growthStage };
  const { data: districtDetail, isLoading: loadingDetail } = useFetchDistrictDetail(
    detailParams,
    { query: { enabled: !!selectedDistrict, queryKey: getFetchDistrictDetailQueryKey(detailParams) } }
  );

  return (
    <div className="w-[320px] shrink-0 flex flex-col h-full z-10 overflow-y-auto light-scroll bg-white"
      style={{ borderLeft: "1px solid #e8ecf0" }}>

      {/* ── Summary stat cards ── */}
      <div className="grid grid-cols-2 gap-px shrink-0" style={{ background: "#e8ecf0" }}>
        <StatCard
          label="Low / Very Low"
          value={stats?.favorable_count ?? 0}
          suffix="districts"
          caption="favourable"
          accentColor="#06b6d4"
          loading={loadingStats}
        />
        <StatCard
          label="High / Very High"
          value={stats?.elevated_count ?? 0}
          suffix="districts"
          caption="elevated risk"
          accentColor="#f97316"
          loading={loadingStats}
        />
      </div>

      {/* ── Distribution chart ── */}
      <div className="px-4 py-3 shrink-0" style={{ borderBottom: "1px solid #f0f3f6" }}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Distribution
          </span>
          <span className="text-[10px] font-semibold text-slate-400 tabular-nums">
            {stats?.total_districts ?? 0}&nbsp;of&nbsp;75&nbsp;districts
          </span>
        </div>

        {loadingStats ? (
          <div className="h-36 flex items-center justify-center">
            <Loader2 className="w-5 h-5 text-slate-200 animate-spin" />
          </div>
        ) : (
          <div className="flex items-center gap-4">
            {/* Donut */}
            <div className="relative w-[88px] h-[88px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats?.distribution ?? []}
                    cx="50%"
                    cy="50%"
                    innerRadius={28}
                    outerRadius={42}
                    paddingAngle={2}
                    dataKey="count"
                    stroke="none"
                    startAngle={90}
                    endAngle={-270}
                  >
                    {(stats?.distribution ?? []).map((entry: any, i: number) => (
                      <Cell key={i} fill={getCategoryColor(activeLayer, entry.category)} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 8px 24px -4px rgba(0,0,0,0.15)", fontSize: 11, padding: "6px 10px" }}
                    itemStyle={{ color: "#1e293b", fontWeight: 600 }}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Center label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider leading-none">Total</span>
                <span className="text-base font-black text-slate-800 leading-none mt-0.5">{stats?.total_districts ?? 0}</span>
              </div>
            </div>

            {/* Legend rows */}
            <div className="flex-1 space-y-1">
              {(stats?.distribution ?? []).map((entry: any) => (
                <div key={entry.category} className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className="w-2 h-2 rounded-sm shrink-0" style={{ background: getCategoryColor(activeLayer, entry.category) }} />
                    <span className="text-[11px] text-slate-600 truncate font-medium">{entry.category}</span>
                  </div>
                  <div className="text-[11px] font-bold text-slate-800 tabular-nums shrink-0">
                    {entry.count}&nbsp;<span className="text-slate-400 font-normal">({entry.percentage.toFixed(0)}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── District detail ── */}
      <div className="flex-1 min-h-0" style={{ background: "#f8fafc" }}>
        {selectedDistrict ? (
          loadingDetail ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-2">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="text-xs font-medium text-slate-400">Loading district intel…</span>
            </div>
          ) : (
            districtDetail && (
              <div className="p-3 h-full overflow-y-auto light-scroll">
                <DistrictCard data={districtDetail} activeLayer={activeLayer} />
              </div>
            )
          )
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
}

/* ────── helpers ────── */

function StatCard({
  label, value, suffix, caption, accentColor, loading,
}: {
  label: string; value: number; suffix: string; caption: string; accentColor: string; loading: boolean;
}) {
  return (
    <div className="relative bg-white px-3 pt-3 pb-2.5 overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-[3px]" style={{ background: accentColor }} />
      <div className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: accentColor }}>
        {label}
      </div>
      {loading ? (
        <div className="h-7 w-8 bg-slate-100 rounded animate-pulse" />
      ) : (
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-black text-slate-900 leading-none tabular-nums">{value}</span>
          <span className="text-[10px] text-slate-400 font-semibold">{suffix}</span>
        </div>
      )}
      <div className="text-[10px] font-semibold mt-1" style={{ color: accentColor }}>{caption}</div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="h-full flex flex-col items-center justify-center px-6 text-center">
      <div className="w-11 h-11 rounded-full flex items-center justify-center mb-3"
        style={{ background: "#f1f5f9" }}>
        <MapPin className="w-5 h-5 text-slate-300" />
      </div>
      <p className="text-sm font-bold text-slate-600 mb-1">No District Selected</p>
      <p className="text-xs text-slate-400 leading-relaxed">
        Click any district on the map to view detailed risk analytics and lender recommendations.
      </p>
    </div>
  );
}
