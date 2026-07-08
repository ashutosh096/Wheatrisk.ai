/**
 * Deterministic synthetic block-level data generator.
 * Uses a simple string hash to seed all values — same input always
 * produces the same output, so the UI stays stable across renders.
 */

export interface BlockData {
  block: string;
  district: string;
  state: string;
  season: string;
  risk: {
    level: string;
    mean_chi: number;
    p95_tail: number;
    p5_floor: number;
    volatility: number;
    dna: {
      drought: number;
      tail_risk: number;
      volatility: number;
      floor: number;
      premium: number;
    };
  };
  recommendation: {
    text: string;
    pd_adjustment_pct: number;
    lgd_adjustment_pct: number;
  };
}

export interface DistrictBlockSummary {
  total: number;
  highVhCount: number;
  districtAvgChi: number;
  blockChiValues: { block: string; chi: number; level: string }[];
  worstBlock: { block: string; chi: number; level: string } | null;
  percentileRank: number;
  chiMin: number;
  chiMax: number;
}

/* ─── deterministic hash ─── */
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

const RISK_LEVELS = ["Very Low", "Low", "Moderate", "High", "Very High"];

const RISK_TEXTS: Record<string, string> = {
  "Very Low":
    "Standard underwriting criteria apply. No additional collateral requirements at this time.",
  "Low":
    "Standard underwriting criteria apply. No additional collateral requirements at this time.",
  "Moderate":
    "Apply moderate risk buffer. Consider additional collateral for loans above ₹10L.",
  "High":
    "Elevated risk — apply enhanced due diligence. Recommend 15% collateral uplift and shorter loan tenor.",
  "Very High":
    "Very high risk — consider deferring new disbursements. Existing portfolio monitoring required.",
};

const PD_MAP: Record<string, number>  = { "Very Low": -0.3, Low: 0.2, Moderate: 0.8, High: 1.5, "Very High": 2.5 };
const LGD_MAP: Record<string, number> = { "Very Low": -1,   Low: 1,   Moderate: 2,   High: 3,   "Very High": 4   };

/* ─── public API ─── */

export function getBlockData(district: string, block: string): BlockData {
  const seed = hashStr(`${district}||${block}`);

  const levelIdx = seed % 5;
  const level = RISK_LEVELS[levelIdx];

  const mean_chi  = seededFloat(seed + 1, 27, 49);
  const p95_tail  = seededFloat(seed + 2, mean_chi + 2,  mean_chi + 16);
  const p5_floor  = seededFloat(seed + 3, Math.max(15, mean_chi - 16), mean_chi - 1);
  const volatility = seededFloat(seed + 4, 44, 88);

  return {
    block,
    district,
    state: "Uttar Pradesh",
    season: "2025-26",
    risk: {
      level,
      mean_chi,
      p95_tail,
      p5_floor,
      volatility,
      dna: {
        drought:    seededFloat(seed + 10, 15, 95, 0),
        tail_risk:  seededFloat(seed + 11, 15, 95, 0),
        volatility: seededFloat(seed + 12, 15, 95, 0),
        floor:      seededFloat(seed + 13, 15, 95, 0),
        premium:    seededFloat(seed + 14, 15, 95, 0),
      },
    },
    recommendation: {
      text: RISK_TEXTS[level],
      pd_adjustment_pct:  PD_MAP[level],
      lgd_adjustment_pct: LGD_MAP[level],
    },
  };
}

export function getDistrictBlockSummary(
  district: string,
  blocks: string[],
  districtChi: number,
): DistrictBlockSummary {
  const items = blocks.map((b) => {
    const d = getBlockData(district, b);
    return { block: b, chi: d.risk.mean_chi, level: d.risk.level };
  });

  const highVhCount = items.filter(
    (b) => b.level === "High" || b.level === "Very High",
  ).length;

  const sorted = [...items].sort((a, b) => b.chi - a.chi);
  const worst  = sorted[0] ?? null;

  const chiValues = items.map((b) => b.chi);
  const chiMin = Math.min(...chiValues, districtChi) - 0.5;
  const chiMax = Math.max(...chiValues, districtChi) + 0.5;

  const seed          = hashStr(district + "pct");
  const percentileRank = Math.max(1, Math.min(99, Math.round(seededFloat(seed, 18, 92, 0))));

  return {
    total: blocks.length,
    highVhCount,
    districtAvgChi: districtChi,
    blockChiValues: items,
    worstBlock: worst,
    percentileRank,
    chiMin,
    chiMax,
  };
}
