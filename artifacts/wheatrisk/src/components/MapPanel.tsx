import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { MapContainer, TileLayer, GeoJSON, ZoomControl, useMap, Marker, Tooltip } from "react-leaflet";
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { DistrictRisk } from "@workspace/api-client-react";
import { LayerType, getCategoryForDistrict, getCategoryColor, LAYER_LABELS } from "../lib/colorUtils";
import { normalizeDistrictName } from "../lib/districtNormalizer";
import { useQuery } from "@tanstack/react-query";
import { getBlocksForDistrict } from "../lib/blocksData";
import { getBlockData } from "../lib/blockSampleData";

interface MapPanelProps {
  districtsData: DistrictRisk[] | undefined;
  activeLayer: LayerType;
  selectedDistrict: string | null;
  onSelectDistrict: (district: string) => void;
  selectedBlock: string | null;
  onSelectBlock: (block: string | null) => void;
}

/* ── Fit map to India bounds on first load ── */
function FitIndia({ indiaData }: { indiaData: any }) {
  const map = useMap();
  const fitted = useRef(false);
  useEffect(() => {
    if (!indiaData || fitted.current) return;
    try {
      const layer = L.geoJSON(indiaData);
      const bounds = layer.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [20, 20], animate: false });
        fitted.current = true;
      }
    } catch { /* noop */ }
  }, [indiaData, map]);
  return null;
}

/* ── Zoom to selected district (or back to UP) when selection changes ── */
function ZoomToSelection({
  geojsonData,
  selectedDistrict,
  selectedBlock,
}: {
  geojsonData: any;
  selectedDistrict: string | null;
  selectedBlock: string | null;
}) {
  const map = useMap();
  const prevSelection = useRef<{ district: string | null; block: string | null }>({ district: null, block: null });
  const fitted = useRef(false);

  useEffect(() => {
    if (!geojsonData) return;

    // Fit UP on initial load
    if (!fitted.current) {
      try {
        const layer = L.geoJSON(geojsonData);
        const bounds = layer.getBounds();
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [24, 24], animate: false });
          fitted.current = true;
        }
      } catch { /* noop */ }
    }

    if (selectedDistrict === prevSelection.current.district && selectedBlock === prevSelection.current.block) return;
    prevSelection.current = { district: selectedDistrict, block: selectedBlock };

    if (selectedDistrict && selectedBlock) {
      // Zoom to selected district when a block is selected
      try {
        const feature = geojsonData.features?.find((f: any) => {
          const raw = f.properties?.dtname ?? f.properties?.district ?? f.properties?.DISTRICT ?? "";
          return normalizeDistrictName(raw) === selectedDistrict;
        });
        if (feature) {
          const layer = L.geoJSON(feature);
          const bounds = layer.getBounds();
          if (bounds.isValid()) map.fitBounds(bounds, { padding: [100, 100], maxZoom: 9 });
        }
      } catch { /* noop */ }
    } else if (!selectedDistrict) {
      // Zoom back to UP when selection is cleared
      try {
        const layer = L.geoJSON(geojsonData);
        const bounds = layer.getBounds();
        if (bounds.isValid()) map.fitBounds(bounds, { padding: [24, 24] });
      } catch { /* noop */ }
    }
  }, [selectedDistrict, selectedBlock, geojsonData, map]);

  return null;
}

function getGeometryCenter(geometry: any): [number, number] | null {
  if (!geometry) return null;
  let minLat = Infinity, maxLat = -Infinity;
  let minLng = Infinity, maxLng = -Infinity;

  const processRings = (rings: any[][]) => {
    rings.forEach((ring) => {
      ring.forEach((coord) => {
        const [lng, lat] = coord;
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
        if (lng < minLng) minLng = lng;
        if (lng > maxLng) maxLng = lng;
      });
    });
  };

  if (geometry.type === "Polygon") {
    processRings(geometry.coordinates);
  } else if (geometry.type === "MultiPolygon") {
    geometry.coordinates.forEach((polygonCoords: any) => {
      processRings(polygonCoords);
    });
  } else {
    return null;
  }

  if (minLat === Infinity || minLng === Infinity) return null;
  return [(minLat + maxLat) / 2, (minLng + maxLng) / 2];
}

function clipPolygonHalfPlane(
  points: [number, number][],
  ax: number,
  ay: number,
  mx: number,
  my: number
): [number, number][] {
  const getDistance = (x: number, y: number) => {
    return (x - mx) * ax + (y - my) * ay;
  };

  const result: [number, number][] = [];
  for (let i = 0; i < points.length; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % points.length];
    
    const d1 = getDistance(p1[0], p1[1]);
    const d2 = getDistance(p2[0], p2[1]);
    
    const p1In = d1 >= 0;
    const p2In = d2 >= 0;

    if (p1In) {
      if (p2In) {
        result.push(p2);
      } else {
        const t = -d1 / (d2 - d1 || 0.000001);
        const x = p1[0] + t * (p2[0] - p1[0]);
        const y = p1[1] + t * (p2[1] - p1[1]);
        result.push([x, y]);
      }
    } else {
      if (p2In) {
        const t = -d1 / (d2 - d1 || 0.000001);
        const x = p1[0] + t * (p2[0] - p1[0]);
        const y = p1[1] + t * (p2[1] - p1[1]);
        result.push([x, y]);
        result.push(p2);
      }
    }
  }
  return result;
}

interface BlockFeature {
  type: "Feature";
  properties: {
    blockName: string;
    districtName: string;
  };
  geometry: any;
}

function generateDummyBlocks(districtFeature: any, blocks: string[]): BlockFeature[] {
  if (!districtFeature || !blocks || blocks.length === 0) return [];
  const geom = districtFeature.geometry;
  const districtName = districtFeature.properties?.dtname ?? districtFeature.properties?.district ?? districtFeature.properties?.DISTRICT ?? "";

  let minLng = Infinity, maxLng = -Infinity;
  let minLat = Infinity, maxLat = -Infinity;
  
  const processCoords = (coords: any[][]) => {
    coords.forEach(ring => {
      ring.forEach(pt => {
        const [lng, lat] = pt;
        if (lng < minLng) minLng = lng;
        if (lng > maxLng) maxLng = lng;
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
      });
    });
  };

  if (geom.type === "Polygon") {
    processCoords(geom.coordinates);
  } else if (geom.type === "MultiPolygon") {
    geom.coordinates.forEach((poly: any) => processCoords(poly));
  }

  if (minLng === Infinity || minLat === Infinity) return [];

  const N = blocks.length;
  const width = maxLng - minLng;
  const height = maxLat - minLat;

  // Generate N deterministic seed points inside the bounding box
  const seeds: [number, number][] = [];
  const cols = Math.ceil(Math.sqrt(N));
  const rows = Math.ceil(N / cols);

  let seedIdx = 0;
  for (let r = 0; r < rows && seedIdx < N; r++) {
    for (let c = 0; c < cols && seedIdx < N; c++) {
      const gridX = minLng + ((c + 0.5) / cols) * width;
      const gridY = minLat + ((r + 0.5) / rows) * height;
      
      // Jitter seeds to make Voronoi cells look like irregular administrative block polygons
      const jitterX = (Math.sin(seedIdx * 19.7 + 2.3) * 0.25) * (width / cols);
      const jitterY = (Math.cos(seedIdx * 13.9 + 4.1) * 0.25) * (height / rows);
      
      seeds.push([gridX + jitterX, gridY + jitterY]);
      seedIdx++;
    }
  }

  return blocks.map((blockName, i) => {
    const si = seeds[i];

    const clipPolygon = (polygonCoords: any[][]) => {
      let currentCoords = polygonCoords.map(ring => ring.map(pt => [pt[0], pt[1]] as [number, number]));
      
      for (let j = 0; j < N; j++) {
        if (i === j) continue;
        const sj = seeds[j];
        
        const mx = (si[0] + sj[0]) / 2;
        const my = (si[1] + sj[1]) / 2;
        const dx = sj[0] - si[0];
        const dy = sj[1] - si[1];
        const ax = -dx;
        const ay = -dy;
        
        currentCoords = currentCoords.map(ring => {
          return clipPolygonHalfPlane(ring, ax, ay, mx, my);
        }).filter(ring => ring.length >= 3);
      }
      return currentCoords;
    };

    let blockGeom: any;
    if (geom.type === "Polygon") {
      const coords = clipPolygon(geom.coordinates);
      blockGeom = {
        type: "Polygon",
        coordinates: coords
      };
    } else if (geom.type === "MultiPolygon") {
      const polys = geom.coordinates.map((poly: any) => clipPolygon(poly)).filter((poly: any) => poly.length > 0);
      blockGeom = {
        type: "MultiPolygon",
        coordinates: polys
      };
    }

    return {
      type: "Feature",
      properties: {
        blockName,
        districtName
      },
      geometry: blockGeom
    };
  });
}

export function MapPanel({
  districtsData,
  activeLayer,
  selectedDistrict,
  onSelectDistrict,
  selectedBlock,
  onSelectBlock,
}: MapPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const geoJsonLayerRef = useRef<L.GeoJSON | null>(null);
  const hasSelection = !!selectedDistrict;

  /* ── GeoJSON sources ── */
  const { data: geojsonData } = useQuery({
    queryKey: ['up-geojson'],
    queryFn: async () => {
      const res = await fetch(
        'https://raw.githubusercontent.com/udit-001/india-maps-data/main/geojson/states/uttar-pradesh.geojson'
      );
      return res.json();
    },
    staleTime: Infinity,
  });

  const { data: indiaStatesData } = useQuery({
    queryKey: ['india-states-geojson'],
    queryFn: async () => {
      const res = await fetch(
        'https://raw.githubusercontent.com/geohacker/india/master/state/india_state.geojson'
      );
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

  const selectedDistrictFeature = useMemo(() => {
    if (!selectedDistrict || !geojsonData) return null;
    return geojsonData.features?.find((f: any) => {
      const raw = f.properties?.dtname ?? f.properties?.district ?? f.properties?.DISTRICT ?? "";
      return normalizeDistrictName(raw) === selectedDistrict;
    });
  }, [selectedDistrict, geojsonData]);

  const blockFeatures = useMemo(() => {
    if (!selectedDistrictFeature || !selectedDistrict) return [];
    const blocks = getBlocksForDistrict(selectedDistrict);
    return generateDummyBlocks(selectedDistrictFeature, blocks);
  }, [selectedDistrictFeature, selectedDistrict]);

  /* ── India state style — dims when a district is selected ── */
  const indiaStateStyle = useCallback(() => ({
    fillColor: "#c8d6e0",
    weight: 0.8,
    color: "#9eafc0",
    fillOpacity: hasSelection ? 0.12 : 0.30,
    opacity: 0.7,
  }), [hasSelection]);

  /* ── District fill style ── */
  const geoJsonStyle = useCallback((feature: any) => {
    const rawName = feature?.properties?.dtname ?? feature?.properties?.district ?? feature?.properties?.DISTRICT ?? "";
    const districtName = normalizeDistrictName(rawName);
    const data = dataLookup[districtName];
    const category = getCategoryForDistrict(data, activeLayer);
    const color = getCategoryColor(activeLayer, category);
    const isSelected = selectedDistrict === districtName;
    const isSearched = searchedDistrict && districtName.toLowerCase().includes(searchedDistrict);

    if (hasSelection) {
      if (selectedBlock) {
        if (isSelected) {
          // Hide selected district shape when block is active
          return {
            fillColor: "transparent",
            weight: 0,
            opacity: 0,
            fillOpacity: 0,
          };
        } else {
          // Extreme dimming for other districts when block is active
          return {
            fillColor: color,
            weight: 0.5,
            opacity: 0.15,
            color: "rgba(255,255,255,0.3)",
            fillOpacity: 0.08,
          };
        }
      } else {
        if (isSelected) {
          // Bold highlight for selected district
          return {
            fillColor: color,
            weight: 3.5,
            opacity: 1,
            color: "#000000",
            fillOpacity: 0.97,
          };
        } else {
          // Moderate dimming for other districts when district is active
          return {
            fillColor: color,
            weight: 0.7,
            opacity: 0.6,
            color: "rgba(255,255,255,0.4)",
            fillOpacity: 0.25,
          };
        }
      }
    }

    return {
      fillColor: color,
      weight:      isSelected ? 3.5 : isSearched ? 2 : 0.7,
      opacity:     1,
      color:       isSelected ? "#000000" : isSearched ? "#22d3ee" : "rgba(255,255,255,0.6)",
      fillOpacity: isSelected ? 0.97 : 0.78,
      dashArray:   isSearched && !isSelected ? "4,3" : undefined,
    };
  }, [dataLookup, activeLayer, selectedDistrict, selectedBlock, searchedDistrict, hasSelection]);

  /* ── Per-feature tooltip & click ── */
  const onEachFeature = useCallback((feature: any, layer: any) => {
    const rawName = feature?.properties?.dtname ?? feature?.properties?.district ?? feature?.properties?.DISTRICT ?? "";
    const districtName = normalizeDistrictName(rawName);
    const data = dataLookup[districtName];

    let catHtml = "";
    let metric  = "";

    if (data) {
      const category = getCategoryForDistrict(data, activeLayer);
      const color    = getCategoryColor(activeLayer, category);

      if (activeLayer === "wheat_risk")
        metric = `CHI ${data.risk?.mean_chi?.toFixed(1)}`;
      else if (activeLayer === "drought_stress")
        metric = `${data.rainfall?.deviation_pct > 0 ? "+" : ""}${data.rainfall?.deviation_pct}% rf`;
      else if (activeLayer === "heat_stress")
        metric = `${data.temperature?.anomaly_c > 0 ? "+" : ""}${data.temperature?.anomaly_c}°C`;

      catHtml = `
        <div style="margin-top:5px;display:flex;align-items:center;gap:6px">
          <span style="color:${color};font-size:11px;font-weight:800;letter-spacing:0.03em">${category}</span>
          <span style="color:#94a3b8;font-size:11px">·</span>
          <span style="font-size:11px;font-weight:700;color:#1e293b;font-variant-numeric:tabular-nums">${metric}</span>
        </div>
        <div style="margin-top:4px;font-size:9px;color:#94a3b8;font-style:italic">
          Single composite score · click for breakdown
        </div>`;
    }

    const tooltipHtml = `
      <div style="background:#fff;border-radius:8px;padding:10px 13px;min-width:170px;
        box-shadow:0 8px 24px -4px rgba(0,0,0,0.20),0 2px 8px rgba(0,0,0,0.10)">
        <div style="font-weight:800;font-size:14px;color:#0f172a;line-height:1.2">${districtName}</div>
        <div style="font-size:9px;font-weight:600;color:#94a3b8;letter-spacing:0.08em;text-transform:uppercase;margin-top:1px">
          Uttar Pradesh
        </div>
        ${catHtml}
      </div>`;

    layer.bindTooltip(tooltipHtml, { sticky: true, className: "wr-tooltip-wrap", opacity: 1 });

    layer.on({
      click: () => onSelectDistrict(districtName),
      mouseover: (e: any) => {
        e.target.setStyle({ weight: 3.5, fillOpacity: 0.97, color: "#000000" });
        e.target.bringToFront();
      },
      mouseout: (e: any) => {
        const l = e.target;
        if (geoJsonLayerRef.current) geoJsonLayerRef.current.resetStyle(l);
        if (selectedDistrict === districtName)
          l.setStyle({ weight: 3.5, color: "#000000", fillOpacity: 0.97 });
        l.bringToFront();
      },
    });
  }, [dataLookup, activeLayer, selectedDistrict, onSelectDistrict]);

  return (
    <div className="relative flex-1 flex flex-col h-full overflow-hidden" style={{ background: "#dde8ef" }}>

      {/* Search overlay */}
      <div className="absolute top-3 left-3 z-[400]">
        <div
          className="flex items-center gap-2 bg-white rounded-lg shadow-lg overflow-hidden h-9"
          style={{ border: "1px solid #e2e8f0", minWidth: 220 }}
        >
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

      {/* Active-layer badge */}
      <div className="absolute top-3 right-3 z-[400]">
        <div
          className="flex items-center gap-1.5 bg-white/95 backdrop-blur-sm rounded-lg shadow-md px-3 h-9"
          style={{ border: "1px solid #e2e8f0" }}
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs font-semibold text-slate-700">{LAYER_LABELS[activeLayer]}</span>
        </div>
      </div>

      {/* Block mode badge */}
      {selectedBlock && (
        <div className="absolute top-14 right-3 z-[400]">
          <div
            className="rounded-lg px-3 py-1.5 text-xs font-bold text-teal-700 shadow-md"
            style={{ background: "#f0fdfa", border: "1px solid #5eead4" }}
          >
            Block view: {selectedBlock}
          </div>
        </div>
      )}

      {/* Map */}
      <MapContainer
        center={[22.5, 80.0]}
        zoom={4}
        zoomControl={false}
        className="w-full h-full"
        style={{ background: "#dde8ef" }}
      >
        <ZoomControl position="bottomright" />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
          opacity={0.65}
        />

        {/* India states — gray context; key toggles dim when selection changes */}
        {indiaStatesData && (
          <GeoJSON
            key={`india-${hasSelection}`}
            data={indiaStatesData}
            style={indiaStateStyle}
            interactive={false}
          />
        )}

        {/* Surrounding State Labels */}
        {indiaStatesData &&
          indiaStatesData.features.map((feature: any) => {
            const stateName = feature.properties?.NAME_1;
            if (!stateName) return null;

            // Calculate center
            const center = getGeometryCenter(feature.geometry);
            if (!center) return null;

            return (
              <Marker
                key={`label-${stateName}`}
                position={center}
                icon={L.divIcon({
                  html: `<div style="
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    text-align: center;
                    transform: translate(-50%, -50%);
                    font-size: 8px;
                    font-weight: 700;
                    color: #475569;
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                    white-space: nowrap;
                    text-shadow: -1.5px -1.5px 0 #ffffffbb, 1.5px -1.5px 0 #ffffffbb, -1.5px 1.5px 0 #ffffffbb, 1.5px 1.5px 0 #ffffffbb;
                    pointer-events: none;
                  ">${stateName}</div>`,
                  className: 'state-label-icon',
                  iconSize: [0, 0],
                  iconAnchor: [0, 0],
                })}
                interactive={false}
              />
            );
          })}

        {/* UP districts — colored by risk */}
        {geojsonData && (
          <GeoJSON
            key={`up-${activeLayer}-${selectedDistrict ?? "none"}-${hasSelection}-${districtsData?.length ?? 0}-${districtsData?.[0]?.risk?.mean_chi ?? 0}`}
            ref={(r) => { geoJsonLayerRef.current = r; }}
            data={geojsonData}
            style={geoJsonStyle}
            onEachFeature={onEachFeature}
          />
        )}

        {/* Dummy blocks for the selected district */}
        {selectedDistrict && selectedBlock && blockFeatures.length > 0 &&
          blockFeatures.map((blockFeat: BlockFeature) => {
            const blockName = blockFeat.properties.blockName;
            const blockData = getBlockData(selectedDistrict, blockName);
            const isBlockSelected = selectedBlock === blockName;
            const blockColor = getCategoryColor("wheat_risk", blockData.risk.level);

            return (
              <GeoJSON
                key={`block-${selectedDistrict}-${blockName}-${isBlockSelected}-${activeLayer}`}
                data={blockFeat}
                style={{
                  fillColor: blockColor,
                  fillOpacity: selectedBlock ? (isBlockSelected ? 0.95 : 0.25) : 0.75,
                  color: isBlockSelected ? "#000000" : "#ffffff",
                  weight: isBlockSelected ? 3 : 1,
                  opacity: isBlockSelected ? 1 : 0.6,
                }}
                eventHandlers={{
                  click: () => onSelectBlock(blockName),
                  mouseover: (e: any) => {
                    e.target.setStyle({
                      weight: isBlockSelected ? 3 : 2,
                      fillOpacity: isBlockSelected ? 0.95 : 0.85,
                      color: isBlockSelected ? "#000000" : "#ffffff"
                    });
                  },
                  mouseout: (e: any) => {
                    e.target.setStyle({
                      weight: isBlockSelected ? 3 : 1,
                      fillOpacity: selectedBlock ? (isBlockSelected ? 0.95 : 0.25) : 0.75,
                      color: isBlockSelected ? "#000000" : "#ffffff"
                    });
                  }
                }}
              >
                {/* Click tooltip for block */}
                <Tooltip sticky className="wr-tooltip-wrap">
                  <div style={{
                    background: "#fff",
                    borderRadius: "8px",
                    padding: "8px 12px",
                    minWidth: "150px",
                    boxShadow: "0 8px 24px -4px rgba(0,0,0,0.20), 0 2px 8px rgba(0,0,0,0.10)"
                  }}>
                    <div style={{ fontWeight: 800, fontSize: "13px", color: "#0f172a" }}>{blockName}</div>
                    <div style={{ fontSize: "9px", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", marginTop: "1px" }}>
                      {selectedDistrict} District
                    </div>
                    <div style={{ marginTop: "5px", display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ color: blockColor, fontSize: "11px", fontWeight: 800 }}>{blockData.risk.level}</span>
                      <span style={{ color: "#94a3b8", fontSize: "11px" }}>·</span>
                      <span style={{ fontSize: "11px", fontWeight: 700, color: "#1e293b" }}>
                        CHI {blockData.risk.mean_chi.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </Tooltip>
              </GeoJSON>
            );
          })
        }

        {/* Labels on top */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/voyager_only_labels/{z}/{x}/{y}{r}.png"
          opacity={0.75}
          zIndex={400}
        />

        {/* Fit India on initial load */}
        <FitIndia indiaData={indiaStatesData} />

        {/* Zoom to selected district / back to UP */}
        <ZoomToSelection
          geojsonData={geojsonData}
          selectedDistrict={selectedDistrict}
          selectedBlock={selectedBlock}
        />
      </MapContainer>

      {/* Attribution */}
      <div className="absolute bottom-2 left-2 z-[400] text-[9px] text-slate-400 font-medium bg-white/75 px-2 py-0.5 rounded select-none">
        &copy; OpenStreetMap &middot; CARTO &middot; IMD
      </div>
    </div>
  );
}
