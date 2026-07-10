import { useRef, useEffect, useState, useCallback } from "react";
import { LayerType } from "../lib/colorUtils";
import { ALL_UP_DISTRICTS, getBlocksForDistrict } from "../lib/blocksData";
import { Layers2, Database, X, ChevronDown, Check } from "lucide-react";
import { getPincodesForBlock } from "../lib/pincodeData";

/* ─────────────────────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────────────────────── */
interface FilterSidebarProps {
  year: string;
  setYear: (v: string) => void;
  month: number;
  setMonth: (v: number) => void;
  week: number;
  setWeek: (v: number) => void;
  growthStage: string;
  setGrowthStage: (val: string) => void;
  activeLayer: LayerType;
  setActiveLayer: (val: LayerType) => void;
  selectedDistrict: string | null;
  onSelectDistrict: (d: string | null) => void;
  selectedBlock: string | null;
  onSelectBlock: (b: string | null) => void;
  selectedPincode: string | null;
  onSelectPincode: (p: string | null) => void;

  isCompareMode?: boolean;
  selectedDistrictB?: string | null;
  onSelectDistrictB?: (d: string | null) => void;
  selectedBlockB?: string | null;
  onSelectBlockB?: (b: string | null) => void;
}

/* ─────────────────────────────────────────────────────────────────────────────
   STATIC DATA
───────────────────────────────────────────────────────────────────────────── */
const YEARS  = Array.from({ length: 11 }, (_, i) => String(2016 + i));
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MONTH_FULL = ["January","February","March","April","May","June","July","August","September","October","November","December"];

const LAYER_CONFIG: { id: LayerType; label: string; color: string; tooltip: string }[] = [
  { id: "wheat_risk",     label: "Wheat Risk Index",         color: "#14b8a6", tooltip: "Composite risk score (CHI) combining rainfall, temperature & crop stress across all growth stages" },
  { id: "drought_stress", label: "Drought Stress",           color: "#f97316", tooltip: "Rainfall deviation (%) from 1990–2020 baseline — negative % means drier than normal" },
  { id: "heat_stress",    label: "Heat Stress at Flowering", color: "#fca5a5", tooltip: "Temperature anomaly (°C) during the critical flowering window — excess heat reduces grain yield" },
];

/* ─────────────────────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────────────────────── */
function getWeeksInMonth(year: number, monthIdx: number): number {
  const days = new Date(year, monthIdx + 1, 0).getDate();
  return days >= 29 ? 5 : 4;
}

function weekRange(year: number, monthIdx: number, weekNum: number): string {
  const start = (weekNum - 1) * 7 + 1;
  const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();
  const end = Math.min(weekNum * 7, daysInMonth);
  return `${start} ${MONTHS[monthIdx]} ${year} – ${end} ${MONTHS[monthIdx]} ${year}`;
}

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────────────────────── */
export function FilterSidebar({
  year, setYear,
  month, setMonth,
  week, setWeek,
  activeLayer, setActiveLayer,
  selectedDistrict, onSelectDistrict,
  selectedBlock, onSelectBlock,
  selectedPincode, onSelectPincode,
  isCompareMode = false,
  selectedDistrictB = null,
  onSelectDistrictB = () => {},
  selectedBlockB = null,
  onSelectBlockB = () => {},
}: FilterSidebarProps) {

  const handleSelectDistrict = useCallback((d: string | null) => {
    onSelectDistrict(d);
    onSelectBlock(null);
    onSelectPincode(null);
  }, [onSelectDistrict, onSelectBlock, onSelectPincode]);

  const handleSelectDistrictB = useCallback((d: string | null) => {
    onSelectDistrictB(d);
    onSelectBlockB(null);
  }, [onSelectDistrictB, onSelectBlockB]);

  const numWeeks    = getWeeksInMonth(Number(year), month);
  const safeWeek    = Math.min(week, numWeeks);
  const reportLabel = weekRange(Number(year), month, safeWeek);
  const blocks      = selectedDistrict ? getBlocksForDistrict(selectedDistrict) : [];
  const blocksB     = selectedDistrictB ? getBlocksForDistrict(selectedDistrictB) : [];

  return (
    <div
      className="w-[252px] shrink-0 flex flex-col h-full z-10 overflow-y-auto"
      style={{ background: "#e8f5f4" }}
    >
      <div className="flex flex-col gap-3 p-3 flex-1">

        {/* ═══════════════════════════════════════════════════
            CARD 1 — WHEN
        ═══════════════════════════════════════════════════ */}
        <Card>
          <div className="font-bold text-slate-800 text-sm mb-3">Filters</div>
          <SectionLabel>WHEN</SectionLabel>

          <div className="grid gap-1.5 mb-2.5" style={{ gridTemplateColumns: "1fr 1fr 1.15fr" }}>
            <MiniSelect
              label="YEAR"
              value={year}
              options={YEARS.map(y => ({ value: y, label: y }))}
              onChange={setYear}
            />
            <MiniSelect
              label="MONTH"
              value={String(month)}
              options={MONTHS.map((m, i) => ({ value: String(i), label: m }))}
              onChange={(v) => setMonth(Number(v))}
            />
            <MiniSelect
              label="WEEK"
              value={String(safeWeek)}
              options={Array.from({ length: numWeeks }, (_, i) => ({
                value: String(i + 1),
                label: `Week ${i + 1}`,
              }))}
              onChange={(v) => setWeek(Number(v))}
            />
          </div>

          <div
            className="rounded-lg px-3 py-2"
            style={{ background: "#ccfbf1", border: "1px solid #99f6e4" }}
          >
            <div className="text-[9px] font-bold uppercase tracking-widest text-teal-600 mb-0.5">
              Reporting Period
            </div>
            <div className="text-xs font-semibold text-teal-800">{reportLabel}</div>
          </div>
        </Card>

        {/* ═══════════════════════════════════════════════════
            CARD 2 — WHERE
        ═══════════════════════════════════════════════════ */}
        <Card>
          <SectionLabel>WHERE</SectionLabel>

          {/* State — fixed */}
          <div className="mb-3">
            <FieldLabel>STATE</FieldLabel>
            <div
              className="h-9 rounded-lg px-3 flex items-center justify-between text-sm text-slate-700 font-medium select-none"
              style={{ background: "#fff", border: "1px solid #d1d5db" }}
            >
              <span>Uttar Pradesh</span>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </div>
          </div>

          {isCompareMode ? (
            <div className="space-y-3">
              {/* Region A Selector */}
              <div className="rounded-lg p-2 bg-slate-50 border border-slate-100">
                <span className="text-[9px] font-black uppercase text-teal-600 tracking-wider block mb-1">Region A</span>
                <div className="space-y-2">
                  <div>
                    <div className="flex items-center justify-between mb-0.5">
                      <FieldLabel>DISTRICT A</FieldLabel>
                      {selectedDistrict && (
                        <button
                          onClick={() => handleSelectDistrict(null)}
                          className="text-[9px] font-semibold text-teal-600 hover:text-teal-800"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <SearchableSelect
                      placeholder="Select District"
                      value={selectedDistrict}
                      options={ALL_UP_DISTRICTS}
                      onChange={handleSelectDistrict}
                    />
                  </div>

                  {selectedDistrict && (
                    <div>
                      <div className="flex items-center justify-between mb-0.5">
                        <FieldLabel>BLOCK A ({blocks.length})</FieldLabel>
                        {selectedBlock && (
                          <button
                            onClick={() => { onSelectBlock(null); onSelectPincode(null); }}
                            className="text-[9px] font-semibold text-teal-600 hover:text-teal-800"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                      <SearchableSelect
                        placeholder="Select Block"
                        value={selectedBlock}
                        options={blocks}
                        onChange={(b) => { onSelectBlock(b); onSelectPincode(null); }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Region B Selector */}
              <div className="rounded-lg p-2 bg-slate-50 border border-slate-100">
                <span className="text-[9px] font-black uppercase text-cyan-600 tracking-wider block mb-1">Region B (VS)</span>
                <div className="space-y-2">
                  <div>
                    <div className="flex items-center justify-between mb-0.5">
                      <FieldLabel>DISTRICT B</FieldLabel>
                      {selectedDistrictB && (
                        <button
                          onClick={() => handleSelectDistrictB(null)}
                          className="text-[9px] font-semibold text-cyan-600 hover:text-cyan-800"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <SearchableSelect
                      placeholder="Select District"
                      value={selectedDistrictB}
                      options={ALL_UP_DISTRICTS}
                      onChange={handleSelectDistrictB}
                    />
                  </div>

                  {selectedDistrictB && (
                    <div>
                      <div className="flex items-center justify-between mb-0.5">
                        <FieldLabel>BLOCK B ({blocksB.length})</FieldLabel>
                        {selectedBlockB && (
                          <button
                            onClick={() => onSelectBlockB(null)}
                            className="text-[9px] font-semibold text-cyan-600 hover:text-cyan-800"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                      <SearchableSelect
                        placeholder="Select Block"
                        value={selectedBlockB}
                        options={blocksB}
                        onChange={onSelectBlockB}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* District */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <FieldLabel>DISTRICT (75)</FieldLabel>
                  {selectedDistrict && (
                    <button
                      onClick={() => handleSelectDistrict(null)}
                      className="text-[10px] font-semibold text-teal-600 hover:text-teal-800 transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <SearchableSelect
                  placeholder="No district selected"
                  value={selectedDistrict}
                  options={ALL_UP_DISTRICTS}
                  onChange={handleSelectDistrict}
                />
              </div>

              {/* Block — only if district selected */}
              {selectedDistrict && (
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <FieldLabel>BLOCK ({blocks.length})</FieldLabel>
                      {selectedBlock && (
                        <button
                          onClick={() => { onSelectBlock(null); onSelectPincode(null); }}
                          className="text-[10px] font-semibold text-teal-600 hover:text-teal-800 transition-colors"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <SearchableSelect
                      placeholder="No block selected"
                      value={selectedBlock}
                      options={blocks}
                      onChange={(b) => { onSelectBlock(b); onSelectPincode(null); }}
                    />
                  </div>

                  {/* Pincode — only if block selected */}
                  {selectedBlock && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <FieldLabel>SEARCH BY PINCODE</FieldLabel>
                        {selectedPincode && (
                          <button
                            onClick={() => onSelectPincode(null)}
                            className="text-[10px] font-semibold text-teal-600 hover:text-teal-800 transition-colors"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                      {(() => {
                        const pinOptions = getPincodesForBlock(selectedDistrict, selectedBlock);
                        const optionsList = pinOptions.map(p => `${p.pincode} (${p.areaName})`);
                        const displayVal = selectedPincode ? pinOptions.find(p => p.pincode === selectedPincode) : null;
                        const valueStr = displayVal ? `${displayVal.pincode} (${displayVal.areaName})` : null;
                        return (
                          <SearchableSelect
                            placeholder="No pincode selected"
                            value={valueStr}
                            options={optionsList}
                            onChange={(val) => {
                              if (val) {
                                const match = val.match(/^(\d+)/);
                                onSelectPincode(match ? match[1] : null);
                              } else {
                                onSelectPincode(null);
                              }
                            }}
                          />
                        );
                      })()}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </Card>

        {/* ═══════════════════════════════════════════════════
            CARD 3 — LAYERS
        ═══════════════════════════════════════════════════ */}
        <Card>
          <SectionLabel>LAYERS</SectionLabel>

          <div className="flex items-center gap-1 mb-3">
            <Layers2 className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400">
              Climate Variable · Choose One
            </span>
          </div>

          <div className="space-y-1.5">
            {LAYER_CONFIG.map((layer) => {
              const active = activeLayer === layer.id;
              return (
              <button
                  key={layer.id}
                  onClick={() => setActiveLayer(layer.id)}
                  title={layer.tooltip}
                  className="w-full text-left flex flex-col gap-0.5 px-3 py-2.5 rounded-lg transition-all duration-150"
                  style={{
                    background: active ? "#f0fdfa" : "transparent",
                    border: active ? `1.5px solid #5eead4` : "1.5px solid transparent",
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ background: layer.color }}
                    />
                    <span
                      className="flex-1 text-xs font-semibold leading-tight"
                      style={{ color: active ? "#0d6455" : "#475569" }}
                    >
                      {layer.label}
                    </span>
                    {active && (
                      <div
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ background: layer.color }}
                      />
                    )}
                  </div>
                  {active && (
                    <p className="text-[9px] text-teal-600 leading-tight pl-5 font-medium">
                      {layer.tooltip}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        </Card>
      </div>

      {/* ── Footer ── */}
      <div
        className="flex items-center justify-between px-4 py-2.5 shrink-0"
        style={{ borderTop: "1px solid #b2dfdb" }}
      >
        <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-medium">
          <Database className="w-3 h-3" />
          <span>Demo Data</span>
        </div>
        <button className="text-[10px] font-bold text-teal-600 hover:text-teal-800 uppercase tracking-wider transition-colors">
          Connect API →
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   SUB-COMPONENTS
───────────────────────────────────────────────────────────────────────────── */

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-xl p-3"
      style={{
        background: "#fff",
        boxShadow: "0 1px 6px rgba(0,0,0,0.07)",
        border: "1px solid rgba(0,0,0,0.05)",
      }}
    >
      {children}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] font-bold uppercase tracking-[0.14em] mb-2" style={{ color: "#0d9488" }}>
      {children}
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
      {children}
    </div>
  );
}

/* ── MiniSelect ── */
function MiniSelect({
  label, value, options, onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useClickOutside(ref, () => setOpen(false));

  return (
    <div ref={ref} className="relative">
      <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-1">{label}</div>
      <button
        onClick={() => setOpen((p) => !p)}
        className="w-full h-8 rounded-lg px-2 flex items-center justify-between text-xs font-semibold text-slate-700 hover:border-teal-400 transition-colors"
        style={{ background: "#fff", border: "1px solid #d1d5db" }}
      >
        <span className="truncate">{selected?.label ?? value}</span>
        <ChevronDown className={`w-3 h-3 text-slate-400 ml-0.5 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          className="absolute top-full left-0 right-0 mt-1 z-[500] rounded-lg overflow-auto shadow-xl py-1"
          style={{ background: "#fff", border: "1px solid #e2e8f0", maxHeight: 200 }}
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className="w-full text-left px-2.5 py-1.5 text-xs font-medium flex items-center justify-between hover:bg-teal-50 transition-colors"
              style={{ color: opt.value === value ? "#0d9488" : "#374151" }}
            >
              <span>{opt.label}</span>
              {opt.value === value && <Check className="w-3 h-3 text-teal-500" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── SearchableSelect ── */
function SearchableSelect({
  value, options, onChange, placeholder,
}: {
  value: string | null;
  options: string[];
  onChange: (v: string | null) => void;
  placeholder: string;
}) {
  const [open,  setOpen]  = useState(false);
  const [query, setQuery] = useState("");
  const ref      = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useClickOutside(ref, () => { setOpen(false); setQuery(""); });

  const filtered = query
    ? options.filter((o) => o.toLowerCase().includes(query.toLowerCase()))
    : options;

  const handleOpen = () => {
    setOpen(true);
    setQuery("");
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  return (
    <div ref={ref} className="relative">
      <div
        className="h-9 rounded-lg px-3 flex items-center justify-between cursor-pointer transition-all"
        style={{
          background: "#fff",
          border: `1px solid ${open ? "#14b8a6" : value ? "#5eead4" : "#d1d5db"}`,
          boxShadow: value ? "inset 3px 0 0 #14b8a6" : undefined,
        }}
        onClick={handleOpen}
      >
        {value ? (
          <>
            <span className="text-sm font-semibold text-teal-700 truncate">{value}</span>
            <button
              onClick={(e) => { e.stopPropagation(); onChange(null); }}
              className="ml-2 text-slate-400 hover:text-slate-600 transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </>
        ) : (
          <span className="text-sm text-slate-400 select-none">{placeholder}</span>
        )}
      </div>

      {open && (
        <div
          className="absolute top-full left-0 right-0 mt-1 z-[500] rounded-lg overflow-hidden shadow-xl"
          style={{ background: "#fff", border: "1px solid #e2e8f0" }}
        >
          <div className="p-2" style={{ borderBottom: "1px solid #f1f5f9" }}>
            <input
              ref={inputRef}
              type="text"
              placeholder="Search…"
              className="w-full text-xs rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-400 text-slate-700 placeholder:text-slate-400"
              style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="overflow-y-auto" style={{ maxHeight: 200 }}>
            {filtered.length === 0 ? (
              <div className="px-3 py-3 text-xs text-slate-400 text-center">No results</div>
            ) : (
              filtered.map((opt) => (
                <button
                  key={opt}
                  onClick={() => { onChange(opt); setOpen(false); setQuery(""); }}
                  className="w-full text-left px-3 py-2 text-xs font-medium hover:bg-teal-50 transition-colors flex items-center justify-between"
                  style={{
                    background: opt === value ? "#f0fdfa" : undefined,
                    color: opt === value ? "#0d9488" : "#374151",
                    fontWeight: opt === value ? 700 : 500,
                  }}
                >
                  <span>{opt}</span>
                  {opt === value && <Check className="w-3 h-3 text-teal-500 shrink-0" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Shared hook ── */
function useClickOutside(ref: React.RefObject<HTMLElement | null>, handler: () => void) {
  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) handler();
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [ref, handler]);
}
