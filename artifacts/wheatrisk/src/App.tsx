import { useState } from "react";
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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 60_000,
    },
  },
});

function Dashboard() {
  const [season, setSeason]           = useState<string>("2025-26");
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
      <Navbar isCompareMode={isCompareMode} onToggleCompareMode={handleToggleCompare} />

      <div className="flex flex-1 min-h-0 overflow-hidden gap-1.5 p-1.5 pt-0">

        {/* Left: filter sidebar */}
        <div
          className="flex flex-col h-full rounded-xl overflow-hidden shrink-0"
          style={{ border: "1px solid #b2dfdb", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
        >
          <FilterSidebar
            season={season}
            setSeason={setSeason}
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
