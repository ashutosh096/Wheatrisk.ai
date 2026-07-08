// WheatRisk.ai — Sample data for 75 Uttar Pradesh districts
// Phase 1: Demo data matching the exact schema
// Phase 2+: Replace by pointing API_BASE_URL to a real backend with Postgres/Redis

export interface RiskDna {
  drought: number;
  tail_risk: number;
  volatility: number;
  floor: number;
  premium: number;
}

export interface RiskMetrics {
  level: "Very Low" | "Low" | "Moderate" | "High" | "Very High";
  mean_chi: number;
  p95_tail: number;
  p5_floor: number;
  volatility: number;
  dna: RiskDna;
}

export interface RainfallData {
  actual_mm: number;
  normal_mm: number;
  deviation_pct: number;
  category: "Excess" | "Normal" | "Deficient" | "Scanty" | "No Rain";
}

export interface TemperatureData {
  actual_c: number;
  normal_c: number;
  anomaly_c: number;
  category: "Cooler" | "Normal" | "Warm" | "Hot" | "Extreme";
}

export interface TrajectoryPoint {
  stage: string;
  actual: number;
  normal: number;
}

export interface Recommendation {
  text: string;
  pd_adjustment_pct: number;
  lgd_adjustment_pct: number;
}

export interface DistrictRisk {
  district: string;
  state: string;
  season: string;
  growth_stage: string;
  risk: RiskMetrics;
  rainfall: RainfallData;
  temperature: TemperatureData;
  trajectory: TrajectoryPoint[];
  recommendation: Recommendation;
}

const STAGES = ["Sowing", "Tillering", "Stem Extension", "Flowering", "Grain Filling", "Harvest"];

function buildTrajectory(
  baseNormal: number,
  variance: number
): TrajectoryPoint[] {
  return STAGES.map((stage, i) => {
    const normal = Math.round((baseNormal + i * 6 + [0, 2, 4, 6, 8, 10][i]) * 10) / 10;
    const drift = (Math.random() - 0.5) * variance * 2;
    const actual = Math.round((normal + drift) * 10) / 10;
    return { stage, actual, normal };
  });
}

function recommendation(level: string): Recommendation {
  switch (level) {
    case "Very Low":
      return {
        text: "Excellent crop conditions. Standard loan terms apply. No additional risk premium required. Annual review sufficient.",
        pd_adjustment_pct: 0.2,
        lgd_adjustment_pct: 1,
      };
    case "Low":
      return {
        text: "Standard collateral norms apply. Crop insurance advised for high-value loans. Annual review sufficient.",
        pd_adjustment_pct: 0.6,
        lgd_adjustment_pct: 3,
      };
    case "Moderate":
      return {
        text: "Mild climate stress detected. Crop insurance mandatory. Apply moderate PD uplift and require additional collateral coverage.",
        pd_adjustment_pct: 1.5,
        lgd_adjustment_pct: 6,
      };
    case "High":
      return {
        text: "Elevated climate risk. Enhanced due diligence required. Crop insurance mandatory. Reduce loan-to-value ratios. Semi-annual review.",
        pd_adjustment_pct: 3.2,
        lgd_adjustment_pct: 12,
      };
    case "Very High":
      return {
        text: "Severe climate risk. Exercise extreme caution. If lending, require comprehensive crop insurance, additional security, and co-borrower. Quarterly review mandatory.",
        pd_adjustment_pct: 5.8,
        lgd_adjustment_pct: 22,
      };
    default:
      return {
        text: "Insufficient data. Manual assessment required.",
        pd_adjustment_pct: 2,
        lgd_adjustment_pct: 8,
      };
  }
}

// Deterministic seed generator for reproducible demo data
// Uses Murmur-like seed mixing + LCG for uniform distribution
function seededRand(seed: number): () => number {
  // Mix the seed thoroughly so that nearby seeds produce very different sequences
  let s = seed >>> 0;
  s ^= s >>> 16;
  s = Math.imul(s, 0x45d9f3b) >>> 0;
  s ^= s >>> 16;
  s = Math.imul(s, 0x45d9f3b) >>> 0;
  s ^= s >>> 16;
  s ^= seed * 2654435761;
  s = s >>> 0;

  return () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

const UP_DISTRICTS = [
  "Agra", "Aligarh", "Ambedkar Nagar", "Amethi", "Amroha", "Auraiya",
  "Ayodhya", "Azamgarh", "Badaun", "Baghpat", "Bahraich", "Ballia",
  "Balrampur", "Banda", "Barabanki", "Bareilly", "Basti", "Bijnor",
  "Budaun", "Bulandshahr", "Chandauli", "Chitrakoot", "Deoria", "Etah",
  "Etawah", "Farrukhabad", "Fatehpur", "Firozabad", "Gautam Buddha Nagar",
  "Ghaziabad", "Ghazipur", "Gonda", "Gorakhpur", "Hamirpur", "Hapur",
  "Hardoi", "Hathras", "Jalaun", "Jaunpur", "Jhansi", "Kannauj",
  "Kanpur Dehat", "Kanpur Nagar", "Kasganj", "Kaushambi", "Kushinagar",
  "Lakhimpur Kheri", "Lalitpur", "Lucknow", "Maharajganj", "Mahoba",
  "Mainpuri", "Mathura", "Mau", "Meerut", "Mirzapur", "Moradabad",
  "Muzaffarnagar", "Pilibhit", "Pratapgarh", "Prayagraj", "Raebareli",
  "Rampur", "Saharanpur", "Sambhal", "Sant Kabir Nagar", "Shahjahanpur",
  "Shamli", "Shravasti", "Siddharthnagar", "Sitapur", "Sonbhadra",
  "Sultanpur", "Unnao", "Varanasi",
];

const RISK_LEVELS: Array<RiskMetrics["level"]> = [
  "Very Low", "Low", "Moderate", "High", "Very High"
];

const RAINFALL_CATS: Array<RainfallData["category"]> = [
  "Excess", "Normal", "Deficient", "Scanty", "No Rain"
];

const TEMP_CATS: Array<TemperatureData["category"]> = [
  "Cooler", "Normal", "Warm", "Hot", "Extreme"
];

function buildDistrictData(
  district: string,
  season: string,
  growthStage: string
): DistrictRisk {
  const seed =
    district.charCodeAt(0) * 7 +
    district.charCodeAt(1) * 13 +
    season.charCodeAt(0) * 3 +
    growthStage.charCodeAt(0) * 17;
  const rand = seededRand(seed);

  const riskIdx = Math.floor(rand() * 5);
  const level = RISK_LEVELS[riskIdx];

  // Mean CHI scales with risk level
  const chiBase = [15, 30, 50, 68, 82][riskIdx];
  const mean_chi = Math.round((chiBase + rand() * 15) * 10) / 10;
  const p95_tail = Math.round((mean_chi + 20 + rand() * 25) * 10) / 10;
  const p5_floor = Math.round((rand() * 20) * 10) / 10;
  const volatility = Math.round((30 + rand() * 50) * 10) / 10;

  const dna: RiskDna = {
    drought: Math.round(rand() * 80 + 10),
    tail_risk: Math.round(rand() * 80 + 10),
    volatility: Math.round(rand() * 80 + 10),
    floor: Math.round(rand() * 60 + 5),
    premium: Math.round(rand() * 70 + 15),
  };

  // Rainfall category loosely correlated with risk
  const rfCatIdx = riskIdx === 0
    ? Math.floor(rand() * 2)
    : riskIdx === 4
    ? Math.floor(rand() * 2) + 3
    : Math.floor(rand() * 3) + 1;
  const rfCat = RAINFALL_CATS[Math.min(rfCatIdx, 4)];

  const rfNormal = Math.round((8 + rand() * 35) * 10) / 10;
  let rfActual: number;
  let rfDev: number;
  switch (rfCat) {
    case "Excess":
      rfDev = Math.round((20 + rand() * 80) * 10) / 10;
      rfActual = Math.round((rfNormal * (1 + rfDev / 100)) * 10) / 10;
      break;
    case "Normal":
      rfDev = Math.round((rand() * 18 - 9) * 10) / 10;
      rfActual = Math.round((rfNormal * (1 + rfDev / 100)) * 10) / 10;
      break;
    case "Deficient":
      rfDev = -Math.round((20 + rand() * 39) * 10) / 10;
      rfActual = Math.round((rfNormal * (1 + rfDev / 100)) * 10) / 10;
      break;
    case "Scanty":
      rfDev = -Math.round((60 + rand() * 39) * 10) / 10;
      rfActual = Math.round((rfNormal * (1 + rfDev / 100)) * 10) / 10;
      break;
    default:
      rfDev = -100;
      rfActual = 0;
  }

  const tmpNormal = Math.round((33 + rand() * 8) * 10) / 10;
  const tmpCatIdx = [0, 1, 2, 3, 4][Math.min(riskIdx, 4)];
  const tmpCat = TEMP_CATS[tmpCatIdx];
  const anomalyMap: Record<string, number> = {
    Cooler: -2 - rand() * 2,
    Normal: rand() * 1.5 - 0.75,
    Warm: 1 + rand() * 2,
    Hot: 3 + rand() * 2,
    Extreme: 5 + rand() * 3,
  };
  const anomaly_c = Math.round(anomalyMap[tmpCat] * 100) / 100;
  const actual_c = Math.round((tmpNormal + anomaly_c) * 10) / 10;

  const baseNormal = 28 + riskIdx * 3;
  const variance = 2 + riskIdx * 1.5;

  return {
    district,
    state: "Uttar Pradesh",
    season,
    growth_stage: growthStage,
    risk: { level, mean_chi, p95_tail, p5_floor, volatility, dna },
    rainfall: { actual_mm: rfActual, normal_mm: rfNormal, deviation_pct: rfDev, category: rfCat },
    temperature: { actual_c, normal_c: tmpNormal, anomaly_c, category: tmpCat },
    trajectory: buildTrajectory(baseNormal, variance),
    recommendation: recommendation(level),
  };
}

export const AVAILABLE_SEASONS = ["2023-24", "2024-25", "2025-26"];
export const AVAILABLE_GROWTH_STAGES = [
  { id: "sowing", label: "Sowing", period: "Oct–Nov" },
  { id: "tillering", label: "Tillering", period: "Dec" },
  { id: "stem_extension", label: "Stem Extension", period: "Jan" },
  { id: "flowering", label: "Flowering", period: "Feb" },
  { id: "grain_filling", label: "Grain Filling", period: "Mar" },
  { id: "harvest", label: "Harvest", period: "Apr" },
];

// Build a lookup cache for all districts × seasons × stages
const cache = new Map<string, DistrictRisk>();

function cacheKey(district: string, season: string, growthStage: string) {
  return `${district}|${season}|${growthStage}`;
}

export function getDistrictData(
  district: string,
  season = "2025-26",
  growthStage = "Flowering (Feb)"
): DistrictRisk | null {
  const d = UP_DISTRICTS.find(
    (n) => n.toLowerCase() === district.toLowerCase()
  );
  if (!d) return null;
  const key = cacheKey(d, season, growthStage);
  if (!cache.has(key)) {
    cache.set(key, buildDistrictData(d, season, growthStage));
  }
  return cache.get(key)!;
}

export function getAllDistrictsData(
  season = "2025-26",
  growthStage = "Flowering (Feb)"
): DistrictRisk[] {
  return UP_DISTRICTS.map((d) => getDistrictData(d, season, growthStage)!);
}

export { UP_DISTRICTS };
