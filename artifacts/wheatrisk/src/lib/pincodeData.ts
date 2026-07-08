import { getCategoryColor } from "./colorUtils";

export interface VillageRisk {
  name: string;
  block: string;
  areaPct: number;
  chi: number;
  level: string;
}

export interface PincodeData {
  pincode: string;
  areaName: string;
  block: string;
  district: string;
  riskRange: string;
  confidence: string;
  weightedMeanChi: number;
  p95Tail: number;
  p5Floor: number;
  spread: number;
  villages: VillageRisk[];
  recommendation: {
    title: string;
    text: string;
    pd_adjustment_pct: number;
    lgd_adjustment_pct: number;
  };
}

// Simple hash function for deterministic mock data
function hashStr(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function seededFloat(seed: number, min: number, max: number, dp = 1): number {
  const x = Math.sin(seed + 1.37) * 99991;
  const r = x - Math.floor(x);
  return parseFloat((min + r * (max - min)).toFixed(dp));
}

const VILLAGE_NAMES = [
  "Kachhpura", "Nagla Suraj", "Rampura Khera", "Bhatpura",
  "Gopalpura", "Prem Nagar", "Govindpur", "Kishanpur",
  "Laxmanpur", "Mohanpur", "Chandpur", "Saranga",
  "Shahpur", "Firozpur", "Madhavpur", "Kalyanpur"
];

const RISK_LEVELS = ["Very Low", "Low", "Moderate", "High", "Very High"];

const DISTRICT_PIN_PREFIX: Record<string, string> = {
  "Agra": "283",
  "Aligarh": "202",
  "Ambedkar Nagar": "224",
  "Amethi": "227",
  "Amroha": "244",
  "Auraiya": "206",
  "Ayodhya": "224",
  "Azamgarh": "276",
  "Badaun": "243",
  "Budaun": "243",
  "Baghpat": "250",
  "Bahraich": "271",
  "Ballia": "277",
  "Balrampur": "271",
  "Banda": "210",
  "Barabanki": "225",
  "Bareilly": "243",
  "Basti": "272",
  "Bijnor": "246",
  "Bulandshahr": "203",
  "Chandauli": "232",
  "Chitrakoot": "210",
  "Deoria": "274",
  "Etah": "207",
  "Etawah": "206",
  "Farrukhabad": "209",
  "Fatehpur": "212",
  "Firozabad": "283",
  "Gautam Buddha Nagar": "201",
  "Ghaziabad": "201",
  "Ghazipur": "233",
  "Gonda": "271",
  "Gorakhpur": "273",
  "Hamirpur": "210",
  "Hapur": "245",
  "Hardoi": "241",
  "Hathras": "204",
  "Jalaun": "285",
  "Jaunpur": "222",
  "Jhansi": "284",
  "Kannauj": "209",
  "Kanpur Dehat": "209",
  "Kanpur Nagar": "208",
  "Kasganj": "207",
  "Kaushambi": "212",
  "Kushinagar": "274",
  "Lakhimpur Kheri": "262",
  "Lalitpur": "284",
  "Lucknow": "226",
  "Maharajganj": "273",
  "Mahoba": "210",
  "Mainpuri": "205",
  "Mathura": "281",
  "Mau": "275",
  "Meerut": "250",
  "Mirzapur": "231",
  "Moradabad": "244",
  "Muzaffarnagar": "251",
  "Pilibhit": "262",
  "Pratapgarh": "230",
  "Prayagraj": "211",
  "Raebareli": "229",
  "Rampur": "244",
  "Saharanpur": "247",
  "Sambhal": "244",
  "Sant Kabir Nagar": "272",
  "Shahjahanpur": "242",
  "Shamli": "247",
  "Shravasti": "271",
  "Siddharthnagar": "272",
  "Sitapur": "261",
  "Sonbhadra": "231",
  "Sultanpur": "228",
  "Unnao": "209",
  "Varanasi": "221",
};

const HARDCODED_PINS: Record<string, { pincode: string; areaName: string }[]> = {
  "Agra||Bah": [
    { pincode: "283113", areaName: "Bah Town" },
    { pincode: "283104", areaName: "Bah Rural" },
    { pincode: "283114", areaName: "Bah East" }
  ],
  "Kanpur Nagar||Kalyanpur": [
    { pincode: "208016", areaName: "Kalyanpur Central" },
    { pincode: "208017", areaName: "IIT Kanpur" },
    { pincode: "208026", areaName: "Kalyanpur East" }
  ],
  "Lucknow||Mohanlalganj": [
    { pincode: "226301", areaName: "Mohanlalganj Town" },
    { pincode: "226302", areaName: "Mohanlalganj Rural" },
    { pincode: "226303", areaName: "Mohanlalganj East" }
  ],
  "Barabanki||Suratganj": [
    { pincode: "225304", areaName: "Suratganj Central" },
    { pincode: "225305", areaName: "Suratganj West" },
    { pincode: "225306", areaName: "Suratganj East" }
  ]
};

export function getPincodesForBlock(district: string, block: string): { pincode: string; areaName: string }[] {
  const normKey = `${district}||${block}`;
  if (HARDCODED_PINS[normKey]) return HARDCODED_PINS[normKey];

  const prefix = DISTRICT_PIN_PREFIX[district] ?? "208";
  const seed = hashStr(normKey);
  
  // Generate 3 pincodes: prefix + 3 digits
  const d1 = String(101 + (seed % 800)).padStart(3, "0");
  const d2 = String(101 + ((seed + 127) % 800)).padStart(3, "0");
  const d3 = String(101 + ((seed + 589) % 800)).padStart(3, "0");
  
  const p1 = prefix + d1;
  const p2 = prefix + d2;
  const p3 = prefix + d3;
  
  // Custom area names
  const areas = [
    `${block} Central`,
    `${block} Rural`,
    `North ${block}`
  ];
  
  return [
    { pincode: p1, areaName: areas[0] },
    { pincode: p2, areaName: areas[1] },
    { pincode: p3, areaName: areas[2] }
  ];
}

export function getPincodeData(district: string, block: string, pincode: string): PincodeData {
  const seed = hashStr(pincode);
  
  // constituent villages (between 3 and 5)
  const numVillages = 3 + (seed % 3);
  const villages: VillageRisk[] = [];
  
  let totalShare = 0;
  const shares: number[] = [];
  for (let i = 0; i < numVillages; i++) {
    const rawShare = 10 + ((seed + i * 7) % 30);
    shares.push(rawShare);
    totalShare += rawShare;
  }
  
  let currentSum = 0;
  for (let i = 0; i < numVillages; i++) {
    const villageName = VILLAGE_NAMES[(seed + i) % VILLAGE_NAMES.length];
    
    // Make first village higher risk if seed is even to create variance
    const chiSeed = seed + i * 13;
    const chi = seededFloat(chiSeed, 12, 62);
    
    let level = "Low";
    if (chi < 18) level = "Very Low";
    else if (chi < 30) level = "Low";
    else if (chi < 42) level = "Moderate";
    else if (chi < 55) level = "High";
    else level = "Very High";
    
    const pct = Math.round((shares[i] / totalShare) * 100);
    
    villages.push({
      name: villageName,
      block,
      areaPct: pct,
      chi,
      level
    });
  }
  
  // Sort villages by chi descending
  villages.sort((a, b) => b.chi - a.chi);
  
  // Recalculate weights to sum to 100%
  let curSum = 0;
  villages.forEach((v, idx) => {
    if (idx === villages.length - 1) {
      v.areaPct = 100 - curSum;
    } else {
      curSum += v.areaPct;
    }
  });

  // Calculate weighted mean CHI
  let weightedSum = 0;
  villages.forEach(v => {
    weightedSum += v.chi * (v.areaPct / 100);
  });
  const weightedMeanChi = parseFloat(weightedSum.toFixed(1));
  
  const chiValues = villages.map(v => v.chi);
  const p5Floor = Math.min(...chiValues);
  const p95Tail = Math.max(...chiValues);
  const spread = parseFloat((p95Tail - p5Floor).toFixed(1));
  
  const minLevel = villages[villages.length - 1].level;
  const maxLevel = villages[0].level;
  const riskRange = minLevel === maxLevel ? minLevel : `${minLevel} - ${maxLevel}`;
  
  // Recommendation logic
  let title = "CONSERVATIVE UNDERWRITE — BLENDED PINCODE";
  let text = `Price this pincode to its highest-risk village (${villages[0].name}), not the weighted average. Recommend field verification before disbursal for applicants in high-risk zones.`;
  let pd = 0.5;
  let lgd = 2;
  
  if (p95Tail > 50) {
    title = "CONSERVATIVE UNDERWRITE — HIGH BLENDED RISK";
    text = `Significant risk variability across villages. Recommend applying enhanced due diligence. Price to highest-risk village (${villages[0].name}).`;
    pd = 1.2;
    lgd = 4;
  } else if (p95Tail < 25) {
    title = "FAVORABLE UNDERWRITE — UNIFORM RISK";
    text = "Low risk profile across all constituent villages. Standard underwriting terms apply with standard buffers.";
    pd = -0.2;
    lgd = -1;
  }

  return {
    pincode,
    areaName: `${block} Area`,
    block,
    district,
    riskRange,
    confidence: p95Tail - p5Floor > 25 ? "Medium confidence blend" : "High confidence blend",
    weightedMeanChi,
    p95Tail,
    p5Floor,
    spread,
    villages,
    recommendation: {
      title,
      text,
      pd_adjustment_pct: pd,
      lgd_adjustment_pct: lgd
    }
  };
}

export interface HistoricalDataPoint {
  year: string;
  tempAnomaly: number;
  rainfallDeviation: number;
  chi: number;
}

export function getPincodeHistoricalData(pincode: string): HistoricalDataPoint[] {
  const seed = hashStr(pincode);
  const data: HistoricalDataPoint[] = [];
  
  for (let i = 0; i <= 10; i++) {
    const year = String(2016 + i);
    const yrSeed = seed + i * 19;
    
    const rainfallDeviation = seededFloat(yrSeed, -45, 25, 0);
    const tempAnomaly = seededFloat(yrSeed + 3, -0.6, 2.8, 1);
    
    const baseChi = 22 + ((seed + i) % 18);
    const tempImpact = tempAnomaly > 0.8 ? (tempAnomaly - 0.8) * 7.5 : 0;
    const rainImpact = rainfallDeviation < -12 ? Math.abs(rainfallDeviation + 12) * 0.45 : 0;
    
    const chi = parseFloat(Math.max(10, Math.min(99, baseChi + tempImpact + rainImpact)).toFixed(1));
    
    data.push({
      year,
      tempAnomaly,
      rainfallDeviation,
      chi
    });
  }
  
  return data;
}
