import { Router } from "express";
import { AVAILABLE_SEASONS, AVAILABLE_GROWTH_STAGES } from "../data/sampleData.js";

const router = Router();

// GET /api/filters/seasons
router.get("/seasons", (_req, res) => {
  res.json(AVAILABLE_SEASONS);
});

// GET /api/filters/growth-stages
router.get("/growth-stages", (_req, res) => {
  res.json(AVAILABLE_GROWTH_STAGES);
});

export default router;
