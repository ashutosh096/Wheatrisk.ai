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
  const [season, setSeason]               = useState<string>("2025-26");
  const [growthStage, setGrowthStage]     = useState<string>("flowering");
  const [activeLayer, setActiveLayer]     = useState<LayerType>("wheat_risk");
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);

  const { data: districtsData } = useListDistricts(
    { season, growth_stage: growthStage, layer: activeLayer as any },
    { query: { queryKey: getListDistrictsQueryKey({ season, growth_stage: growthStage, layer: activeLayer as any }) } }
  );

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden" style={{ background: "#eef2f7" }}>
      <Navbar />

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left: dark filter sidebar */}
        <FilterSidebar
          season={season}
          setSeason={setSeason}
          growthStage={growthStage}
          setGrowthStage={setGrowthStage}
          activeLayer={activeLayer}
          setActiveLayer={setActiveLayer}
        />

        {/* Center: map + legend */}
        <div className="flex flex-col flex-1 min-w-0 h-full">
          <MapPanel
            districtsData={districtsData}
            activeLayer={activeLayer}
            selectedDistrict={selectedDistrict}
            onSelectDistrict={setSelectedDistrict}
          />
          <BottomLegend
            activeLayer={activeLayer}
            onResetView={() => setSelectedDistrict(null)}
          />
        </div>

        {/* Right: stats + district detail */}
        <RightPanel
          season={season}
          growthStage={growthStage}
          activeLayer={activeLayer}
          selectedDistrict={selectedDistrict}
        />
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
