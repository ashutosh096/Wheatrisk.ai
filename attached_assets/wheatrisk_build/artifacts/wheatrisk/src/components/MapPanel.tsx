import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { MapContainer, TileLayer, GeoJSON, ZoomControl, useMap } from "react-leaflet";
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { DistrictRisk } from "@workspace/api-client-react";
import { LayerType, getCategoryForDistrict, getCategoryColor, LAYER_LABELS } from "../lib/colorUtils";
import { normalizeDistrictName } from "../lib/districtNormalizer";
import { useQuery } from "@tanstack/react-query";

interface MapPanelProps {
  districtsData: DistrictRisk[] | undefined;
  activeLayer: LayerType;
  selectedDistrict: string | null;
  onSelectDistrict: (district: string) => void;
}

// Re-fit map to UP bounds once GeoJSON is loaded
function FitUP({ geojsonData }: { geojsonData: any }) {
  const map = useMap();
  useEffect(() => {
    if (!geojsonData) return;
    try {
      const layer = L.geoJSON(geojsonData);
      const bounds = layer.getBounds();
      if (bounds.isValid()) map.fitBounds(bounds, { padding: [24, 24] });
    } catch {/* noop */}
  }, [geojsonData, map]);
  return null;
}

export function MapPanel({ districtsData, activeLayer, selectedDistrict, onSelectDistrict }: MapPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const geoJsonLayerRef = useRef<L.GeoJSON | null>(null);

  // ── Fetch UP districts GeoJSON ──
  const { data: geojsonData } = useQuery({
    queryKey: ['up-geojson'],
    queryFn: async () => {
      const res = await fetch('https://raw.githubusercontent.com/udit-001/india-maps-data/main/geojson/states/uttar-pradesh.geojson');
      return res.json();
    },
    staleTime: Infinity,
  });

  // ── Fetch India states GeoJSON (for context outline) ──
  const { data: indiaStatesData } = useQuery({
    queryKey: ['india-states-geojson'],
    queryFn: async () => {
      const res = await fetch('https://raw.githubusercontent.com/geohacker/india/master/state/india_state.geojson');
      return res.json();
    },
    staleTime: Infinity,
  });

  const dataLookup = useMemo(() => {
    const lookup: Record<string, DistrictRisk> = {};
    if (districtsData) districtsData.forEach((d) => { lookup[d.district] = d; });
    return lookup;
  }, [districtsData]);

  const searchedDistrict = searchQuery.trim().toLowerCase();

  // ── India state style (gray background context) ──
  const indiaStateStyle = useCallback(() => ({
    fillColor: "#d1d9e4",
    weight: 0.8,
    color: "#9eafc0",
    fillOpacity: 0.35,
    opacity: 0.6,
  }), []);

  // ── District fill style ──
  const geoJsonStyle = useCallback((feature: any) => {
    const rawName = feature?.properties?.dtname ?? feature?.properties?.district ?? feature?.properties?.DISTRICT ?? "";
    const districtName = normalizeDistrictName(rawName);
    const data = dataLookup[districtName];
    const category = getCategoryForDistrict(data, activeLayer);
    const color = getCategoryColor(activeLayer, category);
    const isSelected = selectedDistrict === districtName;
    const isSearched = searchedDistrict && districtName.toLowerCase().includes(searchedDistrict);

    return {
      fillColor: color,
      weight: isSelected ? 2.5 : isSearched ? 2 : 0.7,
      opacity: 1,
      color: isSelected ? "#0f172a" : isSearched ? "#22d3ee" : "rgba(255,255,255,0.6)",
      fillOpacity: isSelected ? 0.95 : 0.78,
      dashArray: isSearched && !isSelected ? "4,3" : undefined,
    };
  }, [dataLookup, activeLayer, selectedDistrict, searchedDistrict]);

  // ── Per-feature events ──
  const onEachFeature = useCallback((feature: any, layer: any) => {
    const rawName = feature?.properties?.dtname ?? feature?.properties?.district ?? feature?.properties?.DISTRICT ?? "";
    const districtName = normalizeDistrictName(rawName);
    const data = dataLookup[districtName];

    let valueHtml = "";
    if (data) {
      const category = getCategoryForDistrict(data, activeLayer);
      const color = getCategoryColor(activeLayer, category);
      let metric = "";
      if (activeLayer === "wheat_risk") metric = `CHI ${data.risk?.mean_chi?.toFixed(1)}`;
      else if (activeLayer === "drought_stress") metric = `${data.rainfall?.deviation_pct > 0 ? "+" : ""}${data.rainfall?.deviation_pct}% rf`;
      else if (activeLayer === "heat_stress") metric = `${data.temperature?.anomaly_c > 0 ? "+" : ""}${data.temperature?.anomaly_c}°C`;

      valueHtml = `
        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:6px;padding-top:6px;border-top:1px solid #f1f5f9">
          <span style="background:${color};color:#fff;font-size:9px;font-weight:700;letter-spacing:0.06em;padding:2px 7px;border-radius:3px;text-transform:uppercase">${category}</span>
          <span style="font-size:11px;font-weight:700;color:#1e293b;font-variant-numeric:tabular-nums">${metric}</span>
        </div>`;
    }

    const tooltipHtml = `
      <div class="wr-tooltip" style="background:#fff;border-radius:8px;padding:10px 12px;min-width:160px;box-shadow:0 8px 24px -4px rgba(0,0,0,0.18),0 2px 8px rgba(0,0,0,0.08)">
        <div style="font-weight:700;font-size:13px;color:#0f172a;line-height:1.2">${districtName}</div>
        <div style="font-size:9px;font-weight:600;color:#94a3b8;letter-spacing:0.08em;text-transform:uppercase;margin-top:1px">Uttar Pradesh</div>
        ${valueHtml}
      </div>`;

    layer.bindTooltip(tooltipHtml, { sticky: true, className: "wr-tooltip-wrap", opacity: 1 });

    layer.on({
      click: () => onSelectDistrict(districtName),
      mouseover: (e: any) => {
        e.target.setStyle({ weight: 2.5, fillOpacity: 0.95, color: "#0f172a" });
        e.target.bringToFront();
      },
      mouseout: (e: any) => {
        const l = e.target;
        if (geoJsonLayerRef.current) geoJsonLayerRef.current.resetStyle(l);
        if (selectedDistrict === districtName) l.setStyle({ weight: 2.5, color: "#0f172a", fillOpacity: 0.95 });
        l.bringToFront();
      },
    });
  }, [dataLookup, activeLayer, selectedDistrict, onSelectDistrict]);

  return (
    <div className="relative flex-1 flex flex-col h-full overflow-hidden" style={{ background: "#e8edf3" }}>

      {/* ── Search overlay (top-left) ── */}
      <div className="absolute top-3 left-3 z-[400]">
        <div className="flex items-center gap-2 bg-white rounded-lg shadow-lg overflow-hidden h-9"
          style={{ border: "1px solid #e2e8f0", minWidth: 220 }}>
          <Search className="w-3.5 h-3.5 text-slate-400 ml-3 shrink-0" />
          <input
            type="text"
            placeholder="Search district…"
            className="flex-1 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none pr-2"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="pr-2.5">
              <X className="w-3 h-3 text-slate-400 hover:text-slate-600" />
            </button>
          )}
        </div>
      </div>

      {/* ── Active-layer badge (top-right) ── */}
      <div className="absolute top-3 right-3 z-[400]">
        <div className="flex items-center gap-1.5 bg-white/95 backdrop-blur-sm rounded-lg shadow-md px-3 h-9"
          style={{ border: "1px solid #e2e8f0" }}>
          <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs font-semibold text-slate-700">{LAYER_LABELS[activeLayer]}</span>
        </div>
      </div>

      {/* ── Map ── */}
      <MapContainer
        center={[27.0, 80.3]}
        zoom={6}
        zoomControl={false}
        className="w-full h-full"
        style={{ background: "#eef2f7" }}
      >
        <ZoomControl position="bottomright" />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
          opacity={0.7}
        />
        {/* India state outlines — context background */}
        {indiaStatesData && (
          <GeoJSON
            key="india-states"
            data={indiaStatesData}
            style={indiaStateStyle}
            interactive={false}
          />
        )}
        {/* UP districts — colored by risk. Key includes data fingerprint so tooltips/events
            are always re-bound when season or growth_stage changes districtsData. */}
        {geojsonData && (
          <GeoJSON
            key={`up-${activeLayer}-${selectedDistrict ?? "none"}-${districtsData?.length ?? 0}-${districtsData?.[0]?.risk?.mean_chi ?? 0}`}
            ref={(r) => { geoJsonLayerRef.current = r; }}
            data={geojsonData}
            style={geoJsonStyle}
            onEachFeature={onEachFeature}
          />
        )}
        {/* Place labels on top */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png"
          opacity={0.5}
          zIndex={400}
        />
        <FitUP geojsonData={geojsonData} />
      </MapContainer>

      {/* ── Attribution strip ── */}
      <div className="absolute bottom-2 left-2 z-[400] text-[9px] text-slate-400 font-medium bg-white/75 px-2 py-0.5 rounded select-none">
        &copy; OpenStreetMap &middot; CARTO &middot; IMD
      </div>
    </div>
  );
}
