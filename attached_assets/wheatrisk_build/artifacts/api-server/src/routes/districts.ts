import { Router } from "express";
import {
  getAllDistrictsData,
  getDistrictData,
} from "../data/sampleData.js";

const router = Router();

// GET /api/districts — list all districts with risk data
router.get("/", (req, res) => {
  const season = (req.query["season"] as string) || "2025-26";
  const growth_stage = (req.query["growth_stage"] as string) || "Flowering (Feb)";
  const data = getAllDistrictsData(season, growth_stage);
  res.json(data);
});

// GET /api/districts/detail?district=Agra&season=2025-26&growth_stage=Flowering (Feb)
router.get("/detail", (req, res) => {
  const district = req.query["district"] as string;
  const season = (req.query["season"] as string) || "2025-26";
  const growth_stage = (req.query["growth_stage"] as string) || "Flowering (Feb)";

  if (!district) {
    res.status(400).json({ error: "district query parameter is required" });
    return;
  }

  const data = getDistrictData(district, season, growth_stage);
  if (!data) {
    res.status(404).json({ error: `District '${district}' not found` });
    return;
  }

  res.json(data);
});

// GET /api/districts/distribution — distribution stats across all districts
router.get("/distribution", (req, res) => {
  const season = (req.query["season"] as string) || "2025-26";
  const growth_stage = (req.query["growth_stage"] as string) || "Flowering (Feb)";
  const layer = (req.query["layer"] as string) || "wheat_risk";

  const data = getAllDistrictsData(season, growth_stage);

  let categoryField: "level" | "category";
  let categoryMap: Record<string, string>;

  if (layer === "drought_stress") {
    categoryMap = { Excess: "Excess", Normal: "Normal", Deficient: "Deficient", Scanty: "Scanty", "No Rain": "No Rain" };
    const counts: Record<string, number> = { Excess: 0, Normal: 0, Deficient: 0, Scanty: 0, "No Rain": 0 };
    data.forEach((d) => { counts[d.rainfall.category] = (counts[d.rainfall.category] || 0) + 1; });
    const distribution = Object.entries(counts)
      .filter(([, count]) => count > 0)
      .map(([category, count]) => ({
        category,
        count,
        percentage: Math.round((count / data.length) * 100),
      }));
    const favorableCount = (counts["Excess"] || 0) + (counts["Normal"] || 0);
    const elevatedCount = (counts["Deficient"] || 0) + (counts["Scanty"] || 0) + (counts["No Rain"] || 0);
    res.json({ total_districts: data.length, favorable_count: favorableCount, elevated_count: elevatedCount, distribution });
    return;
  }

  if (layer === "heat_stress") {
    const counts: Record<string, number> = { Cooler: 0, Normal: 0, Warm: 0, Hot: 0, Extreme: 0 };
    data.forEach((d) => { counts[d.temperature.category] = (counts[d.temperature.category] || 0) + 1; });
    const distribution = Object.entries(counts)
      .filter(([, count]) => count > 0)
      .map(([category, count]) => ({
        category,
        count,
        percentage: Math.round((count / data.length) * 100),
      }));
    const favorableCount = (counts["Cooler"] || 0) + (counts["Normal"] || 0);
    const elevatedCount = (counts["Hot"] || 0) + (counts["Extreme"] || 0);
    res.json({ total_districts: data.length, favorable_count: favorableCount, elevated_count: elevatedCount, distribution });
    return;
  }

  // Default: wheat_risk
  const counts: Record<string, number> = { "Very Low": 0, Low: 0, Moderate: 0, High: 0, "Very High": 0 };
  data.forEach((d) => { counts[d.risk.level] = (counts[d.risk.level] || 0) + 1; });
  const distribution = Object.entries(counts)
    .filter(([, count]) => count > 0)
    .map(([category, count]) => ({
      category,
      count,
      percentage: Math.round((count / data.length) * 100),
    }));
  const favorableCount = (counts["Very Low"] || 0) + (counts["Low"] || 0);
  const elevatedCount = (counts["High"] || 0) + (counts["Very High"] || 0);
  res.json({ total_districts: data.length, favorable_count: favorableCount, elevated_count: elevatedCount, distribution });
});

export default router;
