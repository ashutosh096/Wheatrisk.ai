/**
 * District name normalization map.
 * Maps GeoJSON feature property names → canonical API district names.
 * The GeoJSON from github.com/udit-001/india-maps-data may use slightly
 * different spellings than IMD/Census district lists.
 */
const GEOJSON_TO_CANONICAL: Record<string, string> = {
  // Common GeoJSON variations → canonical names used in sample data
  "Bhadohi":             "Sant Kabir Nagar",   // Some GeoJSON use Bhadohi for this region
  "Sant Ravidas Nagar":  "Sant Kabir Nagar",
  "Rae Bareli":          "Raebareli",
  "Rae Bareilly":        "Raebareli",
  "Raibareilly":         "Raebareli",
  "Shrawasti":           "Shravasti",
  "Shahjahanpur":        "Shahjahanpur",
  "Kheri":               "Lakhimpur Kheri",
  "Lakhimpur":           "Lakhimpur Kheri",
  "Kushi Nagar":         "Kushinagar",
  "Kushinagar":          "Kushinagar",
  "Hardoi":              "Hardoi",
  "Jyotiba Phule Nagar": "Amroha",
  "Jyotiba Phoolenagar": "Amroha",
  "Gautam Budh Nagar":   "Gautam Buddha Nagar",
  "Gautam Buddha Nagar": "Gautam Buddha Nagar",
  "Faizabad":            "Ayodhya",
  "Barabanki":           "Barabanki",
  "Kanpur Nagar":        "Kanpur Nagar",
  "Kanpur Dehat":        "Kanpur Dehat",
  "Muzaffarnagar":       "Muzaffarnagar",
  "Siddharthnagar":      "Siddharthnagar",
  "Siddharth Nagar":     "Siddharthnagar",
  "Budaun":              "Badaun",
  "Badaun":              "Badaun",
  "Etah":                "Etah",
  "Kasganj":             "Kasganj",
};

/**
 * Normalize a district name from GeoJSON to the canonical API name.
 * Falls back to the original name if no mapping exists.
 */
export function normalizeDistrictName(geoJsonName: string): string {
  if (!geoJsonName) return geoJsonName;
  return GEOJSON_TO_CANONICAL[geoJsonName] ?? geoJsonName;
}
