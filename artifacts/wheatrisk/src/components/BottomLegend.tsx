import { LayerType, LAYER_LABELS, LAYER_THRESHOLDS } from "../lib/colorUtils";
import { RotateCcw } from "lucide-react";

export function BottomLegend({
  activeLayer,
  onResetView,
}: {
  activeLayer: LayerType;
  onResetView: () => void;
}) {
  const thresholds = LAYER_THRESHOLDS[activeLayer];

  return (
    <div
      className="w-full shrink-0 flex items-center justify-between px-4 gap-4"
      style={{
        height: 38,
        background: "#ffffff",
        borderTop: "1px solid #e8ecf0",
      }}
    >
      {/* Left: legend chips */}
      <div className="flex items-center gap-4 min-w-0 overflow-x-auto">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest shrink-0">
          {LAYER_LABELS[activeLayer]}
        </span>

        <div className="flex items-center gap-3">
          {thresholds.map((t) => (
            <div key={t.label} className="flex items-center gap-1.5 shrink-0">
              <div
                className="w-2.5 h-2.5 rounded-[3px]"
                style={{ background: t.color }}
              />
              <span className="text-[10px] font-semibold text-slate-500">{t.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right: source + reset */}
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-[10px] text-slate-400 hidden md:block">
          Normal rainfall 1990–2020 · Source: IMD
        </span>
        <div className="w-px h-4 bg-slate-200 hidden md:block" />
        <button
          onClick={onResetView}
          className="flex items-center gap-1 text-[10px] font-semibold text-slate-500 hover:text-cyan-600 transition-colors group"
        >
          <RotateCcw className="w-3 h-3 group-hover:text-cyan-600 transition-colors" />
          Reset view
        </button>
      </div>
    </div>
  );
}
