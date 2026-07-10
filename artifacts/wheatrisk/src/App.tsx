import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch, Router as WouterRouter } from "wouter";
import NotFound from "@/pages/not-found";

import { Navbar } from "./components/Navbar";
import { FilterSidebar } from "./components/FilterSidebar";
import { MapPanel } from "./components/MapPanel";
import { BottomLegend } from "./components/BottomLegend";
import { RightPanel } from "./components/RightPanel";
import { PincodeDetailPanel } from "./components/PincodeDetailPanel";
import { ComparePanel } from "./components/ComparePanel";
import { LayerType } from "./lib/colorUtils";
import { useListDistricts, getListDistrictsQueryKey } from "@workspace/api-client-react";

const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

/** Derive Rabi / Kharif / Zaid label from month index (0-based) */
function getSeasonLabel(monthIdx: number): string {
  if (monthIdx >= 9 || monthIdx <= 2) return "Rabi Season";   // Oct–Mar
  if (monthIdx >= 5 && monthIdx <= 8) return "Kharif Season"; // Jun–Sep
  return "Zaid Season";                                        // Apr–May
}

/** Build season string like "2025-26" from year + month */
function buildSeasonString(year: number, monthIdx: number): string {
  // Rabi spans two calendar years (Oct 2025 → Mar 2026 = "2025-26")
  if (monthIdx >= 9) return `${year}-${String(year + 1).slice(2)}`;
  if (monthIdx <= 2) return `${year - 1}-${String(year).slice(2)}`;
  return String(year); // Kharif / Zaid: single year
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 60_000,
    },
  },
});

function Dashboard() {
  // Date filters — lifted from FilterSidebar so Navbar + API can use them
  const today = new Date();
  const [year,  setYear]  = useState<string>(String(today.getFullYear()));
  const [month, setMonth] = useState<number>(today.getMonth());
  const [week,  setWeek]  = useState<number>(1);

  const season     = buildSeasonString(Number(year), month);
  const seasonLabel = getSeasonLabel(month);
  const weekNum    = Math.min(week, Math.ceil(new Date(Number(year), month + 1, 0).getDate() / 7));

  const [growthStage, setGrowthStage] = useState<string>("flowering");
  const [activeLayer, setActiveLayer] = useState<LayerType>("wheat_risk");
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [selectedBlock, setSelectedBlock]       = useState<string | null>(null);
  const [selectedPincode, setSelectedPincode]   = useState<string | null>(null);

  // Compare mode states
  const [isCompareMode, setIsCompareMode]       = useState<boolean>(false);
  const [selectedDistrictB, setSelectedDistrictB] = useState<string | null>(null);
  const [selectedBlockB, setSelectedBlockB]       = useState<string | null>(null);

  // Always clear block & pincode selection whenever district changes (including switching A→B)
  const handleSelectDistrict = (d: string | null) => {
    setSelectedDistrict(d);
    setSelectedBlock(null);
    setSelectedPincode(null);
  };

  const handleSelectBlock = (b: string | null) => {
    setSelectedBlock(b);
    setSelectedPincode(null);
  };

  // Keyboard shortcut: Esc steps back through pincode → block → district
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (document.activeElement?.tagName === "INPUT") return; // ignore when typing
      if (selectedPincode)  { setSelectedPincode(null); return; }
      if (selectedBlock)    { setSelectedBlock(null); setSelectedPincode(null); return; }
      if (selectedDistrict) { handleSelectDistrict(null); }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedPincode, selectedBlock, selectedDistrict]);

  const handleToggleCompare = () => {
    setIsCompareMode(prev => {
      const next = !prev;
      if (!next) {
        setSelectedDistrictB(null);
        setSelectedBlockB(null);
      }
      return next;
    });
  };

  const { data: districtsData } = useListDistricts(
    { season, growth_stage: growthStage, layer: activeLayer as any },
    { query: { queryKey: getListDistrictsQueryKey({ season, growth_stage: growthStage, layer: activeLayer as any }) } }
  );

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden" style={{ background: "#cfe8e6" }}>
      <Navbar
        isCompareMode={isCompareMode}
        onToggleCompareMode={handleToggleCompare}
        seasonLabel={seasonLabel}
        weekNum={weekNum}
        monthStr={MONTHS_SHORT[month]}
        year={Number(year)}
      />

      <div className="flex flex-1 min-h-0 overflow-hidden gap-1.5 p-1.5 pt-0">

        {/* Left: filter sidebar */}
        <div
          className="flex flex-col h-full rounded-xl overflow-hidden shrink-0"
          style={{ border: "1px solid #b2dfdb", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
        >
          <FilterSidebar
            year={year}
            setYear={setYear}
            month={month}
            setMonth={setMonth}
            week={week}
            setWeek={setWeek}
            growthStage={growthStage}
            setGrowthStage={setGrowthStage}
            activeLayer={activeLayer}
            setActiveLayer={setActiveLayer}
            selectedDistrict={selectedDistrict}
            onSelectDistrict={handleSelectDistrict}
            selectedBlock={selectedBlock}
            onSelectBlock={handleSelectBlock}
            selectedPincode={selectedPincode}
            onSelectPincode={setSelectedPincode}
            isCompareMode={isCompareMode}
            selectedDistrictB={selectedDistrictB}
            onSelectDistrictB={setSelectedDistrictB}
            selectedBlockB={selectedBlockB}
            onSelectBlockB={setSelectedBlockB}
          />
        </div>

        {/* Centre: map + legend, detailed pincode panel, or ComparePanel */}
        <div
          className="flex flex-col flex-1 min-w-0 h-[calc(100vh-56px)] rounded-xl overflow-hidden"
          style={{ border: "1px solid #c5d4e0", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
        >
          {isCompareMode ? (
            <ComparePanel
              districtA={selectedDistrict}
              blockA={selectedBlock}
              districtB={selectedDistrictB}
              blockB={selectedBlockB}
              onClose={() => handleToggleCompare()}
            />
          ) : selectedPincode && selectedDistrict && selectedBlock ? (
            <PincodeDetailPanel
              district={selectedDistrict}
              block={selectedBlock}
              pincode={selectedPincode}
              onClose={() => setSelectedPincode(null)}
            />
          ) : (
            <>
              <MapPanel
                districtsData={districtsData}
                activeLayer={activeLayer}
                selectedDistrict={selectedDistrict}
                onSelectDistrict={handleSelectDistrict}
                selectedBlock={selectedBlock}
                onSelectBlock={handleSelectBlock}
              />
              <BottomLegend
                activeLayer={activeLayer}
                onResetView={() => { handleSelectDistrict(null); }}
              />
            </>
          )}
        </div>

        {/* Right: stats + detail */}
        <div
          className="flex flex-col h-full rounded-xl overflow-hidden shrink-0"
          style={{ border: "1px solid #b2dfdb", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
        >
          <RightPanel
            season={season}
            growthStage={growthStage}
            activeLayer={activeLayer}
            selectedDistrict={selectedDistrict}
            onSelectDistrict={handleSelectDistrict}
            selectedBlock={selectedBlock}
            onSelectBlock={handleSelectBlock}
            selectedPincode={selectedPincode}
            onSelectPincode={setSelectedPincode}
          />
        </div>

      </div>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
